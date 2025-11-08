/**
 * Image Bookmark API
 * Handles image upload, S3 storage, and Claude Vision analysis
 */

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
import {
  uploadImage,
  downloadImageFromUrl,
} from '@/lib/imageStorage';
import { analyzeImageWithClaude } from '@/lib/imageAnalysis';
import { generateSmartTags } from '@/lib/ai';
import { generateBookmarkEmbedding } from '@/lib/embeddings';

// Validation schema
const imageBookmarkSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  title: z.string().optional(),
  pageUrl: z.string().url().optional(),
  pageTitle: z.string().optional(),
  surroundingText: z.string().optional(),
  altText: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * POST /api/bookmarks/image - Save image bookmark with AI analysis
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorizedError();
    }

    // Parse and validate request
    const body = await request.json();
    console.log('📸 Received image bookmark request:', body.imageUrl);

    const validation = imageBookmarkSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return validationError(
        firstError.message,
        firstError.path[0] as string
      );
    }

    const {
      imageUrl,
      title,
      pageUrl,
      pageTitle,
      surroundingText,
      altText,
      tags = [],
    } = validation.data;

    // Step 1: Download image
    console.log('⬇️ Downloading image...');
    const imageBuffer = await downloadImageFromUrl(imageUrl);
    console.log(`✅ Downloaded ${imageBuffer.length} bytes`);

    // Step 2: Upload to S3
    console.log('☁️ Uploading to S3...');
    const uploadResult = await uploadImage(imageBuffer, user.userId);
    console.log(`✅ Uploaded: ${uploadResult.url}`);

    // Step 3: Analyze with Claude Vision (in parallel with next steps)
    console.log('🤖 Analyzing image with Claude Vision...');
    const analysisPromise = analyzeImageWithClaude(
      uploadResult.url,
      surroundingText,
      altText
    );

    // Step 4: Generate title if not provided
    let finalTitle = title;
    if (!finalTitle) {
      // Use page title if available, otherwise generate from context
      finalTitle = pageTitle || altText || 'Image';
      
      // If we have surrounding text, extract a meaningful title
      if (surroundingText && surroundingText.length > 10) {
        const words = surroundingText.split(/\s+/).slice(0, 10);
        finalTitle = words.join(' ').substring(0, 100);
      }
    }

    // Wait for Claude Vision analysis
    const analysis = await analysisPromise;

    // Step 5: Generate AI tags (combine with user tags and analysis tags)
    console.log('🏷️ Generating comprehensive tags...');
    const contentForTags = [
      analysis.ocrText,
      analysis.description,
      surroundingText,
      altText,
    ]
      .filter(Boolean)
      .join(' ');

    let aiTags: string[] = [];
    if (contentForTags.length > 20) {
      aiTags = await generateSmartTags(
        finalTitle,
        contentForTags,
        pageUrl
      );
    }

    // Combine all tags (user + analysis + AI) and deduplicate
    const allTags = [
      ...new Set([
        ...tags,
        ...analysis.tags,
        ...aiTags,
      ]),
    ].slice(0, 10);

    console.log(`✨ Final tags: ${allTags.join(', ')}`);

    // Step 6: Auto-detect category from tags and objects
    let category: string | null = null;
    const tagLower = allTags.map(t => t.toLowerCase());
    const objects = analysis.objects.map(o => o.toLowerCase());
    const combined = [...tagLower, ...objects];

    if (combined.some(t => ['code', 'programming', 'software', 'tech'].includes(t))) {
      category = 'work';
    } else if (combined.some(t => ['learn', 'education', 'tutorial', 'study', 'book'].includes(t))) {
      category = 'learning';
    } else if (combined.some(t => ['design', 'art', 'creative', 'inspiration'].includes(t))) {
      category = 'inspiration';
    } else if (combined.some(t => ['meme', 'funny', 'entertainment'].includes(t))) {
      category = 'entertainment';
    } else {
      category = 'personal';
    }

    // Step 7: Create bookmark with all metadata
    console.log('💾 Saving bookmark to database...');
    const bookmark = await prisma.bookmark.create({
      data: {
        userId: user.userId,
        title: finalTitle,
        url: pageUrl || imageUrl,
        contentType: 'image',
        rawContent: surroundingText || analysis.description,
        
        // Image data
        imageUrl: uploadResult.url,
        imageStorageKey: uploadResult.storageKey,
        imageWidth: uploadResult.width,
        imageHeight: uploadResult.height,
        imageSize: uploadResult.size,
        imageFormat: uploadResult.format,
        
        // AI analysis
        ocrText: analysis.ocrText || null,
        imageDescription: analysis.description || null,
        imageObjects: analysis.objects,
        
        // Organization
        tags: allTags,
        category,
        
        // Metadata
        metadata: {
          originalImageUrl: imageUrl,
          pageTitle,
          altText,
          surroundingText: surroundingText?.substring(0, 500),
          aiConfidence: analysis.confidence,
        },
      },
    });

    console.log(`✅ Bookmark created: ${bookmark.id}`);

    // Step 8: Generate embedding asynchronously (don't block response)
    (async () => {
      try {
        console.log('🔄 Generating embedding for searchability...');
        const embeddingText = [
          finalTitle,
          analysis.ocrText,
          analysis.description,
          allTags.join(' '),
          analysis.objects.join(' '),
        ]
          .filter(Boolean)
          .join(' ');

        const embedding = await generateBookmarkEmbedding(
          finalTitle,
          embeddingText,
          allTags,
          pageUrl
        );

        if (embedding.length > 0) {
          await prisma.$executeRaw`
            UPDATE bookmarks 
            SET embedding = ${`[${embedding.join(',')}]`}::vector
            WHERE id = ${bookmark.id}
          `;
          console.log('✅ Embedding saved');
        }
      } catch (error) {
        console.error('⚠️ Embedding generation failed (non-critical):', error);
      }
    })();

    return successResponse({
      bookmark,
      message: 'Image bookmark saved successfully!',
    });
  } catch (error) {
    console.error('❌ Image bookmark creation failed:', error);
    return handleApiError(error);
  }
}
