import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  handleApiError,
  successResponse,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  validationError,
} from '@/lib/errors';

// Validation schema for updating a bookmark
const updateBookmarkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long').optional(),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  rawContent: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * GET /api/bookmarks/[id] - Get a single bookmark
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedError();
    }

    const { id } = await params;

    const bookmark = await prisma.bookmark.findUnique({
      where: { id },
    });

    if (!bookmark) {
      return notFoundError('Bookmark');
    }

    if (bookmark.userId !== user.userId) {
      return forbiddenError('You do not have permission to access this bookmark');
    }

    return successResponse(bookmark);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/bookmarks/[id] - Update a bookmark
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedError();
    }

    const { id } = await params;

    // Check if bookmark exists and belongs to user
    const existingBookmark = await prisma.bookmark.findUnique({
      where: { id },
    });

    if (!existingBookmark) {
      return notFoundError('Bookmark');
    }

    if (existingBookmark.userId !== user.userId) {
      return forbiddenError('You do not have permission to update this bookmark');
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateBookmarkSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return validationError(firstError.message, firstError.path[0] as string);
    }

    // Update bookmark
    const bookmark = await prisma.bookmark.update({
      where: { id },
      data: validation.data,
    });

    return successResponse(bookmark);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/bookmarks/[id] - Delete a bookmark
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedError();
    }

    const { id } = await params;

    // Check if bookmark exists and belongs to user
    const existingBookmark = await prisma.bookmark.findUnique({
      where: { id },
    });

    if (!existingBookmark) {
      return notFoundError('Bookmark');
    }

    if (existingBookmark.userId !== user.userId) {
      return forbiddenError('You do not have permission to delete this bookmark');
    }

    // Delete bookmark
    await prisma.bookmark.delete({
      where: { id },
    });

    return successResponse({ message: 'Bookmark deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
