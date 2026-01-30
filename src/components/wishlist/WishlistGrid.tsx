'use client';

import { WishlistItem as WishlistItemType, Currency } from '@/types';
import { WishlistItem } from './WishlistItem';

interface WishlistGridProps {
  items: WishlistItemType[];
  onItemClick: (item: WishlistItemType) => void;
  baseCurrency?: Currency;
}

export function WishlistGrid({ items, onItemClick, baseCurrency }: WishlistGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-gray-300 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No items yet</h3>
        <p className="text-gray-500">
          Tap the + button to add your first wishlist item
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <WishlistItem
          key={item.id}
          item={item}
          onClick={() => onItemClick(item)}
          baseCurrency={baseCurrency}
        />
      ))}
    </div>
  );
}
