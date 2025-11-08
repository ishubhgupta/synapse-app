import * as cheerio from 'cheerio';
import type { Scraper, ScraperResult } from './types';
import type { ArticleMetadata } from '@/types/bookmark';
import { extractDomain } from '../utils';

export class ArticleScraper implements Scraper {
  canHandle(_url: string): boolean {
    return true; // Default scraper for all URLs
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

      // Extract metadata with multiple fallbacks
      const title =
        $('meta[property="og:title"]').attr('content') ||
        $('meta[name="twitter:title"]').attr('content') ||
        $('h1').first().text().trim() ||
        $('title').text();

      const description =
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="twitter:description"]').attr('content') ||
        $('meta[name="description"]').attr('content');

      const thumbnail =
        $('meta[property="og:image"]').attr('content') ||
        $('meta[name="twitter:image"]').attr('content') ||
        $('img').first().attr('src');

      const author =
        $('meta[name="author"]').attr('content') ||
        $('meta[property="article:author"]').attr('content') ||
        $('.author').first().text().trim();

      const publishDate =
        $('meta[property="article:published_time"]').attr('content') ||
        $('meta[name="publish-date"]').attr('content') ||
        $('time').first().attr('datetime');

      const metadata: ArticleMetadata = {
        type: 'article',
        domain: extractDomain(url),
        author,
        publishDate,
      };

      return {
        title: title || 'Untitled Article',
        description,
        thumbnail,
        metadata,
      };
    } catch (error) {
      console.error('Article scraping error:', error);
      throw error;
    }
  }
}
