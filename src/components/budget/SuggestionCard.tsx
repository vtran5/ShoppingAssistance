'use client';

import { BudgetSuggestion, Currency } from '@/types';
import { formatPrice } from '@/lib/currency';

interface SuggestionCardProps {
  suggestion: BudgetSuggestion;
  baseCurrency: Currency;
  index: number;
}

const STRATEGY_TITLES: Record<BudgetSuggestion['strategy'], string> = {
  'high-priority': 'High Priority',
  'most-items': 'Most Items',
  'best-value': 'Best Value',
};

const STRATEGY_DESCRIPTIONS: Record<BudgetSuggestion['strategy'], string> = {
  'high-priority': 'Prioritizes your highest-rated items',
  'most-items': 'Maximizes the number of items',
  'best-value': 'Best priority-to-price ratio',
};

export function SuggestionCard({
  suggestion,
  baseCurrency,
  index,
}: SuggestionCardProps) {
  const { strategy, items, totalCost, priorityScore, remaining } = suggestion;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">
          Option {index}: {STRATEGY_TITLES[strategy]}
        </h3>
        <p className="text-sm text-gray-500">{STRATEGY_DESCRIPTIONS[strategy]}</p>
      </div>

      <div className="p-4">
        {/* Item list */}
        <ul className="space-y-2 mb-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between items-start text-sm"
            >
              <span className="text-gray-700 flex-1 pr-2">{item.name}</span>
              <span className="text-gray-900 font-medium whitespace-nowrap">
                {item.currency === baseCurrency ? (
                  formatPrice(item.currentPrice, item.currency)
                ) : (
                  <>
                    <span className="text-gray-500">
                      {formatPrice(item.currentPrice, item.currency)}
                    </span>
                    <span className="text-gray-400 mx-1">=</span>
                    {formatPrice(item.priceInBaseCurrency!, baseCurrency)}
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>

        {/* Summary */}
        <div className="border-t border-gray-200 pt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total</span>
            <span className="font-semibold text-gray-900">
              {formatPrice(totalCost, baseCurrency)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Remaining</span>
            <span className="text-green-600 font-medium">
              {formatPrice(remaining, baseCurrency)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Priority Score</span>
            <span className="text-gray-900">{priorityScore} pts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
