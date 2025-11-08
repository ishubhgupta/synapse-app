/**
 * Regenerate embeddings for all bookmarks with Gemini (768 dimensions)
 * 
 * This script fetches all bookmarks and regenerates their embeddings
 * using Google Gemini instead of OpenAI.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';
import { generateBookmarkEmbedding, getEmbeddingProvider } from '../src/lib/embeddings';

const prisma = new PrismaClient();

async function regenerateEmbeddings() {
  console.log('🔄 Starting embedding regeneration...\n');
  console.log(`📡 Using provider: ${getEmbeddingProvider()}\n`);

  try {
    // Fetch all bookmarks
    const bookmarks = await prisma.bookmark.findMany({
      select: {
        id: true,
        title: true,
        url: true,
        rawContent: true,
        tags: true,
      },
    });

    console.log(`📚 Found ${bookmarks.length} bookmarks to process\n`);

    if (bookmarks.length === 0) {
      console.log('✓ No bookmarks to process');
      return;
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Process bookmarks one by one
    for (let i = 0; i < bookmarks.length; i++) {
      const bookmark = bookmarks[i];
      const progress = `[${i + 1}/${bookmarks.length}]`;

      try {
        // Skip if no meaningful content
        if (!bookmark.title && !bookmark.rawContent) {
          console.log(`${progress} ⏭️  Skipped (no content): ${bookmark.url}`);
          skipCount++;
          continue;
        }

        console.log(`${progress} 🔮 Processing: ${bookmark.title || bookmark.url}`);

        // Generate embedding
        const embedding = await generateBookmarkEmbedding(
          bookmark.title,
          bookmark.rawContent,
          bookmark.tags,
          bookmark.url
        );

        if (embedding.length === 0) {
          console.log(`${progress} ⚠️  Empty embedding generated`);
          skipCount++;
          continue;
        }

        // Save to database using raw SQL
        await prisma.$executeRawUnsafe(`
          UPDATE "Bookmark"
          SET embedding = $1::vector
          WHERE id = $2
        `, `[${embedding.join(',')}]`, bookmark.id);

        console.log(`${progress} ✅ Saved ${embedding.length}D embedding`);
        successCount++;

        // Small delay to avoid rate limits
        if (i < bookmarks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`${progress} ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors:  ${errorCount}`);
    console.log('='.repeat(60) + '\n');

    if (successCount > 0) {
      console.log('🎉 Embedding regeneration completed!\n');
    } else {
      console.log('⚠️  No embeddings were generated. Check your API keys.\n');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

regenerateEmbeddings();
