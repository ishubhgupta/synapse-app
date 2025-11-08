/**
 * Generate embeddings for existing bookmarks
 * Run this script once to add embeddings to bookmarks created before the embedding feature was added
 * 
 * Usage: npx tsx scripts/generate-embeddings.ts
 */

import { PrismaClient } from '@prisma/client';
import { generateBookmarkEmbedding } from '../src/lib/embeddings';

const prisma = new PrismaClient();

async function generateEmbeddings() {
  console.log('🚀 Starting embedding generation for existing bookmarks...\n');

  // Get all bookmarks without embeddings
  const bookmarks = await prisma.$queryRaw<Array<{
    id: string;
    title: string;
    url: string | null;
    rawContent: string | null;
    tags: string[];
  }>>`
    SELECT id, title, url, "rawContent", tags
    FROM bookmarks
    WHERE embedding IS NULL
    ORDER BY "createdAt" DESC
  `;

  if (bookmarks.length === 0) {
    console.log('✅ All bookmarks already have embeddings!');
    return;
  }

  console.log(`Found ${bookmarks.length} bookmarks without embeddings\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < bookmarks.length; i++) {
    const bookmark = bookmarks[i];
    console.log(`[${i + 1}/${bookmarks.length}] Processing: ${bookmark.title}`);

    try {
      // Generate embedding
      const embedding = await generateBookmarkEmbedding(
        bookmark.title,
        bookmark.rawContent,
        bookmark.tags,
        bookmark.url
      );

      if (embedding.length === 0) {
        console.log(`  ⚠️  Skipped (no embedding generated)`);
        errorCount++;
        continue;
      }

      // Save to database using raw SQL
      await prisma.$executeRaw`
        UPDATE bookmarks 
        SET embedding = ${`[${embedding.join(',')}]`}::vector 
        WHERE id = ${bookmark.id}
      `;

      console.log(`  ✅ Generated ${embedding.length}-dimensional embedding`);
      successCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`  ❌ Error:`, error);
      errorCount++;
    }
  }

  console.log('\n========================================');
  console.log('📊 Summary:');
  console.log(`  Total: ${bookmarks.length}`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed: ${errorCount}`);
  console.log('========================================\n');

  if (successCount > 0) {
    console.log('✨ Embeddings generated! Your search is now ready to use.');
  }
}

generateEmbeddings()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
