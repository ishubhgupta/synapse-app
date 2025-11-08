'use client';

import { Bookmark } from '@/types/bookmark';
import { BookmarkCard } from './BookmarkCard';
import { Loader2 } from 'lucide-react';

interface BookmarkGridProps {
  bookmarks: Bookmark[];
  loading?: boolean;
  onDelete?: () => void;
}

export function BookmarkGrid({ bookmarks, loading, onDelete }: BookmarkGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No bookmarks yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new bookmark or installing the Chrome extension.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {bookmarks.map((bookmark) => (
        <BookmarkCard key={bookmark.id} bookmark={bookmark} onDelete={onDelete} />
      ))}
    </div>
  );
}
