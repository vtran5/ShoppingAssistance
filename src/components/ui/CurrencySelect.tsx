'use client';

import { Currency } from '@/types';

interface CurrencySelectProps {
  value: Currency;
  onChange: (value: Currency) => void;
  disabled?: boolean;
  className?: string;
}

const CURRENCIES: { code: Currency; name: string; symbol: string }[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
];

export function CurrencySelect({
  value,
  onChange,
  disabled = false,
  className = '',
}: CurrencySelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Currency)}
      disabled={disabled}
      className={`
        px-3 py-2 min-h-[44px] rounded-lg border border-gray-300 bg-white
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        disabled:bg-gray-100 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {CURRENCIES.map((currency) => (
        <option key={currency.code} value={currency.code}>
          {currency.code} ({currency.symbol})
        </option>
      ))}
    </select>
  );
}

export { CURRENCIES };
