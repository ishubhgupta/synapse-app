'use client';

import { Bookmark } from '@/types/bookmark';
import Image from 'next/image';
import {
  ExternalLink,
  Trash2,
  Video,
  ShoppingCart,
  FileText,
  MessageSquare,
  StickyNote,
  Image as ImageIcon,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete?: () => void;
  viewMode?: 'grid' | 'list';
}

export function BookmarkCard({ bookmark, onDelete, viewMode = 'grid' }: BookmarkCardProps) {
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this bookmark?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete bookmark');
      }

      onDelete?.();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete bookmark');
    }
  };

  const getIcon = () => {
    switch (bookmark.contentType) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'product':
        return <ShoppingCart className="h-4 w-4" />;
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'tweet':
        return <MessageSquare className="h-4 w-4" />;
      case 'note':
        return <StickyNote className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = () => {
    switch (bookmark.contentType) {
      case 'video':
        return 'text-red-600 bg-red-50 border-red-100';
      case 'product':
        return 'text-green-600 bg-green-50 border-green-100';
      case 'article':
        return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'tweet':
        return 'text-sky-600 bg-sky-50 border-sky-100';
      case 'note':
        return 'text-yellow-600 bg-yellow-50 border-yellow-100';
      case 'image':
        return 'text-purple-600 bg-purple-50 border-purple-100';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const getCategoryEmoji = () => {
    switch (bookmark.category) {
      case 'work':
        return '💼';
      case 'personal':
        return '👤';
      case 'research':
        return '🔬';
      case 'inspiration':
        return '✨';
      case 'shopping':
        return '🛍️';
      case 'entertainment':
        return '🎬';
      case 'learning':
        return '📚';
      default:
        return '📁';
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-blue-200">
        <div className="flex gap-4 p-4">
          {/* Thumbnail */}
          {bookmark.thumbnail && (
            <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bookmark.thumbnail}
                alt={bookmark.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${getTypeColor()}`}>
                    {getIcon()}
                    {bookmark.contentType}
                  </span>
                  {bookmark.category && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                      {getCategoryEmoji()} {bookmark.category}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 mb-1">
                  {bookmark.title}
                </h3>
                {bookmark.tags && bookmark.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {bookmark.tags.slice(0, 5).map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
                      >
                        #{tag}
                      </span>
                    ))}
                    {bookmark.tags.length > 5 && (
                      <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        +{bookmark.tags.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {bookmark.url && (
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open
                  </a>
                )}
                <button
                  onClick={handleDelete}
                  className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                  title="Delete bookmark"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{formatRelativeTime(bookmark.createdAt)}</span>
              {bookmark.favicon && (
                <Image src={bookmark.favicon} alt="" width={14} height={14} unoptimized />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-blue-200 hover:-translate-y-1">
      {/* Thumbnail */}
      {bookmark.thumbnail && (
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bookmark.thumbnail}
            alt={bookmark.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Type badge and favicon */}
        <div className="mb-3 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${getTypeColor()}`}>
            {getIcon()}
            {bookmark.contentType}
          </span>
          {bookmark.favicon && (
            <Image src={bookmark.favicon} alt="" width={16} height={16} unoptimized className="opacity-60" />
          )}
        </div>

        {/* Title */}
        <h3 className="mb-3 text-base font-semibold text-gray-900 line-clamp-2 leading-snug">
          {bookmark.title}
        </h3>

        {/* Tags */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {bookmark.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 transition-colors"
              >
                #{tag}
              </span>
            ))}
            {bookmark.tags.length > 3 && (
              <span className="inline-block rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-500">
                +{bookmark.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Category */}
        {bookmark.category && (
          <div className="mb-3 text-xs font-medium text-gray-600">
            {getCategoryEmoji()} {bookmark.category.charAt(0).toUpperCase() + bookmark.category.slice(1)}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
          <span className="flex items-center gap-1">
            {formatRelativeTime(bookmark.createdAt)}
          </span>
          {bookmark.url && (
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              Open
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Delete button (shown on hover) */}
      <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={handleDelete}
          className="rounded-lg bg-red-600 p-2 text-white shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
          title="Delete bookmark"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
