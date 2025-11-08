/**
 * Embedding Generation Utilities
 * 
 * Generates vector embeddings for semantic search using OpenAI's text-embedding-3-small model.
 * Embeddings are 1536-dimensional vectors that capture semantic meaning of text.
 */

/**
 * Generate embedding vector from text using OpenAI API
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️  OpenAI API key not configured, skipping embedding generation');
    console.warn('   Add OPENAI_API_KEY to .env.local to enable semantic search');
    return [];
  }

  if (!text || text.trim().length === 0) {
    console.warn('⚠️  Empty text provided for embedding generation');
    return [];
  }

  try {
    // Clean and truncate text to avoid token limits (8191 tokens max)
    const cleanText = text
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000); // Conservative limit to avoid token overflow

    if (cleanText.length < 3) {
      console.warn('⚠️  Text too short for embedding generation');
      return [];
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: cleanText,
        model: 'text-embedding-3-small', // 1536 dimensions, $0.02/1M tokens
        encoding_format: 'float',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ OpenAI API error:', error);
      
      if (response.status === 401) {
        console.error('   Invalid API key - check your OPENAI_API_KEY in .env.local');
      } else if (response.status === 429) {
        console.error('   Rate limit exceeded - too many requests');
      }
      
      return [];
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;

    console.log(`✓ Embedding generated: ${embedding.length} dimensions, ${data.usage.total_tokens} tokens`);
    
    return embedding;
  } catch (error) {
    console.error('❌ Failed to generate embedding:', error);
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
