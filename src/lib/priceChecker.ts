import { scrapeProduct } from './scraper';
import { getItemsForPriceCheck, updateItemAfterPriceCheck } from './sheets';
import { WishlistItem, PriceCheckResult, PriceCheckSummary } from '@/types';

// Minimum percentage change to consider a price change significant
const PRICE_CHANGE_THRESHOLD = 0.01; // 1%

// Delay between requests to avoid rate limiting
const DELAY_BETWEEN_CHECKS_MS = 3000; // 3 seconds

/**
 * Check if price change exceeds threshold
 */
function isPriceChangeSignificant(oldPrice: number, newPrice: number): boolean {
  if (oldPrice === 0) return newPrice !== 0;
  const percentChange = Math.abs((newPrice - oldPrice) / oldPrice);
  return percentChange >= PRICE_CHANGE_THRESHOLD;
}

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check price for a single item
 */
async function checkItemPrice(item: WishlistItem): Promise<PriceCheckResult> {
  try {
    if (!item.url) {
      return {
        itemId: item.id,
        itemName: item.name,
        previousPrice: item.currentPrice,
        currentPrice: null,
        currency: item.currency,
        priceChanged: false,
        percentChange: null,
        error: 'No URL to check',
      };
    }

    const scraped = await scrapeProduct(item.url);

    if (!scraped.success || scraped.currentPrice === null) {
      return {
        itemId: item.id,
        itemName: item.name,
        previousPrice: item.currentPrice,
        currentPrice: null,
        currency: item.currency,
        priceChanged: false,
        percentChange: null,
        error: scraped.error || 'Failed to scrape price',
      };
    }

    const oldPrice = item.currentPrice;
    const newPrice = scraped.currentPrice;
    const percentChange = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;
    const priceChanged = isPriceChangeSignificant(oldPrice, newPrice);

    return {
      itemId: item.id,
      itemName: item.name,
      previousPrice: oldPrice,
      currentPrice: newPrice,
      currency: item.currency,
      priceChanged,
      percentChange: Math.round(percentChange * 100) / 100,
    };
  } catch (error) {
    return {
      itemId: item.id,
      itemName: item.name,
      previousPrice: item.currentPrice,
      currentPrice: null,
      currency: item.currency,
      priceChanged: false,
      percentChange: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check prices for all eligible items
 */
export async function checkAllPrices(): Promise<PriceCheckSummary> {
  const items = await getItemsForPriceCheck();
  const results: PriceCheckResult[] = [];
  const checkedAt = new Date().toISOString();

  let priceDrops = 0;
  let priceIncreases = 0;
  let unchanged = 0;
  let failed = 0;

  console.log(`Starting price check for ${items.length} items...`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Add delay between requests (skip for first item)
    if (i > 0) {
      await delay(DELAY_BETWEEN_CHECKS_MS);
    }

    console.log(`Checking item ${i + 1}/${items.length}: ${item.name}`);
    const result = await checkItemPrice(item);
    results.push(result);

    if (result.error || result.currentPrice === null) {
      console.log(`  Failed: ${result.error}`);
      failed++;
      continue;
    }

    // Update the item in Google Sheets
    if (result.priceChanged) {
      console.log(
        `  Price changed: ${result.previousPrice} -> ${result.currentPrice} (${result.percentChange}%)`
      );
      await updateItemAfterPriceCheck(item.id, result.currentPrice, result.previousPrice, checkedAt);

      if (result.currentPrice < result.previousPrice) {
        priceDrops++;
      } else {
        priceIncreases++;
      }
    } else {
      console.log(`  No significant change`);
      // Just update lastChecked timestamp, keep previousPrice the same
      await updateItemAfterPriceCheck(
        item.id,
        item.currentPrice,
        item.previousPrice ?? item.currentPrice,
        checkedAt
      );
      unchanged++;
    }
  }

  console.log(`Price check complete: ${priceDrops} drops, ${priceIncreases} increases, ${unchanged} unchanged, ${failed} failed`);

  return {
    totalChecked: items.length,
    priceDrops,
    priceIncreases,
    unchanged,
    failed,
    results,
    checkedAt,
  };
}
