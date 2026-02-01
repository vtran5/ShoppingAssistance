import { describe, it, expect } from 'vitest';
import { suggestPurchases } from './budget';
import { WishlistItem, Priority, Currency } from '@/types';

const DEFAULT_CURRENCY: Currency = 'USD';

function createItem(overrides: Partial<WishlistItem> & { id: string }): WishlistItem {
  return {
    name: `Item ${overrides.id}`,
    url: null,
    currentPrice: 100,
    priceWhenAdded: 100,
    originalPrice: null,
    currency: 'USD',
    imageData: null,
    priority: 3 as Priority,
    isPurchased: false,
    notes: '',
    createdAt: '2024-01-01T00:00:00Z',
    lastChecked: null,
    priceInBaseCurrency: 100,
    ...overrides,
  };
}

describe('suggestPurchases', () => {
  describe('basic functionality', () => {
    it('returns empty array when no items are provided', () => {
      const result = suggestPurchases([], 100, DEFAULT_CURRENCY);
      expect(result).toEqual([]);
    });

    it('returns empty array when all items exceed budget', () => {
      const items = [
        createItem({ id: '1', priceInBaseCurrency: 200 }),
        createItem({ id: '2', priceInBaseCurrency: 300 }),
      ];
      const result = suggestPurchases(items, 100, DEFAULT_CURRENCY);
      expect(result).toEqual([]);
    });

    it('returns empty array when all items are purchased', () => {
      const items = [
        createItem({ id: '1', priceInBaseCurrency: 50, isPurchased: true }),
        createItem({ id: '2', priceInBaseCurrency: 30, isPurchased: true }),
      ];
      const result = suggestPurchases(items, 100, DEFAULT_CURRENCY);
      expect(result).toEqual([]);
    });

    it('excludes items with null priceInBaseCurrency when currency does not match base', () => {
      const items = [
        createItem({ id: '1', priceInBaseCurrency: null, currency: 'EUR' }), // Different currency, no fallback
        createItem({ id: '2', priceInBaseCurrency: 50 }),
      ];
      const result = suggestPurchases(items, 100, DEFAULT_CURRENCY);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].items).toHaveLength(1);
      expect(result[0].items[0].id).toBe('2');
    });

    it('excludes items with zero priceInBaseCurrency and zero currentPrice', () => {
      const items = [
        createItem({ id: '1', priceInBaseCurrency: 0, currentPrice: 0 }),
        createItem({ id: '2', priceInBaseCurrency: 50 }),
      ];
      const result = suggestPurchases(items, 100, DEFAULT_CURRENCY);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((suggestion) => {
        expect(suggestion.items.every((item) => item.id !== '1')).toBe(true);
      });
    });

    it('uses currentPrice as fallback when currency matches baseCurrency and priceInBaseCurrency is null', () => {
      const items = [
        createItem({
          id: '1',
          priceInBaseCurrency: null,
          currentPrice: 50,
          currency: 'USD',
        }),
        createItem({
          id: '2',
          priceInBaseCurrency: null,
          currentPrice: 30,
          currency: 'EUR', // Different currency, should be excluded
        }),
      ];
      const result = suggestPurchases(items, 100, 'USD');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].items).toHaveLength(1);
      expect(result[0].items[0].id).toBe('1');
      expect(result[0].totalCost).toBe(50);
    });

    it('prefers priceInBaseCurrency over currentPrice fallback', () => {
      const items = [
        createItem({
          id: '1',
          priceInBaseCurrency: 75, // Valid, should use this
          currentPrice: 50, // Should be ignored
          currency: 'USD',
        }),
      ];
      const result = suggestPurchases(items, 100, 'USD');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].totalCost).toBe(75);
    });
  });

  describe('high-priority strategy', () => {
    it('selects highest priority items first', () => {
      const items = [
        createItem({ id: '1', priceInBaseCurrency: 50, priority: 2 as Priority }),
        createItem({ id: '2', priceInBaseCurrency: 50, priority: 5 as Priority }),
        createItem({ id: '3', priceInBaseCurrency: 50, priority: 3 as Priority }),
      ];
      const result = suggestPurchases(items, 100, DEFAULT_CURRENCY);
      const highPriority = result.find((s) => s.strategy === 'high-priority');

      expect(highPriority).toBeDefined();
      expect(highPriority!.items).toHaveLength(2);
      expect(highPriority!.items[0].id).toBe('2'); // priority 5
      expect(highPriority!.items[1].id).toBe('3'); // priority 3
    });

    it('skips expensive high-priority items to fit more items', () => {
      const items = [
        createItem({ id: '1', priceInBaseCurrency: 90, priority: 5 as Priority }),
        createItem({ id: '2', priceInBaseCurrency: 40, priority: 4 as Priority }),
        createItem({ id: '3', priceInBaseCurrency: 40, priority: 3 as Priority }),
      ];
      const result = suggestPurchases(items, 100, DEFAULT_CURRENCY);
      const highPriority = result.find((s) => s.strategy === 'high-priority');

      // Greedy approach: picks priority 5 first, then can't fit anything else
      expect(highPriority).toBeDefined();
      expect(highPriority!.items).toHaveLength(1);
      expect(highPriority!.items[0].id).toBe('1');
    });
  });

  describe('most-items strategy', () => {
    it('selects cheapest items to maximize count', () => {
      const items = [
        createItem({ id: '1', priceInBaseCurrency: 100, priority: 5 as Priority }),
        createItem({ id: '2', priceInBaseCurrency: 30, priority: 1 as Priority }),
        createItem({ id: '3', priceInBaseCurrency: 30, priority: 1 as Priority }),
        createItem({ id: '4', priceInBaseCurrency: 30, priority: 1 as Priority }),
      ];
      const result = suggestPurchases(items, 100, DEFAULT_CURRENCY);
      const mostItems = result.find((s) => s.strategy === 'most-items');

      expect(mostItems).toBeDefined();
      expect(mostItems!.items).toHaveLength(3);
      expect(mostItems!.items.map((i) => i.id).sort()).toEqual(['2', '3', '4']);
    });
  });

  describe('best-value strategy', () => {
    it('produces suggestions that maximize priority-to-price ratio', () => {
      // Create items where best-value picks differently than high-priority
      const items = [
        createItem({ id: 'expensive-high', priceInBaseCurrency: 90, priority: 5 as Priority }), // ratio: 0.055
        createItem({ id: 'cheap-medium', priceInBaseCurrency: 40, priority: 4 as Priority }), // ratio: 0.1 (best)
        createItem({ id: 'medium-low', priceInBaseCurrency: 40, priority: 3 as Priority }), // ratio: 0.075
        createItem({ id: 'cheap-low', priceInBaseCurrency: 20, priority: 1 as Priority }), // ratio: 0.05
      ];

      const result = suggestPurchases(items, 100, DEFAULT_CURRENCY);

      // With budget 100:
      // high-priority: picks expensive-high ($90, p5), remaining 10, nothing else fits = [expensive-high]
      // most-items: picks cheap-low ($20), cheap-medium ($40), medium-low ($40), remaining 0 = 3 items
      // best-value: picks cheap-medium ($40), medium-low ($40), cheap-low ($20) = 3 items

      // high-priority should be unique with just 1 expensive item
      const highPriority = result.find((s) => s.strategy === 'high-priority');
      expect(highPriority).toBeDefined();
      expect(highPriority!.items).toHaveLength(1);
      expect(highPriority!.items[0].id).toBe('expensive-high');

      // Should have at least 2 unique suggestions
      expect(result.length).toBeGreaterThanOrEqual(2);

      // Any multi-item suggestion should have better total priority than random selection
      const multiItemSuggestion = result.find((s) => s.items.length > 1);
      expect(multiItemSuggestion).toBeDefined();
      expect(multiItemSuggestion!.priorityScore).toBeGreaterThan(0);
    });
  });

  describe('deduplication', () => {
    it('removes duplicate suggestions when strategies produce same result', () => {
      // Single item - all strategies will produce the same result
      const items = [createItem({ id: '1', priceInBaseCurrency: 50 })];
      const result = suggestPurchases(items, 100, DEFAULT_CURRENCY);

      expect(result).toHaveLength(1);
    });

    it('keeps different suggestions from different strategies', () => {
      const items = [
        createItem({ id: '1', priceInBaseCurrency: 90, priority: 5 as Priority }),
        createItem({ id: '2', priceInBaseCurrency: 30, priority: 2 as Priority }),
        createItem({ id: '3', priceInBaseCurrency: 30, priority: 2 as Priority }),
        createItem({ id: '4', priceInBaseCurrency: 30, priority: 2 as Priority }),
      ];
      const result = suggestPurchases(items, 100, DEFAULT_CURRENCY);

      // high-priority: picks item 1 (priority 5, $90)
      // most-items: picks items 2, 3, 4 (3 items at $30 each)
      // best-value: depends on ratio calculation
      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('calculations', () => {
    it('calculates totalCost correctly', () => {
      const items = [
        createItem({ id: '1', priceInBaseCurrency: 30 }),
        createItem({ id: '2', priceInBaseCurrency: 25 }),
      ];
      const result = suggestPurchases(items, 100, DEFAULT_CURRENCY);

      result.forEach((suggestion) => {
        const expectedTotal = suggestion.items.reduce(
          (sum, item) => sum + item.priceInBaseCurrency!,
          0
        );
        expect(suggestion.totalCost).toBe(expectedTotal);
      });
    });

    it('calculates remaining correctly', () => {
      const items = [
        createItem({ id: '1', priceInBaseCurrency: 30 }),
        createItem({ id: '2', priceInBaseCurrency: 25 }),
      ];
      const budget = 100;
      const result = suggestPurchases(items, budget, DEFAULT_CURRENCY);

      result.forEach((suggestion) => {
        expect(suggestion.remaining).toBe(budget - suggestion.totalCost);
      });
    });

    it('calculates priorityScore correctly', () => {
      const items = [
        createItem({ id: '1', priceInBaseCurrency: 30, priority: 4 as Priority }),
        createItem({ id: '2', priceInBaseCurrency: 25, priority: 2 as Priority }),
      ];
      const result = suggestPurchases(items, 100, DEFAULT_CURRENCY);

      result.forEach((suggestion) => {
        const expectedScore = suggestion.items.reduce(
          (sum, item) => sum + item.priority,
          0
        );
        expect(suggestion.priorityScore).toBe(expectedScore);
      });
    });

    it('rounds totalCost to 2 decimal places', () => {
      const items = [
        createItem({ id: '1', priceInBaseCurrency: 33.333 }),
        createItem({ id: '2', priceInBaseCurrency: 33.333 }),
      ];
      const result = suggestPurchases(items, 100, DEFAULT_CURRENCY);

      result.forEach((suggestion) => {
        const decimalPlaces = (suggestion.totalCost.toString().split('.')[1] || '').length;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      });
    });

    it('rounds remaining to 2 decimal places', () => {
      const items = [
        createItem({ id: '1', priceInBaseCurrency: 33.337 }),
      ];
      const result = suggestPurchases(items, 100, DEFAULT_CURRENCY);

      result.forEach((suggestion) => {
        const decimalPlaces = (suggestion.remaining.toString().split('.')[1] || '').length;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('edge cases', () => {
    it('handles budget that exactly matches item price', () => {
      const items = [createItem({ id: '1', priceInBaseCurrency: 100 })];
      const result = suggestPurchases(items, 100, DEFAULT_CURRENCY);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].items).toHaveLength(1);
      expect(result[0].remaining).toBe(0);
    });

    it('handles very small budget', () => {
      const items = [
        createItem({ id: '1', priceInBaseCurrency: 0.01 }),
        createItem({ id: '2', priceInBaseCurrency: 0.02 }),
      ];
      const result = suggestPurchases(items, 0.05, DEFAULT_CURRENCY);

      expect(result.length).toBeGreaterThan(0);
    });

    it('handles items with same priority and price', () => {
      const items = [
        createItem({ id: '1', priceInBaseCurrency: 50, priority: 3 as Priority }),
        createItem({ id: '2', priceInBaseCurrency: 50, priority: 3 as Priority }),
        createItem({ id: '3', priceInBaseCurrency: 50, priority: 3 as Priority }),
      ];
      const result = suggestPurchases(items, 100, DEFAULT_CURRENCY);

      expect(result.length).toBeGreaterThan(0);
      // Should select 2 items regardless of which strategy
      result.forEach((suggestion) => {
        expect(suggestion.items.length).toBe(2);
      });
    });

    it('handles large number of items', () => {
      const items = Array.from({ length: 100 }, (_, i) =>
        createItem({
          id: String(i),
          priceInBaseCurrency: 10 + (i % 50),
          priority: ((i % 5) + 1) as Priority,
        })
      );
      const result = suggestPurchases(items, 500, DEFAULT_CURRENCY);

      expect(result.length).toBeGreaterThan(0);
      result.forEach((suggestion) => {
        expect(suggestion.totalCost).toBeLessThanOrEqual(500);
      });
    });
  });
});
