'use client';

import { useState } from 'react';
import { Currency } from '@/types';
import { Button } from '@/components/ui/Button';
import { CurrencySelect } from '@/components/ui/CurrencySelect';

interface BudgetInputProps {
  onSubmit: (budget: number, currency: Currency) => void;
  isLoading: boolean;
  defaultCurrency: Currency;
}

export function BudgetInput({
  onSubmit,
  isLoading,
  defaultCurrency,
}: BudgetInputProps) {
  const [budget, setBudget] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const budgetNumber = parseFloat(budget);
    if (isNaN(budgetNumber) || budgetNumber <= 0) {
      setError('Please enter a valid budget amount');
      return;
    }

    onSubmit(budgetNumber, currency);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="budget"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Your Budget
        </label>
        <div className="flex gap-2">
          <input
            id="budget"
            type="number"
            step="0.01"
            min="0"
            value={budget}
            onChange={(e) => {
              setBudget(e.target.value);
              setError(null);
            }}
            placeholder="Enter amount"
            disabled={isLoading}
            className="
              flex-1 px-3 py-2 min-h-[44px] rounded-lg border border-gray-300
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
            "
          />
          <CurrencySelect
            value={currency}
            onChange={setCurrency}
            disabled={isLoading}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
      <Button
        type="submit"
        loading={isLoading}
        disabled={!budget}
        className="w-full"
      >
        Get Suggestions
      </Button>
    </form>
  );
}
