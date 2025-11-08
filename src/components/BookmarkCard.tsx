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
import { formatRelativeTime, truncate } from '@/lib/utils';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete?: () => void;
}

export function BookmarkCard({ bookmark, onDelete }: BookmarkCardProps) {
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
        return <Video className="h-5 w-5" />;
      case 'product':
        return <ShoppingCart className="h-5 w-5" />;
      case 'article':
        return <FileText className="h-5 w-5" />;
      case 'tweet':
        return <MessageSquare className="h-5 w-5" />;
      case 'note':
        return <StickyNote className="h-5 w-5" />;
      case 'image':
        return <ImageIcon className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeColor = () => {
    switch (bookmark.contentType) {
      case 'video':
        return 'text-red-600 bg-red-50';
      case 'product':
        return 'text-green-600 bg-green-50';
      case 'article':
        return 'text-blue-600 bg-blue-50';
      case 'tweet':
        return 'text-sky-600 bg-sky-50';
      case 'note':
        return 'text-yellow-600 bg-yellow-50';
      case 'image':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
      {/* Thumbnail */}
      {bookmark.thumbnail && (
        <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
          <Image
            src={bookmark.thumbnail}
            alt={bookmark.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            unoptimized
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Type badge */}
        <div className="mb-2 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeColor()}`}>
            {getIcon()}
            {bookmark.contentType}
          </span>
          {bookmark.favicon && (
            <Image src={bookmark.favicon} alt="" width={16} height={16} unoptimized />
          )}
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-semibold text-gray-900 line-clamp-2">
          {truncate(bookmark.title, 80)}
        </h3>

        {/* Description */}
        {bookmark.rawContent && (
          <p className="mb-3 text-sm text-gray-600 line-clamp-2">
            {truncate(bookmark.rawContent, 120)}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatRelativeTime(bookmark.createdAt)}</span>
          {bookmark.url && (
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
              onClick={(e) => e.stopPropagation()}
            >
              Open
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Actions (shown on hover) */}
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={handleDelete}
          className="rounded-full bg-red-600 p-2 text-white shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          title="Delete bookmark"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
