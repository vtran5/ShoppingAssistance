import { Currency } from '@/types';

export interface ScrapedProduct {
  name: string;
  currentPrice: number | null;
  originalPrice: number | null;
  currency: Currency;
  imageUrl: string | null;
  success: boolean;
  error?: string;
}

// Currency detection patterns
const CURRENCY_PATTERNS: { pattern: RegExp; currency: Currency }[] = [
  { pattern: /\$|USD|US\$/i, currency: 'USD' },
  { pattern: /€|EUR/i, currency: 'EUR' },
  { pattern: /£|GBP/i, currency: 'GBP' },
  { pattern: /¥|JPY|円/i, currency: 'JPY' },
  { pattern: /A\$|AUD/i, currency: 'AUD' },
  { pattern: /C\$|CAD/i, currency: 'CAD' },
  { pattern: /₫|VND|đ/i, currency: 'VND' },
];

function detectCurrency(priceText: string): Currency {
  for (const { pattern, currency } of CURRENCY_PATTERNS) {
    if (pattern.test(priceText)) {
      return currency;
    }
  }
  return 'USD'; // Default
}

function parsePrice(priceText: string): number | null {
  // Remove currency symbols and whitespace
  const cleaned = priceText.replace(/[^0-9.,]/g, '');

  // Handle different decimal separators
  // If there's both comma and period, determine which is decimal
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // If comma comes after period, comma is decimal (European: 1.234,56)
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      const normalized = cleaned.replace(/\./g, '').replace(',', '.');
      return parseFloat(normalized) || null;
    }
    // Period comes after comma (US: 1,234.56)
    const normalized = cleaned.replace(/,/g, '');
    return parseFloat(normalized) || null;
  }

  // Only comma - could be decimal or thousands
  if (cleaned.includes(',')) {
    // If only 2 digits after comma, treat as decimal
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      return parseFloat(cleaned.replace(',', '.')) || null;
    }
    // Otherwise treat comma as thousands separator
    return parseFloat(cleaned.replace(/,/g, '')) || null;
  }

  return parseFloat(cleaned) || null;
}

function extractJsonLd(html: string): Record<string, unknown> | null {
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

  if (!jsonLdMatch) return null;

  for (const match of jsonLdMatch) {
    try {
      const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
      const parsed = JSON.parse(jsonContent);

      // Handle array of schemas
      const schemas = Array.isArray(parsed) ? parsed : [parsed];

      for (const schema of schemas) {
        if (schema['@type'] === 'Product') {
          return schema;
        }
        // Check @graph array
        if (schema['@graph']) {
          for (const item of schema['@graph']) {
            if (item['@type'] === 'Product') {
              return item;
            }
          }
        }
      }
    } catch {
      // Continue to next match
    }
  }

  return null;
}

