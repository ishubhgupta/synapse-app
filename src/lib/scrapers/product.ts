import * as cheerio from 'cheerio';
import type { Scraper, ScraperResult } from './types';
import type { ProductMetadata } from '@/types/bookmark';
import { extractDomain } from '../utils';

export class ProductScraper implements Scraper {
  canHandle(url: string): boolean {
    return /amazon\.|ebay\.|etsy\.com|walmart\.com/.test(url);
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
        $('#productTitle').text().trim() ||
        $('h1').first().text().trim() ||
        $('title').text();

      const description =
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content');

      const thumbnail =
        $('meta[property="og:image"]').attr('content') ||
        $('#landingImage').attr('src') ||
        $('img').first().attr('src');

      // Extract product-specific data
      let price: string | undefined;
      let currency: string | undefined;
      let brand: string | undefined;

      if (url.includes('amazon')) {
        price = $('.a-price-whole').first().text().trim() ||
                $('.a-offscreen').first().text().trim();
        brand = $('#bylineInfo').text().trim().replace('Brand: ', '');
        currency = 'USD'; // Default, would need more logic for other currencies
      }

      const metadata: ProductMetadata = {
        type: 'product',
        domain: extractDomain(url),
        price,
        currency,
        brand,
      };

      return {
        title: title || 'Untitled Product',
        description,
        thumbnail,
        metadata,
      };
    } catch (error) {
      console.error('Product scraping error:', error);
      throw error;
    }
  }
}
