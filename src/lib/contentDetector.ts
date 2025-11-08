import type { ContentType } from '@/types/bookmark';

/**
 * Detect content type from URL
 */
export function detectContentType(url: string): ContentType {
  if (!url || url.trim() === '') return 'note';

  const patterns: Record<string, RegExp[]> = {
    video: [
      /youtube\.com\/watch/,
      /youtu\.be\//,
      /vimeo\.com\//,
      /dailymotion\.com\//,
    ],
    product: [
      /amazon\.(com|co\.uk|de|fr|jp|ca|in)\/.*\/(dp|gp\/product)\//,
      /ebay\.(com|co\.uk|de|fr|ca)\/itm\//,
      /etsy\.com\/listing\//,
      /walmart\.com\/ip\//,
    ],
    tweet: [/twitter\.com\/.*\/status\//, /x\.com\/.*\/status\//],
    image: [/\.(jpg|jpeg|png|gif|webp|svg)$/i],
  };

  for (const [type, regexList] of Object.entries(patterns)) {
    if (regexList.some((regex) => regex.test(url))) {
      return type as ContentType;
    }
  }

  return 'article'; // Default for URLs
}

/**
 * Extract YouTube video ID from URL
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Extract Vimeo video ID from URL
 */
export function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}
