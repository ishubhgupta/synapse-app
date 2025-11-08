import { VideoScraper } from './video';
import { ProductScraper } from './product';
import { ArticleScraper } from './article';
import { ImageScraper } from './image';
import type { Scraper, ScraperResult } from './types';

export class ScraperManager {
  private scrapers: Scraper[];

  constructor() {
    this.scrapers = [
      new ImageScraper(), // Check images first
      new VideoScraper(),
      new ProductScraper(),
      new ArticleScraper(), // Must be last (default)
    ];
  }

  async scrape(url: string): Promise<ScraperResult> {
    const scraper = this.scrapers.find((s) => s.canHandle(url));

    if (!scraper) {
      // Fallback to minimal data
      return {
        title: url,
        metadata: {},
      };
    }

    try {
      return await scraper.scrape(url);
    } catch (error) {
      console.error('Scraping failed:', error);
      // Return minimal data on error
      return {
        title: url,
        metadata: {
          error: 'Failed to extract metadata',
        },
      };
    }
  }
}

// Export singleton instance
export const scraperManager = new ScraperManager();
