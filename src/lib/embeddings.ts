/**
 * Embedding Generation Utilities
 * 
 * Generates vector embeddings for semantic search.
 * Supports Google Gemini (preferred, free tier) and OpenAI (fallback).
 * 
 * Gemini: 768 dimensions, FREE 1500 requests/day
 * OpenAI: 1536 dimensions, paid only
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const EMBEDDING_MODEL_GEMINI = 'text-embedding-004'; // Latest Gemini embedding model
const EMBEDDING_DIM_GEMINI = 768;

// Lazy initialization of Gemini client (allows env vars to load first)
let geminiClient: GoogleGenerativeAI | null = null;
function getGeminiClient(): GoogleGenerativeAI | null {
  if (geminiClient === null && process.env.GOOGLE_API_KEY) {
    geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }
  return geminiClient;
}

/**
 * Generate embedding vector from text using Google Gemini
 */
async function generateEmbeddingWithGemini(text: string): Promise<number[]> {
  const gemini = getGeminiClient();
  if (!gemini) {
    throw new Error('Google API key not configured');
  }

  try {
    const model = gemini.getGenerativeModel({ model: EMBEDDING_MODEL_GEMINI });
    const result = await model.embedContent(text);
    const embedding = result.embedding;

    if (!embedding.values || embedding.values.length === 0) {
      throw new Error('Empty embedding returned from Gemini');
    }

    return Array.from(embedding.values);
  } catch (error) {
    console.error('Gemini embedding error:', error);
    throw error;
  }
}

/**
 * Generate embedding vector from text using OpenAI (fallback)
 */
async function generateEmbeddingWithOpenAI(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('OpenAI embedding error:', error);
    throw error;
  }
}

/**
 * Generate embedding vector from text (auto-selects provider)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    console.warn('⚠️  Empty text provided for embedding generation');
    return [];
  }

  // Clean and truncate text (Gemini limit: ~2048 tokens ≈ 8000 chars)
  const cleanText = text
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 8000);

  if (cleanText.length < 3) {
    console.warn('⚠️  Text too short for embedding generation');
    return [];
  }

  try {
    // Try Gemini first (free tier)
    const gemini = getGeminiClient();
    if (gemini) {
      console.log('🔮 Generating embedding with Google Gemini...');
      const embedding = await generateEmbeddingWithGemini(cleanText);
      console.log(`✓ Generated ${embedding.length}-dimensional embedding (Gemini)`);
      return embedding;
    }

    // Fallback to OpenAI
    if (process.env.OPENAI_API_KEY) {
      console.log('🤖 Generating embedding with OpenAI...');
      const embedding = await generateEmbeddingWithOpenAI(cleanText);
      console.log(`✓ Generated ${embedding.length}-dimensional embedding (OpenAI)`);
      return embedding;
    }

    // No provider available
    console.warn('⚠️  No embedding provider configured');
    console.warn('   Add GOOGLE_API_KEY (free) or OPENAI_API_KEY to .env.local');
    return [];
  } catch (error) {
    console.error('❌ Embedding generation failed:', error);
    
    // If Gemini fails, try OpenAI as fallback
    if (getGeminiClient() && process.env.OPENAI_API_KEY) {
      console.log('⚠️  Retrying with OpenAI fallback...');
      try {
        const embedding = await generateEmbeddingWithOpenAI(cleanText);
        console.log(`✓ Generated ${embedding.length}-dimensional embedding (OpenAI fallback)`);
        return embedding;
      } catch (fallbackError) {
        console.error('❌ OpenAI fallback also failed:', fallbackError);
      }
    }

    return [];
  }
}

/**
 * Generate embedding for a bookmark's searchable content
 * Combines title, tags, and content with appropriate weighting
 */
export async function generateBookmarkEmbedding(
  title: string,
  content?: string | null,
  tags?: string[],
  url?: string | null
): Promise<number[]> {
  // Build weighted text representation
  // Title is most important (3x weight), then content, then tags
  const parts: string[] = [];
  
  // Repeat title for higher weight in embedding
  parts.push(title, title, title);
  
  // Add tags (2x weight)
  if (tags && tags.length > 0) {
    const tagText = tags.join(' ');
    parts.push(tagText, tagText);
  }
  
  // Add content (truncated if too long)
  if (content && content.length > 0) {
    parts.push(content.substring(0, 2000));
  }
  
  // Add domain for context
  if (url) {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      parts.push(domain);
    } catch {
      // Invalid URL, skip
    }
  }
  
  const combinedText = parts.join(' ');
  
  return generateEmbedding(combinedText);
}

/**
 * Get embedding dimensions for current provider
 */
export function getEmbeddingDimensions(): number {
  if (getGeminiClient()) return EMBEDDING_DIM_GEMINI; // 768
  return 1536; // OpenAI default
}

/**
 * Get current embedding provider name
 */
export function getEmbeddingProvider(): string {
  if (getGeminiClient()) return 'Google Gemini (FREE)';
  if (process.env.OPENAI_API_KEY) return 'OpenAI';
  return 'None (semantic search disabled)';
}

/**
 * Calculate cosine similarity between two vectors
 * Returns a value between -1 and 1, where 1 means identical
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Format embedding array as PostgreSQL vector string
 */
export function formatVectorForPostgres(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}
