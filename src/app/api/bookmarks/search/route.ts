import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const contentType = searchParams.get('type');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);

    // Build search conditions
    type WhereCondition = {
      userId: string;
      AND?: Array<Record<string, unknown>>;
      [key: string]: unknown;
    };

    const where: WhereCondition = {
      userId: user.userId,
      AND: [],
    };

    // Text search across title, content, and tags
    if (query) {
      // Extract important keywords from natural language queries
      // Remove common filler words like "I was", "looking for", "that", etc.
      const stopWords = ['i', 'was', 'looking', 'for', 'the', 'a', 'an', 'that', 'this', 'those', 'these', 'my', 'about', 'from', 'with'];
      const keywords = query
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.includes(word));

      // Expand keywords with synonyms and related terms for better matching
      const keywordExpansions: Record<string, string[]> = {
        'study': ['study', 'learn', 'education', 'book', 'textbook', 'tutorial', 'course', 'lesson', 'academic'],
        'learn': ['learn', 'study', 'education', 'tutorial', 'course', 'lesson', 'training'],
        'math': ['math', 'maths', 'mathematics', 'algebra', 'calculus', 'geometry'],
        'maths': ['maths', 'math', 'mathematics', 'algebra', 'calculus', 'geometry'],
        'code': ['code', 'coding', 'programming', 'development', 'software'],
        'phone': ['phone', 'smartphone', 'mobile', 'iphone', 'android'],
        'video': ['video', 'watch', 'youtube', 'tutorial'],
        'book': ['book', 'ebook', 'textbook', 'reading'],
      };

      // Expand keywords
      const expandedKeywords = new Set<string>();
      for (const keyword of keywords) {
        expandedKeywords.add(keyword);
        if (keywordExpansions[keyword]) {
          keywordExpansions[keyword].forEach(exp => expandedKeywords.add(exp));
        }
      }
      
      const allKeywords = Array.from(expandedKeywords);

      // If we extracted keywords, search for each one
      if (allKeywords.length > 0) {
        const searchConditions = allKeywords.map(keyword => ({
          OR: [
            { title: { contains: keyword, mode: 'insensitive' as const } },
            { rawContent: { contains: keyword, mode: 'insensitive' as const } },
            { tags: { has: keyword } },
            { url: { contains: keyword, mode: 'insensitive' as const } },
          ],
        }));

        // Match ANY of the keywords (OR logic)
        where.AND?.push({
          OR: searchConditions,
        });
      } else {
        // Fallback to original query if no keywords extracted
        where.AND?.push({
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { rawContent: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } },
            { url: { contains: query, mode: 'insensitive' } },
          ],
        });
      }
    }

    // Filter by category
    if (category) {
      where.AND?.push({ category });
    }

    // Filter by content type
    if (contentType) {
      where.AND?.push({ contentType });
    }

    // Filter by tags (bookmark must have ALL specified tags)
    if (tags && tags.length > 0) {
      where.AND?.push({
        tags: { hasEvery: tags },
      });
    }

    // If no conditions, remove empty AND array
    if (where.AND && where.AND.length === 0) {
      delete where.AND;
    }

    const bookmarks = await prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit results
    });

    return NextResponse.json({ bookmarks, count: bookmarks.length });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search bookmarks' },
      { status: 500 }
    );
  }
}
