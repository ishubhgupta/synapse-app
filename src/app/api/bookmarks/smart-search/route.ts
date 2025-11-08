/**
 * Smart Search API
 * 
 * Intelligent bookmark search using:
 * 1. Claude AI for query understanding
 * 2. pgvector for semantic similarity search
 * 3. Traditional filters and full-text search
 * 4. AI-powered result ranking
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { handleApiError, successResponse, unauthorizedError } from '@/lib/errors';
import { parseSearchQuery, rerankResults } from '@/lib/smartSearch';
import { generateEmbedding } from '@/lib/embeddings';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorizedError();
    }

    const body = await request.json();
    const { query, limit = 20 } = body;

    if (!query || typeof query !== 'string') {
      return successResponse({
        results: [],
        query: '',
        parsed: null,
        message: 'No query provided',
      });
    }

    console.log(`Smart search query: "${query}"`);

    // Step 1: Parse query with Claude AI
    const parsedQuery = await parseSearchQuery(query);
    console.log('Parsed query:', JSON.stringify(parsedQuery, null, 2));

    // Step 2: Generate embedding for semantic search
    let queryEmbedding: number[] = [];
    let hasEmbedding = false;
    
    // Check if embedding column exists by trying a simple query
    try {
      await prisma.$queryRaw`SELECT embedding FROM bookmarks LIMIT 1`;
      // If we get here, the column exists
      console.log('✓ Embedding column found in database');
      
      queryEmbedding = await generateEmbedding(parsedQuery.semanticQuery);
      hasEmbedding = queryEmbedding.length > 0;
      
      if (hasEmbedding) {
        console.log(`✓ Using vector search with ${queryEmbedding.length}-dimensional embedding`);
      } else {
        console.warn('⚠ Embedding generation returned empty array, falling back to keyword search');
      }
    } catch (error) {
      console.error('Embedding column check failed:', error);
      console.warn('⚠ Falling back to keyword search. Make sure you ran setup-pgvector.sql');
      hasEmbedding = false;
    }

    // Step 3: Build database query with filters
    let sqlQuery = `
      SELECT 
        b.*,
        ${hasEmbedding ? `1 - (b.embedding <=> $1::vector) as similarity` : '0 as similarity'}
      FROM bookmarks b
      WHERE b."userId" = $${hasEmbedding ? 2 : 1}
    `;

    const params: unknown[] = [];
    let paramIndex = 1;

    if (hasEmbedding) {
      params.push(`[${queryEmbedding.join(',')}]`);
      paramIndex++;
    }

    params.push(user.userId);
    paramIndex++;

    // Add content type filter
    if (parsedQuery.filters.contentType && parsedQuery.filters.contentType.length > 0) {
      sqlQuery += ` AND b."contentType" = ANY($${paramIndex}::text[])`;
      params.push(parsedQuery.filters.contentType);
      paramIndex++;
    }

    // Add category filter
    if (parsedQuery.filters.category && parsedQuery.filters.category.length > 0) {
      sqlQuery += ` AND b.category = ANY($${paramIndex}::text[])`;
      params.push(parsedQuery.filters.category);
      paramIndex++;
    }

    // Add date range filter
    if (parsedQuery.filters.dateRange) {
      if (parsedQuery.filters.dateRange.start) {
        sqlQuery += ` AND b."createdAt" >= $${paramIndex}::timestamp`;
        params.push(parsedQuery.filters.dateRange.start);
        paramIndex++;
      }
      if (parsedQuery.filters.dateRange.end) {
        sqlQuery += ` AND b."createdAt" <= $${paramIndex}::timestamp`;
        params.push(new Date(parsedQuery.filters.dateRange.end + 'T23:59:59').toISOString());
        paramIndex++;
      }
    }

    // Add keyword search (full-text)
    if (parsedQuery.keywords.length > 0) {
      const keywordPattern = parsedQuery.keywords.join('|');
      sqlQuery += ` AND (
        b.title ~* $${paramIndex} OR
        b."rawContent" ~* $${paramIndex} OR
        EXISTS (
          SELECT 1 FROM unnest(b.tags) tag
          WHERE tag ~* $${paramIndex}
        )
      )`;
      params.push(keywordPattern);
      paramIndex++;
    }

    // Add tag filter
    if (parsedQuery.filters.tags && parsedQuery.filters.tags.length > 0) {
      sqlQuery += ` AND b.tags && $${paramIndex}::text[]`;
      params.push(parsedQuery.filters.tags);
      paramIndex++;
    }

    // Order by similarity if we have embeddings, otherwise by date
    if (hasEmbedding) {
      sqlQuery += ` AND b.embedding IS NOT NULL ORDER BY similarity DESC`;
    } else {
      sqlQuery += ` ORDER BY b."createdAt" DESC`;
    }

    // Limit results (get more than needed for reranking)
    sqlQuery += ` LIMIT ${limit * 3}`;

    console.log('SQL Query:', sqlQuery);
    console.log('Params:', params);

    // Execute query
    type BookmarkResult = {
      id: string;
      userId: string;
      title: string;
      url: string | null;
      contentType: string;
      rawContent: string | null;
      thumbnail: string | null;
      favicon: string | null;
      metadata: unknown;
      tags: string[];
      category: string | null;
      createdAt: Date;
      updatedAt: Date;
      extractedAt: Date | null;
      similarity: number;
    };

    const rawResults = await prisma.$queryRawUnsafe(sqlQuery, ...params) as BookmarkResult[];

    console.log(`Found ${rawResults.length} initial results`);

    if (rawResults.length === 0) {
      return successResponse({
        results: [],
        query,
        parsed: parsedQuery,
        message: 'No bookmarks found matching your query',
        totalResults: 0,
      });
    }

    // Step 4: Rerank results with Claude for relevance
    const reranked = await rerankResults(
      query,
      rawResults.map((r: BookmarkResult) => ({
        id: r.id,
        title: r.title,
        content: r.rawContent,
        tags: r.tags,
        url: r.url,
      })),
      limit
    );

    // Step 5: Merge rankings with bookmark data
    const rankedResults = reranked
      .map(ranked => {
        const bookmark = rawResults.find((r: BookmarkResult) => r.id === ranked.id);
        if (!bookmark) return null;

        return {
          ...bookmark,
          relevanceScore: ranked.score,
          explanation: ranked.explanation,
          vectorSimilarity: bookmark.similarity,
        };
      })
      .filter(Boolean);

    return successResponse({
      results: rankedResults,
      query,
      parsed: parsedQuery,
      totalResults: rankedResults.length,
      message: `Found ${rankedResults.length} relevant bookmarks`,
    });
  } catch (error) {
    console.error('Smart search error:', error);
    return handleApiError(error);
  }
}
