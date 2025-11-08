import * as cheerio from 'cheerio';
import type { Scraper, ScraperResult } from './types';
import { extractYouTubeId, extractVimeoId } from '../contentDetector';
import type { VideoMetadata } from '@/types/bookmark';

export class VideoScraper implements Scraper {
  canHandle(url: string): boolean {
    return /youtube\.com\/watch|youtu\.be|vimeo\.com|dailymotion\.com/.test(url);
  }

  async scrape(url: string): Promise<ScraperResult> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract Open Graph metadata
      const title =
        $('meta[property="og:title"]').attr('content') ||
        $('meta[name="twitter:title"]').attr('content') ||
        $('title').text();

      const description =
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="twitter:description"]').attr('content') ||
        $('meta[name="description"]').attr('content');

      const thumbnail =
        $('meta[property="og:image"]').attr('content') ||
        $('meta[name="twitter:image"]').attr('content');

      // Platform-specific extraction
      let metadata: VideoMetadata;

      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = extractYouTubeId(url);
        
        // Extract duration from JSON-LD
        let duration: string | undefined;
        
        try {
          const jsonLd = $('script[type="application/ld+json"]').html();
          if (jsonLd) {
            const data = JSON.parse(jsonLd);
            duration = data.duration;
          }
        } catch {
          // Ignore parsing errors
        }
        
        const channel = $('link[itemprop="name"]').attr('content') ||
                  $('meta[name="author"]').attr('content');
        
        metadata = {
          type: 'video',
          platform: 'youtube',
          videoId: videoId || '',
          duration,
          channel,
        };
      } else if (url.includes('vimeo.com')) {
        const videoId = extractVimeoId(url);
        metadata = {
          type: 'video',
          platform: 'vimeo',
          videoId: videoId || '',
        };
      } else {
        metadata = {
          type: 'video',
          platform: 'dailymotion',
          videoId: '',
        };
      }

      return {
        title: title || 'Untitled Video',
        description,
        thumbnail,
        metadata,
      };
    } catch (error) {
      console.error('Video scraping error:', error);
      throw error;
    }
  }
}
