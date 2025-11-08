/**
 * Regenerate tags for existing bookmarks using AI
 * This script will analyze all bookmarks and generate AI-powered tags
 */

import { PrismaClient } from '@prisma/client';
import { generateSmartTags } from '../src/lib/ai';

const prisma = new PrismaClient();

async function regenerateTags() {
  console.log('🏷️ Starting AI tag regeneration for existing bookmarks...\n');

  try {
    // Fetch all bookmarks
    const bookmarks = await prisma.bookmark.findMany({
      select: {
        id: true,
        title: true,
        url: true,
        rawContent: true,
        tags: true,
        imageDescription: true,
        ocrText: true,
      },
    });

    console.log(`📚 Found ${bookmarks.length} bookmarks\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < bookmarks.length; i++) {
      const bookmark = bookmarks[i];
      console.log(`\n[${i + 1}/${bookmarks.length}] Processing: ${bookmark.title}`);
      
      try {
        // Prepare content for tag generation
        const contentToAnalyze = 
          bookmark.rawContent || 
          bookmark.imageDescription ||
          bookmark.ocrText ||
          bookmark.title;

        if (!contentToAnalyze || contentToAnalyze.length < 10) {
          console.log('⏭️ Skipping - insufficient content');
          skipCount++;
          continue;
        }

        // Generate AI tags
        console.log('🤖 Generating AI tags...');
        const aiTags = await generateSmartTags(
          bookmark.title,
          contentToAnalyze,
          bookmark.url || undefined
        );

        if (aiTags.length === 0) {
          console.log('⚠️ No tags generated');
          skipCount++;
          continue;
        }

        // Merge with existing tags
        const existingTags = bookmark.tags || [];
        const mergedTags = [...new Set([...aiTags, ...existingTags])];
        const finalTags = mergedTags.slice(0, 8);

        // Update bookmark with new tags
        await prisma.bookmark.update({
          where: { id: bookmark.id },
          data: { tags: finalTags },
        });

        console.log(`✅ Updated tags: ${finalTags.join(', ')}`);
        successCount++;

        // Rate limiting - wait 1 second between requests to avoid API throttling
        if (i < bookmarks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Error processing bookmark ${bookmark.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Tag Regeneration Complete!');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`⏭️ Skipped: ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
regenerateTags()
  .then(() => {
    console.log('\n✨ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
