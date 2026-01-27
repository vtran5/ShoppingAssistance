import { Currency } from '@/types';

// Currency symbols mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  VND: '₫',
  CNY: '¥',
  KRW: '₩',
  INR: '₹',
  THB: '฿',
  SGD: 'S$',
  MYR: 'RM',
  PHP: '₱',
  IDR: 'Rp',
  NZD: 'NZ$',
  CHF: 'CHF',
  HKD: 'HK$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  MXN: 'MX$',
  BRL: 'R$',
};

// Currencies that typically don't show decimal places
const NO_DECIMALS_CURRENCIES = ['JPY', 'VND', 'KRW', 'IDR'];

/**
 * Get the symbol for a currency code
 */
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

/**
 * Format a price with its currency symbol
 */
export function formatPrice(amount: number, currency: Currency): string {
  const symbol = getCurrencySymbol(currency);
  const useDecimals = !NO_DECIMALS_CURRENCIES.includes(currency);

  // Format the number
  const formattedAmount = useDecimals
    ? amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : amount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });

  // Position symbol (most currencies use prefix, some use suffix)
  const suffixCurrencies = ['VND'];
  if (suffixCurrencies.includes(currency)) {
    return `${formattedAmount}${symbol}`;
  }

  return `${symbol}${formattedAmount}`;
}

/**
 * Parse a price string to a number
 */
export function parsePrice(priceString: string): number | null {
  // Remove currency symbols and commas
  const cleaned = priceString.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}
