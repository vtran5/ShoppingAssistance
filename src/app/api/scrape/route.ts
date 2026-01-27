import { NextResponse } from 'next/server';
import { scrapeProduct } from '@/lib/scraper';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(body.url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const result = await scrapeProduct(body.url);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to scrape product information',
        name: '',
        currentPrice: null,
        originalPrice: null,
        currency: 'USD',
        imageUrl: null,
      },
      { status: 500 }
    );
  }
}
