/**
 * Smart Query Parser
 * 
 * Uses Claude AI to parse natural language search queries and extract:
 * - Search intent and context
 * - Filters (content type, category, date range)
 * - Keywords and semantic meaning
 * - Query expansion for better matching
 */

import Anthropic from '@anthropic-ai/sdk';

export interface ParsedQuery {
  // Original query
  originalQuery: string;
  
  // Search intent
  intent: 'find_bookmarks' | 'filter_bookmarks' | 'recall_content';
  
  // Structured filters
  filters: {
    contentType?: ('video' | 'product' | 'article' | 'tweet' | 'note' | 'image')[];
    category?: ('work' | 'personal' | 'research' | 'inspiration' | 'shopping' | 'entertainment' | 'learning')[];
    tags?: string[];
    dateRange?: {
      start?: string; // ISO date
      end?: string;   // ISO date
      description?: string; // e.g., "last month", "yesterday"
    };
  };
  
  // Semantic search
  keywords: string[]; // Extracted key terms
  expandedKeywords: string[]; // Synonyms and related terms
  semanticQuery: string; // Optimized text for embedding search
  
  // Context understanding
  contextualHints: string[]; // What the user is looking for
  
  // Confidence score
  confidence: number; // 0-1, how well the query was understood
}

/**
 * Parse natural language query using Claude AI
 */
