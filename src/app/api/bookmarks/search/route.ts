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
    const where: any = {
      userId: user.userId,
      AND: [],
    };

    // Text search across title, content, and tags
    if (query) {
      where.AND.push({
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { rawContent: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
          { url: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    // Filter by category
    if (category) {
      where.AND.push({ category });
    }

    // Filter by content type
    if (contentType) {
      where.AND.push({ contentType });
    }

    // Filter by tags (bookmark must have ALL specified tags)
    if (tags && tags.length > 0) {
      where.AND.push({
        tags: { hasEvery: tags },
      });
    }

    // If no conditions, remove empty AND array
    if (where.AND.length === 0) {
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
