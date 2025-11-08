// TypeScript types for Synapse Core MVP

export type ContentType = 'video' | 'product' | 'article' | 'tweet' | 'note' | 'image';

export interface Bookmark {
  id: string;
  userId: string;
  title: string;
  url?: string | null;
  contentType: ContentType;
  rawContent?: string | null;
  thumbnail?: string | null;
  favicon?: string | null;
  metadata?: BookmarkMetadata | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  extractedAt?: Date | null;
}

export type BookmarkMetadata =
  | VideoMetadata
  | ProductMetadata
  | ArticleMetadata
  | TweetMetadata;

export interface VideoMetadata {
  type: 'video';
  videoId: string;
  platform: 'youtube' | 'vimeo' | 'dailymotion';
  duration?: string;
  channel?: string;
  uploadDate?: string;
}

export interface ProductMetadata {
  type: 'product';
  price?: string;
  currency?: string;
  brand?: string;
  rating?: number;
  domain: string;
}

export interface ArticleMetadata {
  type: 'article';
  domain: string;
  author?: string;
  publishDate?: string;
  readTime?: number;
}

export interface TweetMetadata {
  type: 'tweet';
  author: string;
  authorHandle: string;
  profilePic?: string;
  timestamp: string;
}

export interface CreateBookmarkInput {
  title: string;
  url?: string;
  contentType?: ContentType;
  rawContent?: string;
  tags?: string[];
}

export interface UpdateBookmarkInput {
  title?: string;
  url?: string;
  contentType?: ContentType;
  rawContent?: string;
  tags?: string[];
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