export async function parseSearchQuery(query: string): Promise<ParsedQuery> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.warn('Anthropic API key not configured, using basic parsing');
    return basicQueryParse(query);
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    
    const systemPrompt = `You are an intelligent search query parser for a bookmark management system.

Your task is to parse natural language search queries and extract structured information.

Available content types: video, product, article, tweet, note, image
Available categories: work, personal, research, inspiration, shopping, entertainment, learning

Parse the query and return a JSON object with this EXACT structure:
{
  "intent": "find_bookmarks",
  "filters": {
    "contentType": ["article"],
    "category": ["work"],
    "tags": ["AI", "machine learning"],
    "dateRange": {
      "start": "2024-10-01",
      "end": "2024-10-31",
      "description": "last month"
    }
  },
  "keywords": ["AI agents", "autonomous"],
  "expandedKeywords": ["artificial intelligence", "autonomous systems", "intelligent agents", "AI", "automation"],
  "semanticQuery": "artificial intelligence autonomous agents systems",
  "contextualHints": ["looking for technical articles", "interested in AI agent architecture"],
  "confidence": 0.9
}

Rules:
1. Only include filters that are explicitly mentioned or clearly implied
2. For date ranges, calculate actual dates based on today being November 8, 2025
3. Extract and expand keywords with synonyms and related terms
4. semanticQuery should be optimized for semantic search (remove stop words, focus on meaning)
5. confidence should reflect how well you understood the query (0-1)
6. Return ONLY valid JSON, no markdown or explanations`;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Parse this search query: "${query}"`,
      }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse Claude's response
    const parsed = JSON.parse(content.text.trim());
    
    return {
      originalQuery: query,
      intent: parsed.intent || 'find_bookmarks',
      filters: parsed.filters || {},
      keywords: parsed.keywords || [],
      expandedKeywords: parsed.expandedKeywords || [],
      semanticQuery: parsed.semanticQuery || query,
      contextualHints: parsed.contextualHints || [],
      confidence: parsed.confidence || 0.5,
    };
  } catch (error) {
    console.error('Failed to parse query with Claude:', error);
    return basicQueryParse(query);
  }
}

/**
 * Basic query parsing fallback (when Claude is unavailable)
 */
function basicQueryParse(query: string): ParsedQuery {
  const lowerQuery = query.toLowerCase();
  const filters: ParsedQuery['filters'] = {};
  
  // Detect content types
  const contentTypeMap: Record<string, ('video' | 'product' | 'article' | 'tweet' | 'note' | 'image')> = {
    'video': 'video',
    'videos': 'video',
    'product': 'product',
    'products': 'product',
    'article': 'article',
    'articles': 'article',
    'tweet': 'tweet',
    'tweets': 'tweet',
    'note': 'note',
    'notes': 'note',
    'image': 'image',
    'images': 'image',
    'screenshot': 'image',
  };
  
  for (const [keyword, type] of Object.entries(contentTypeMap)) {
    if (lowerQuery.includes(keyword)) {
      filters.contentType = [type];
      break;
    }
  }
  
  // Detect categories
  const categoryMap: Record<string, ('work' | 'personal' | 'research' | 'inspiration' | 'shopping' | 'entertainment' | 'learning')> = {
    'work': 'work',
    'business': 'work',
    'personal': 'personal',
    'research': 'research',
    'study': 'research',
    'inspiration': 'inspiration',
    'design': 'inspiration',
    'shopping': 'shopping',
    'buy': 'shopping',
    'entertainment': 'entertainment',
    'learning': 'learning',
    'tutorial': 'learning',
  };
  
  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (lowerQuery.includes(keyword)) {
      filters.category = [category];
      break;
    }
  }
  
  // Detect date ranges
  const now = new Date('2025-11-08');
  if (lowerQuery.includes('yesterday')) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    filters.dateRange = {
      start: yesterday.toISOString().split('T')[0],
      end: yesterday.toISOString().split('T')[0],
      description: 'yesterday',
    };
  } else if (lowerQuery.includes('last week')) {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    filters.dateRange = {
      start: weekAgo.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
      description: 'last week',
    };
  } else if (lowerQuery.includes('last month')) {
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    filters.dateRange = {
      start: monthAgo.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
      description: 'last month',
    };
  }
  
  // Extract keywords (remove common words)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'about', 'show', 'me', 'find', 'search', 'my', 'i', 'saved']);
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  
  return {
    originalQuery: query,
    intent: 'find_bookmarks',
    filters,
    keywords: words,
    expandedKeywords: words,
    semanticQuery: words.join(' '),
    contextualHints: [],
    confidence: 0.5,
  };
}

/**
 * Re-rank search results using Claude to find most relevant matches
 */
export async function rerankResults(
  query: string,
  results: Array<{
    id: string;
    title: string;
    content?: string | null;
    tags: string[];
    url?: string | null;
  }>,
  topK: number = 10
): Promise<Array<{ id: string; score: number; explanation: string }>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey || results.length === 0) {
    // Return all with equal scores
    return results.slice(0, topK).map(r => ({
      id: r.id,
      score: 0.5,
      explanation: 'No AI ranking available',
    }));
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    
    // Format results for Claude
    const formattedResults = results.map((r, idx) => ({
      index: idx,
      id: r.id,
      title: r.title,
      tags: r.tags.join(', '),
      preview: r.content?.substring(0, 200) || '',
    }));

    const systemPrompt = `You are a relevance ranking expert for search results.

Analyze each bookmark and assign a relevance score (0-1) based on how well it matches the user's query.

Consider:
- Semantic meaning and context
- Exact keyword matches
- Tag relevance
- Overall content match

Return a JSON array with this structure:
[
  { "id": "bookmark-id", "score": 0.95, "explanation": "Perfect match for query about..." },
  { "id": "bookmark-id", "score": 0.7, "explanation": "Partial match..." }
]

Return ONLY the top ${topK} most relevant results, ordered by score (highest first).`;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Query: "${query}"\n\nBookmarks:\n${JSON.stringify(formattedResults, null, 2)}`,
      }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const rankings = JSON.parse(content.text.trim());
    return rankings.slice(0, topK);
  } catch (error) {
    console.error('Failed to rerank results with Claude:', error);
    return results.slice(0, topK).map(r => ({
      id: r.id,
      score: 0.5,
      explanation: 'Ranking unavailable',
    }));
  }
}
