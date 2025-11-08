/**
 * Apply migration to change embedding dimensions from 1536 to 768
 * This script directly executes the SQL migration
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('🔄 Starting migration: 1536 → 768 dimensions...\n');

  try {
    // Step 1: Drop the old embedding column
    console.log('1️⃣  Dropping old 1536-dimensional embedding column...');
    await prisma.$executeRaw`
      ALTER TABLE "Bookmark" DROP COLUMN IF EXISTS "embedding"
    `;
    console.log('   ✓ Dropped\n');

    // Step 2: Add new 768-dimensional embedding column
    console.log('2️⃣  Adding new 768-dimensional embedding column...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Bookmark" ADD COLUMN "embedding" vector(768)
    `);
    console.log('   ✓ Added\n');

    console.log('✅ Migration completed successfully!\n');
    console.log('⚠️  All existing embeddings have been deleted.');
    console.log('   Run: npm run regenerate-embeddings\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
