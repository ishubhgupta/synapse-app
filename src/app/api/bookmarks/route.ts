import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  handleApiError,
  successResponse,
  unauthorizedError,
  validationError,
} from '@/lib/errors';
import { detectContentType } from '@/lib/contentDetector';
import { scraperManager } from '@/lib/scrapers';
import { getFaviconUrl } from '@/lib/utils';
import { analyzeContentWithAI, generateSmartTags } from '@/lib/ai';

// Validation schema for creating a bookmark
const createBookmarkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  rawContent: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

/**
 * GET /api/bookmarks - List user's bookmarks
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedError();
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const contentType = searchParams.get('contentType');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: { userId: string; contentType?: string } = {
      userId: user.userId,
    };

    if (contentType) {
      where.contentType = contentType;
    }

    // Fetch bookmarks
    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bookmark.count({ where }),
    ]);

    return successResponse({
      bookmarks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/bookmarks - Create a new bookmark
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedError();
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createBookmarkSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return validationError(
        firstError.message,
        firstError.path[0] as string
      );
    }

    const { title, url, rawContent, tags } = validation.data;

    // Detect content type
    const contentType = url ? detectContentType(url) : 'note';

    // Scrape metadata if URL provided
    let thumbnail: string | undefined;
    let favicon: string | undefined;
    let metadata: unknown = null;
    let extractedTitle = title;
    let description: string | undefined;

    if (url && url !== '') {
      try {
        const scrapedData = await scraperManager.scrape(url);
        extractedTitle = scrapedData.title || title;
        description = scrapedData.description;
        thumbnail = scrapedData.thumbnail;
        metadata = scrapedData.metadata;
        favicon = getFaviconUrl(url);
      } catch (error) {
        console.error('Failed to scrape metadata:', error);
        // Continue with manual data
        favicon = url ? getFaviconUrl(url) : undefined;
      }
    }

    // AI-powered smart tags and analysis
    let finalTags = tags || [];
    const aiMetadata: Record<string, unknown> = {};

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const contentToAnalyze = rawContent || description || title;
        
        // Generate smart tags if none provided
        if (finalTags.length === 0 && contentToAnalyze) {
          const smartTags = await generateSmartTags(
            extractedTitle,
            contentToAnalyze,
            url
          );
          finalTags = smartTags.slice(0, 5);
        }

        // Analyze content for summary and key points
        if (contentToAnalyze.length > 100) {
          const aiAnalysis = await analyzeContentWithAI(
            contentToAnalyze,
            contentType,
            url
          );

          if (aiAnalysis.summary) {
            aiMetadata.aiSummary = aiAnalysis.summary;
          }
          if (aiAnalysis.keyPoints && aiAnalysis.keyPoints.length > 0) {
            aiMetadata.keyPoints = aiAnalysis.keyPoints;
          }
          if (aiAnalysis.suggestedTags && aiAnalysis.suggestedTags.length > 0) {
            // Merge AI suggested tags with existing
            const allTags = [...new Set([...finalTags, ...aiAnalysis.suggestedTags])];
            finalTags = allTags.slice(0, 8);
          }
        }
      } catch (aiError) {
        console.error('AI analysis failed:', aiError);
        // Continue without AI enhancement
      }
    }

    // Merge AI metadata with scraped metadata
    const finalMetadata = {
      ...(metadata as object),
      ...aiMetadata,
    };

    // Create bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        userId: user.userId,
        title: extractedTitle,
        url: url || null,
        contentType,
        rawContent: rawContent || description || null,
        thumbnail: thumbnail || null,
        favicon: favicon || null,
        metadata: Object.keys(finalMetadata).length > 0 ? finalMetadata : null,
        tags: finalTags,
        extractedAt: url ? new Date() : null,
      },
    });

    return successResponse(bookmark, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
