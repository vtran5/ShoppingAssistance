import { WishlistItem, BudgetSuggestion } from '@/types';

/**
 * Filter items that can be considered for budget suggestions
 * - Must not be purchased
 * - Must have a valid priceInBaseCurrency
 * - Price must be within budget
 */
function getAvailableItems(items: WishlistItem[], budget: number): WishlistItem[] {
  return items.filter(
    (item) =>
      !item.isPurchased &&
      item.priceInBaseCurrency !== null &&
      item.priceInBaseCurrency > 0 &&
      item.priceInBaseCurrency <= budget
  );
}

/**
 * Strategy 1: High Priority
 * Greedy selection by priority (5 -> 1), pick items that fit budget
 */
function greedyByPriority(items: WishlistItem[], budget: number): BudgetSuggestion {
  const sorted = [...items].sort((a, b) => b.priority - a.priority);
  const selected: WishlistItem[] = [];
  let remaining = budget;

  for (const item of sorted) {
    const price = item.priceInBaseCurrency!;
    if (price <= remaining) {
      selected.push(item);
      remaining -= price;
    }
  }

  return {
    strategy: 'high-priority',
    items: selected,
    totalCost: Math.round((budget - remaining) * 100) / 100,
    priorityScore: selected.reduce((sum, item) => sum + item.priority, 0),
    remaining: Math.round(remaining * 100) / 100,
  };
}

/**
 * Strategy 2: Most Items
 * Greedy by cheapest price first, maximize item count
 */
function greedyByCheapest(items: WishlistItem[], budget: number): BudgetSuggestion {
  const sorted = [...items].sort(
    (a, b) => a.priceInBaseCurrency! - b.priceInBaseCurrency!
  );
  const selected: WishlistItem[] = [];
  let remaining = budget;

  for (const item of sorted) {
    const price = item.priceInBaseCurrency!;
    if (price <= remaining) {
      selected.push(item);
      remaining -= price;
    }
  }

  return {
    strategy: 'most-items',
    items: selected,
    totalCost: Math.round((budget - remaining) * 100) / 100,
    priorityScore: selected.reduce((sum, item) => sum + item.priority, 0),
    remaining: Math.round(remaining * 100) / 100,
  };
}

/**
 * Strategy 3: Best Value
 * Greedy by priority/price ratio, pick highest value items
 */
function greedyByValue(items: WishlistItem[], budget: number): BudgetSuggestion {
  const sorted = [...items].sort((a, b) => {
    const valueA = a.priority / a.priceInBaseCurrency!;
    const valueB = b.priority / b.priceInBaseCurrency!;
    return valueB - valueA;
  });
  const selected: WishlistItem[] = [];
  let remaining = budget;

  for (const item of sorted) {
    const price = item.priceInBaseCurrency!;
    if (price <= remaining) {
      selected.push(item);
      remaining -= price;
    }
  }

  return {
    strategy: 'best-value',
    items: selected,
    totalCost: Math.round((budget - remaining) * 100) / 100,
    priorityScore: selected.reduce((sum, item) => sum + item.priority, 0),
    remaining: Math.round(remaining * 100) / 100,
  };
}

/**
 * Check if two suggestions are identical (same items)
 */
function areSuggestionsEqual(a: BudgetSuggestion, b: BudgetSuggestion): boolean {
  if (a.items.length !== b.items.length) return false;
  const aIds = a.items.map((item) => item.id).sort();
  const bIds = b.items.map((item) => item.id).sort();
  return aIds.every((id, index) => id === bIds[index]);
}

/**
 * Remove duplicate suggestions
 */
function deduplicateSuggestions(suggestions: BudgetSuggestion[]): BudgetSuggestion[] {
  const unique: BudgetSuggestion[] = [];

  for (const suggestion of suggestions) {
    const isDuplicate = unique.some((existing) =>
      areSuggestionsEqual(existing, suggestion)
    );
    if (!isDuplicate) {
      unique.push(suggestion);
    }
  }

  return unique;
}

/**
 * Generate purchase suggestions for a given budget
 * Returns up to 3 unique suggestions using different strategies
 */
export function suggestPurchases(
  items: WishlistItem[],
  budget: number
): BudgetSuggestion[] {
  // Filter to available items
  const available = getAvailableItems(items, budget);

  // No items available
  if (available.length === 0) {
    return [];
  }

  // Generate suggestions using each strategy
  const suggestions: BudgetSuggestion[] = [
    greedyByPriority(available, budget),
    greedyByCheapest(available, budget),
    greedyByValue(available, budget),
  ];

  // Filter out empty suggestions and deduplicate
  const nonEmpty = suggestions.filter((s) => s.items.length > 0);
  return deduplicateSuggestions(nonEmpty);
}
