export interface ScraperResult {
  title: string;
  description?: string;
  thumbnail?: string;
  metadata: Record<string, unknown> | unknown;
}

export interface Scraper {
  canHandle(url: string): boolean;
  scrape(url: string): Promise<ScraperResult>;
}