function extractOpenGraph(html: string): Record<string, string> {
  const og: Record<string, string> = {};

  // og:title
  const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (titleMatch) og.title = titleMatch[1];

  // og:image
  const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (imageMatch) og.image = imageMatch[1];

  // product:price:amount
  const priceMatch = html.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i);
  if (priceMatch) og.price = priceMatch[1];

  // product:price:currency
  const currencyMatch = html.match(/<meta[^>]*property=["']product:price:currency["'][^>]*content=["']([^"']+)["']/i);
  if (currencyMatch) og.currency = currencyMatch[1];

  return og;
}

function extractMetaTags(html: string): Record<string, string> {
  const meta: Record<string, string> = {};

  // title tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) meta.title = titleMatch[1].trim();

  // meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (descMatch) meta.description = descMatch[1];

  return meta;
}

function extractGenericPrice(html: string): { price: number | null; currency: Currency } {
  // Common price patterns in HTML
  const pricePatterns = [
    // Price with currency symbol
    /["'>\s](\$|€|£|¥|₫)[\s]?([0-9,]+\.?[0-9]*)/g,
    // Price with currency after
    /([0-9,]+\.?[0-9]*)[\s]?(USD|EUR|GBP|JPY|VND)/gi,
    // Common class names for prices
    /class=["'][^"']*price[^"']*["'][^>]*>([^<]+)/gi,
    /data-price=["']([^"']+)["']/gi,
  ];

  for (const pattern of pricePatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const priceText = match[0];
      const price = parsePrice(priceText);
      if (price && price > 0 && price < 1000000) { // Sanity check
        return {
          price,
          currency: detectCurrency(priceText),
        };
      }
    }
  }

  return { price: null, currency: 'USD' };
}

function extractImage(html: string, baseUrl: string): string | null {
  // Try og:image first
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImageMatch) {
    return resolveUrl(ogImageMatch[1], baseUrl);
  }

  // Try product image patterns
  const imagePatterns = [
    /<img[^>]*class=["'][^"']*product[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]*id=["'][^"']*product[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]*data-src=["']([^"']+)["'][^>]*class=["'][^"']*product/i,
  ];

  for (const pattern of imagePatterns) {
    const match = html.match(pattern);
    if (match) {
      return resolveUrl(match[1], baseUrl);
    }
  }

  return null;
}

function resolveUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

export async function scrapeProduct(url: string): Promise<ScrapedProduct> {
  try {
    // Validate URL
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return {
        name: '',
        currentPrice: null,
        originalPrice: null,
        currency: 'USD',
        imageUrl: null,
        success: false,
        error: 'Invalid URL protocol',
      };
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      return {
        name: '',
        currentPrice: null,
        originalPrice: null,
        currency: 'USD',
        imageUrl: null,
        success: false,
        error: `Failed to fetch page: ${response.status}`,
      };
    }

    const html = await response.text();

    // Try JSON-LD first (most reliable)
    const jsonLd = extractJsonLd(html);
    if (jsonLd) {
      const offers = jsonLd.offers as Record<string, unknown> | undefined;
      const offerData = Array.isArray(offers) ? offers[0] : offers;

      let price: number | null = null;
      let currency: Currency = 'USD';

      if (offerData) {
        price = parseFloat(String(offerData.price || offerData.lowPrice || '')) || null;
        currency = (String(offerData.priceCurrency || 'USD')) as Currency;
      }

      // Get image
      let imageUrl: string | null = null;
      if (jsonLd.image) {
        if (typeof jsonLd.image === 'string') {
          imageUrl = resolveUrl(jsonLd.image, url);
        } else if (Array.isArray(jsonLd.image)) {
          imageUrl = resolveUrl(String(jsonLd.image[0]), url);
        } else if (typeof jsonLd.image === 'object' && jsonLd.image !== null) {
          const imgObj = jsonLd.image as Record<string, unknown>;
          imageUrl = resolveUrl(String(imgObj.url || imgObj.contentUrl || ''), url);
        }
      }

      return {
        name: String(jsonLd.name || ''),
        currentPrice: price,
        originalPrice: null,
        currency,
        imageUrl: imageUrl || extractImage(html, url),
        success: true,
      };
    }

    // Try OpenGraph tags
    const og = extractOpenGraph(html);
    if (og.title && og.price) {
      return {
        name: og.title,
        currentPrice: parseFloat(og.price) || null,
        originalPrice: null,
        currency: (og.currency as Currency) || 'USD',
        imageUrl: og.image ? resolveUrl(og.image, url) : extractImage(html, url),
        success: true,
      };
    }

    // Fallback to generic extraction
    const meta = extractMetaTags(html);
    const { price, currency } = extractGenericPrice(html);

    return {
      name: og.title || meta.title || '',
      currentPrice: price,
      originalPrice: null,
      currency,
      imageUrl: og.image ? resolveUrl(og.image, url) : extractImage(html, url),
      success: true,
    };

  } catch (error) {
    return {
      name: '',
      currentPrice: null,
      originalPrice: null,
      currency: 'USD',
      imageUrl: null,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scrape product',
    };
  }
}
