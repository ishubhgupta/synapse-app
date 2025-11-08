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
import { generateBookmarkEmbedding } from '@/lib/embeddings';

// Helper to auto-detect category based on content type and tags
function detectCategory(contentType: string, tags: string[]): string | null {
  const tagLower = tags.map(t => t.toLowerCase());
  
  if (contentType === 'product' || tagLower.some(t => ['shop', 'buy', 'product', 'shopping'].includes(t))) {
    return 'shopping';
  }
  if (contentType === 'video' || tagLower.some(t => ['entertainment', 'movie', 'music', 'game'].includes(t))) {
    return 'entertainment';
  }
  if (tagLower.some(t => ['work', 'business', 'productivity', 'career'].includes(t))) {
    return 'work';
  }
  if (tagLower.some(t => ['learn', 'education', 'tutorial', 'course', 'study'].includes(t))) {
    return 'learning';
  }
  if (tagLower.some(t => ['research', 'academic', 'paper', 'science'].includes(t))) {
    return 'research';
  }
  if (tagLower.some(t => ['design', 'art', 'creative', 'inspiration'].includes(t))) {
    return 'inspiration';
  }
  
  return 'personal'; // Default
}

// Validation schema for creating a bookmark
const createBookmarkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  url: z.string().optional().nullable().transform(val => {
    // Handle null, undefined, or empty string
    if (!val || val === '' || val === null) return null;
    // Validate URL format
    try {
      new URL(val);
      return val;
    } catch {
      throw new Error('Invalid URL format');
    }
  }),
  rawContent: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  category: z.enum(['work', 'personal', 'research', 'inspiration', 'shopping', 'entertainment', 'learning']).optional(),
});

/**
 * GET /api/bookmarks - List user's bookmarks
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
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
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorizedError();
    }

    // Parse and validate request body
    const body = await request.json();
    console.log('Received bookmark data:', JSON.stringify(body, null, 2));
    
    const validation = createBookmarkSchema.safeParse(body);

    if (!validation.success) {
      console.error('Validation failed:', validation.error);
      const firstError = validation.error.issues[0];
      return validationError(
        firstError.message,
        firstError.path[0] as string
      );
    }

    const { title, url, rawContent, tags, category } = validation.data;

    // Detect content type
    const contentType = url ? detectContentType(url) : 'note';

    // Scrape metadata if URL provided
    let thumbnail: string | undefined;
    let favicon: string | undefined;
    let metadata: unknown = null;
    let extractedTitle = title;
    let description: string | undefined;

    if (url && url !== '' && url !== null) {
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
        
        // ALWAYS generate smart tags using AI (dynamic tag generation)
        if (contentToAnalyze) {
          console.log('🤖 Generating AI-powered tags...');
          const smartTags = await generateSmartTags(
            extractedTitle,
            contentToAnalyze,
            url ?? undefined
          );
          
          // Merge user-provided tags with AI-generated tags (AI tags take priority)
          if (finalTags.length > 0) {
            // User provided some tags, merge them with AI suggestions
            const allTags = [...new Set([...smartTags, ...finalTags])];
            finalTags = allTags.slice(0, 8);
            console.log(`✨ Combined ${smartTags.length} AI tags with ${tags?.length || 0} user tags`);
          } else {
            // No user tags, use AI tags only
            finalTags = smartTags.slice(0, 5);
            console.log(`✨ Generated ${finalTags.length} AI tags`);
          }
        }

        // Analyze content for summary and key points
        if (contentToAnalyze.length > 100) {
          console.log('📝 Analyzing content with AI...');
          const aiAnalysis = await analyzeContentWithAI(
            contentToAnalyze,
            contentType,
            url ?? undefined
          );

          if (aiAnalysis.summary) {
            aiMetadata.aiSummary = aiAnalysis.summary;
            console.log('✓ Generated AI summary');
          }
          if (aiAnalysis.keyPoints && aiAnalysis.keyPoints.length > 0) {
            aiMetadata.keyPoints = aiAnalysis.keyPoints;
            console.log(`✓ Generated ${aiAnalysis.keyPoints.length} key points`);
          }
          if (aiAnalysis.suggestedTags && aiAnalysis.suggestedTags.length > 0) {
            // Merge additional AI suggested tags from content analysis
            const allTags = [...new Set([...finalTags, ...aiAnalysis.suggestedTags])];
            finalTags = allTags.slice(0, 8);
            console.log(`✓ Added ${aiAnalysis.suggestedTags.length} more tags from content analysis`);
          }
        }
      } catch (aiError) {
        console.error('❌ AI analysis failed:', aiError);
        // Continue without AI enhancement - use user-provided tags or empty array
        console.log('⚠️ Continuing without AI tags');
      }
    } else {
      console.warn('⚠️ ANTHROPIC_API_KEY not set - skipping AI tag generation');
    }

    // Merge AI metadata with scraped metadata
    const finalMetadata = {
      ...(metadata as object),
      ...aiMetadata,
    };

    // Auto-detect category if not provided
    const finalCategory = category || detectCategory(contentType, finalTags);

    // Create bookmark first
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
        category: finalCategory,
        extractedAt: url ? new Date() : null,
      },
    });

    console.log(`✅ Bookmark created: ${bookmark.id}`);

    // Generate and save embedding in background (don't block the response)
    // This happens asynchronously so the user gets a fast response
    (async () => {
      try {
        console.log(`🔄 Generating embedding for bookmark: ${bookmark.id}`);
        
        const embedding = await generateBookmarkEmbedding(
          extractedTitle,
          rawContent || description || null,
          finalTags,
          url || null
        );

        if (embedding.length === 0) {
          console.warn(`⚠️  Empty embedding returned for bookmark: ${bookmark.id}`);
          return;
        }

        console.log(`✓ Generated ${embedding.length}-dimensional embedding`);

        // Save embedding using raw SQL
        await prisma.$executeRaw`
          UPDATE bookmarks 
          SET embedding = ${`[${embedding.join(',')}]`}::vector 
          WHERE id = ${bookmark.id}
        `;

        console.log(`✅ Embedding saved successfully for: ${bookmark.title}`);
      } catch (embError) {
        console.error(`❌ Failed to generate/save embedding for ${bookmark.id}:`, embError);
        // Don't throw - bookmark is already created
      }
    })();

    return successResponse(bookmark, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
