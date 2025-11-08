'use client';

import { Bookmark } from '@/types/bookmark';
import { BookmarkCard } from './BookmarkCard';
import { Loader2, Bookmark as BookmarkIcon } from 'lucide-react';

interface BookmarkGridProps {
  bookmarks: Bookmark[];
  loading?: boolean;
  onDelete?: () => void;
  viewMode?: 'grid' | 'list';
}

export function BookmarkGrid({ bookmarks, loading, onDelete, viewMode = 'grid' }: BookmarkGridProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-sm text-gray-500">Loading your bookmarks...</p>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-16 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <BookmarkIcon className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="mt-6 text-lg font-semibold text-gray-900">No bookmarks yet</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
          Start saving your favorite content by clicking the <strong>Add Bookmark</strong> button above or install our Chrome extension.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <kbd className="rounded bg-gray-100 px-2 py-1 font-mono">Ctrl</kbd>
            <span>+</span>
            <kbd className="rounded bg-gray-100 px-2 py-1 font-mono">Shift</kbd>
            <span>+</span>
            <kbd className="rounded bg-gray-100 px-2 py-1 font-mono">S</kbd>
            <span className="ml-2">Quick save (Extension)</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={
      viewMode === 'grid'
        ? "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        : "flex flex-col gap-4"
    }>
      {bookmarks.map((bookmark) => (
        <BookmarkCard 
          key={bookmark.id} 
          bookmark={bookmark} 
          onDelete={onDelete}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
}
