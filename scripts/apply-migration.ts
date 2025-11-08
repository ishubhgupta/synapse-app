#!/usr/bin/env node

/**
 * Apply database migration to change embedding dimensions from 1536 to 768
 * Run this script to update your database for Gemini embeddings
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🔄 Applying migration: Change embedding dimensions to 768 (Gemini)...\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(
      __dirname,
      '..',
      'prisma',
      'migrations',
      '20250101000000_change_embedding_to_768',
      'migration.sql'
    );

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolons and filter out comments/empty lines
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    // Execute each statement
    for (const statement of statements) {
      if (statement) {
        console.log(`   Executing: ${statement.substring(0, 60)}...`);
        await prisma.$executeRawUnsafe(statement);
      }
    }

    console.log('\n✅ Migration applied successfully!');
    console.log('\n⚠️  IMPORTANT: All existing embeddings have been deleted.');
    console.log('   Run this command to regenerate embeddings with Gemini:');
    console.log('   npm run regenerate-embeddings\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
