'use client';

import { ItemViewSize } from '@/types';

interface ViewSizeDropdownProps {
  value: ItemViewSize;
  onChange: (value: ItemViewSize) => void;
}

const VIEW_SIZE_OPTIONS: { value: ItemViewSize; label: string }[] = [
  { value: 'large', label: '1 per row' },
  { value: 'medium', label: '2 per row' },
  { value: 'small', label: '4 per row' },
];

export function ViewSizeDropdown({ value, onChange }: ViewSizeDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="viewSize" className="text-sm text-gray-600 whitespace-nowrap">
        View:
      </label>
      <select
        id="viewSize"
        aria-label="Items per row"
        value={value}
        onChange={(e) => onChange(e.target.value as ItemViewSize)}
        className="px-3 py-2 min-h-[44px] text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {VIEW_SIZE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
