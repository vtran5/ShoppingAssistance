import { NextRequest } from 'next/server';
import { checkAllPrices } from '@/lib/priceChecker';

export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET environment variable is not set');
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const expectedToken = `Bearer ${cronSecret}`;

  if (!authHeader || authHeader !== expectedToken) {
    console.warn('Unauthorized price check attempt');
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Starting price check via API...');
    const summary = await checkAllPrices();
    console.log('Price check complete:', {
      total: summary.totalChecked,
      drops: summary.priceDrops,
      increases: summary.priceIncreases,
      unchanged: summary.unchanged,
      failed: summary.failed,
    });

    return Response.json({ summary });
  } catch (error) {
    console.error('Price check failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Price check failed' },
      { status: 500 }
    );
  }
}

// Support GET for easier testing and Vercel cron compatibility
export async function GET(request: NextRequest) {
  return POST(request);
}
