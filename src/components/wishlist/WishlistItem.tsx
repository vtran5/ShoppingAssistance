'use client';

import { WishlistItem as WishlistItemType, Currency } from '@/types';
import { ItemImage } from '@/components/ui/ItemImage';
import { StarRating } from '@/components/ui/StarRating';
import { formatPrice } from '@/lib/currency';

interface WishlistItemProps {
  item: WishlistItemType;
  onClick: () => void;
  baseCurrency?: Currency;
}

export function WishlistItem({ item, onClick, baseCurrency }: WishlistItemProps) {
  const priceChange = item.currentPrice - item.priceWhenAdded;
  const priceChangePercent = item.priceWhenAdded
    ? ((priceChange / item.priceWhenAdded) * 100).toFixed(0)
    : 0;

  // Show converted price if item currency differs from base currency
  const showConvertedPrice =
    baseCurrency && item.currency !== baseCurrency && item.priceInBaseCurrency !== null;

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left bg-white rounded-xl shadow-sm border border-gray-200
        overflow-hidden transition-all hover:shadow-md hover:border-gray-300
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${item.isPurchased ? 'opacity-60' : ''}
      `}
    >
      {/* Image */}
      <div className="relative">
        <ItemImage
          src={item.imageData}
          alt={item.name}
          className="w-full h-[200px]"
        />
        {item.isPurchased && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Purchased
          </div>
        )}
        {!item.url && (
          <div className="absolute top-2 left-2 bg-gray-700 text-white px-2 py-1 rounded-full text-xs font-medium">
            Manual
          </div>
        )}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 left-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
            aria-label="Open product page"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Name */}
        <h3 className="font-medium text-gray-900 line-clamp-2">{item.name}</h3>

        {/* Price */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(item.currentPrice, item.currency)}
          </span>
          {showConvertedPrice && (
            <span className="text-sm text-gray-600">
              ({formatPrice(item.priceInBaseCurrency!, baseCurrency!)})
            </span>
          )}
          {item.originalPrice && item.originalPrice > item.currentPrice && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(item.originalPrice, item.currency)}
            </span>
          )}
        </div>

        {/* Price change indicator */}
        {item.priceWhenAdded !== item.currentPrice && (
          <div className="text-xs">
            <span className="text-gray-500">
              Added: {formatPrice(item.priceWhenAdded, item.currency)}
            </span>
            <span
              className={`ml-2 font-medium ${
                priceChange < 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {priceChange < 0 ? '↓' : '↑'} {Math.abs(Number(priceChangePercent))}%
            </span>
          </div>
        )}

        {/* Priority */}
        <div className="flex items-center justify-between">
          <StarRating value={item.priority} readonly size="sm" />
        </div>

        {/* Notes preview */}
        {item.notes && (
          <p className="text-xs text-gray-500 line-clamp-1">{item.notes}</p>
        )}
      </div>
    </button>
  );
}
