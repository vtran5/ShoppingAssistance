'use client';

import { useState } from 'react';
import { Currency } from '@/types';
import { Button } from '@/components/ui/Button';

interface BudgetInputProps {
  onSubmit: (budget: number) => void;
  isLoading: boolean;
  baseCurrency: Currency;
}

export function BudgetInput({
  onSubmit,
  isLoading,
  baseCurrency,
}: BudgetInputProps) {
  const [budget, setBudget] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const budgetNumber = parseFloat(budget);
    if (isNaN(budgetNumber) || budgetNumber <= 0) {
      setError('Please enter a valid budget amount');
      return;
    }

    onSubmit(budgetNumber);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="budget"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Your Budget ({baseCurrency})
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
          <span className="flex items-center px-3 py-2 min-h-[44px] bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
            {baseCurrency}
          </span>
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
