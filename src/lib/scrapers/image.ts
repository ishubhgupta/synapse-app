/**
 * Image Scraper
 * Handles image URLs and image hosting platforms
 */

import type { Scraper, ScraperResult } from './types';
import { getImageMetadata } from '../imageStorage';

export class ImageScraper implements Scraper {
  canHandle(url: string): boolean {
    // Direct image files
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i.test(url)) {
      return true;
    }

    // Image hosting platforms
    const imageHosts = [
      'imgur.com',
      'flickr.com',
      'pinterest.com',
      'unsplash.com',
      'pexels.com',
      'pixabay.com',
      'i.redd.it', // Reddit images
      'i.imgur.com',
      'media.giphy.com',
    ];

    return imageHosts.some(host => url.includes(host));
  }

  async scrape(url: string): Promise<ScraperResult> {
    try {
      // For direct image URLs, just extract metadata
      if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url)) {
        return await this.scrapeDirectImageUrl(url);
      }

      // For image hosting platforms, try to extract the direct image URL
      if (url.includes('imgur.com')) {
        return await this.scrapeImgur(url);
      }

      // Fallback: treat as direct image
      return await this.scrapeDirectImageUrl(url);
    } catch (error) {
      console.error('Image scraping error:', error);
      
      // Return minimal data on error
      return {
        title: 'Image',
        thumbnail: url,
        metadata: {
          type: 'image',
          originalUrl: url,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  private async scrapeDirectImageUrl(url: string): Promise<ScraperResult> {
    // Get image metadata
    const metadata = await getImageMetadata(url);

    // Extract filename from URL
    const filename = url.split('/').pop()?.split('?')[0] || 'Image';

    return {
      title: decodeURIComponent(filename),
      thumbnail: url,
      metadata: {
        type: 'image',
        originalUrl: url,
        width: metadata?.width,
        height: metadata?.height,
        size: metadata?.size,
        format: metadata?.format,
      },
    };
  }

  private async scrapeImgur(url: string): Promise<ScraperResult> {
    try {
      // Extract Imgur ID from URL
      const imgurIdMatch = url.match(/imgur\.com\/(?:gallery\/|a\/)?([a-zA-Z0-9]+)/);
      
      if (imgurIdMatch) {
        const imgurId = imgurIdMatch[1];
        const directImageUrl = `https://i.imgur.com/${imgurId}.jpg`;

        return {
          title: `Imgur Image - ${imgurId}`,
          thumbnail: directImageUrl,
          metadata: {
            type: 'image',
            platform: 'imgur',
            originalUrl: url,
            directImageUrl,
            imgurId,
          },
        };
      }

      // Fallback to direct URL scraping
      return await this.scrapeDirectImageUrl(url);
    } catch (error) {
      console.error('Imgur scraping error:', error);
      return await this.scrapeDirectImageUrl(url);
    }
  }
}
