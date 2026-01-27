'use client';

import { SortOption } from '@/types';

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'priority', label: 'Priority (High → Low)' },
  { value: 'price-low', label: 'Price (Low → High)' },
  { value: 'price-high', label: 'Price (High → Low)' },
  { value: 'date-added', label: 'Date Added (Newest)' },
];

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-gray-600 whitespace-nowrap">
        Sort by:
      </label>
      <select
        id="sort"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="px-3 py-2 min-h-[44px] text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
