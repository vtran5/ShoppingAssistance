'use client';

import { useState, useEffect } from 'react';
import { Currency, BudgetSuggestion } from '@/types';
import { BudgetInput } from '@/components/budget/BudgetInput';
import { SuggestionCard } from '@/components/budget/SuggestionCard';

export default function BudgetPage() {
  const [baseCurrency, setBaseCurrency] = useState<Currency>('USD');
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<BudgetSuggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Load user's base currency on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setBaseCurrency(data.baseCurrency);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoadingSettings(false);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (budget: number, currency: Currency) => {
    setIsLoadingSuggestions(true);
    setError(null);
    setSuggestions(null);
    setHasSearched(true);

    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget, currency }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
      setBaseCurrency(data.baseCurrency);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
            <div className="h-10 bg-gray-200 rounded mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">
          Budget Suggestions
        </h1>

        <BudgetInput
          onSubmit={handleSubmit}
          isLoading={isLoadingSuggestions}
          defaultCurrency={baseCurrency}
        />

        {/* Error state */}
        {error && (
          <div className="mt-6 bg-red-50 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Results */}
        {hasSearched && !isLoadingSuggestions && !error && (
          <div className="mt-6 space-y-4">
            {suggestions && suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <SuggestionCard
                  key={suggestion.strategy}
                  suggestion={suggestion}
                  baseCurrency={baseCurrency}
                  index={index + 1}
                />
              ))
            ) : (
              <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-lg">
                <p className="font-medium">No items fit your budget</p>
                <p className="text-sm mt-1">
                  Try increasing your budget or adding lower-priced items to your wishlist.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Initial state hint */}
        {!hasSearched && (
          <div className="mt-6 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm">
            Enter your budget to get smart suggestions based on item priority and price.
          </div>
        )}
      </div>
    </div>
  );
}
