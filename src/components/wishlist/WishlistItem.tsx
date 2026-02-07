'use client';

import { WishlistItem as WishlistItemType, Currency, ItemViewSize } from '@/types';
import { ItemImage } from '@/components/ui/ItemImage';
import { StarRating } from '@/components/ui/StarRating';
import { formatPrice } from '@/lib/currency';

interface WishlistItemProps {
  item: WishlistItemType;
  onClick: () => void;
  baseCurrency?: Currency;
  viewSize?: ItemViewSize;
}

// Format relative time (e.g., "2h ago", "3d ago")
function formatTimeAgo(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    return 'just now';
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }
}

// Price change indicator component (compared to priceWhenAdded)
function PriceChangeFromOriginal({
  currentPrice,
  priceWhenAdded,
}: {
  currentPrice: number;
  priceWhenAdded: number;
}) {
  if (priceWhenAdded === 0) return null;

  const changeFromOriginal = currentPrice - priceWhenAdded;
  const percentFromOriginal = (changeFromOriginal / priceWhenAdded) * 100;

  // Only show if change is >= 1%
  if (Math.abs(percentFromOriginal) < 1) {
    return null;
  }

  const isDropped = changeFromOriginal < 0;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isDropped ? 'text-green-600' : 'text-red-600'
      }`}
    >
      {isDropped ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      )}
      {Math.abs(percentFromOriginal).toFixed(0)}%
    </span>
  );
}

export function WishlistItem({ item, onClick, baseCurrency, viewSize = 'large' }: WishlistItemProps) {
  const priceChange = item.currentPrice - item.priceWhenAdded;
  const priceChangePercent = item.priceWhenAdded
    ? ((priceChange / item.priceWhenAdded) * 100).toFixed(0)
    : 0;

  // Show converted price if item currency differs from base currency (only in large view)
  const showConvertedPrice =
    viewSize === 'large' &&
    baseCurrency && item.currency !== baseCurrency && item.priceInBaseCurrency !== null;

  // Size-specific styles
  const imageHeight = {
    large: 'h-[200px]',
    medium: 'h-[120px]',
    small: 'h-[80px]',
    list: 'h-[80px]',
  }[viewSize];

  const contentPadding = {
    large: 'p-3 space-y-2',
    medium: 'p-2 space-y-1',
    small: 'p-1.5 space-y-1',
    list: 'px-3 py-2 flex flex-col justify-center',
  }[viewSize];

  const nameClasses = {
    large: 'font-medium text-gray-900 line-clamp-2',
    medium: 'font-medium text-gray-900 text-sm line-clamp-1',
    small: 'font-medium text-gray-900 text-xs line-clamp-1',
    list: 'font-medium text-gray-900 text-sm line-clamp-1',
  }[viewSize];

  const priceClasses = {
    large: 'text-lg font-bold text-gray-900',
    medium: 'text-sm font-bold text-gray-900',
    small: 'text-xs font-bold text-gray-900',
    list: 'text-sm font-bold text-gray-900',
  }[viewSize];

  const linkButtonClasses = {
    large: 'top-2 left-2 p-2',
    medium: 'top-1 left-1 p-1.5',
    small: 'top-1 left-1 p-1',
    list: 'top-1 left-1 p-1',
  }[viewSize];

  const linkIconClasses = {
    large: 'h-4 w-4',
    medium: 'h-3 w-3',
    small: 'h-3 w-3',
    list: 'h-3 w-3',
  }[viewSize];

  const starSize = {
    large: 'sm' as const,
    medium: 'xs' as const,
    small: 'xs' as const,
    list: 'xs' as const,
  }[viewSize];

  const purchasedBadgeClasses = {
    large: 'top-2 right-2 px-2 py-1 text-xs',
    medium: 'top-1 right-1 px-1.5 py-0.5 text-[10px]',
    small: 'top-1 right-1 p-1',
    list: 'top-1 right-1 p-1',
  }[viewSize];

  // List view uses horizontal layout
  const isListView = viewSize === 'list';

  const CheckIcon = () => (
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
  );

  // List view renders horizontal layout
  if (isListView) {
    return (
      <button
        onClick={onClick}
        className={`
          w-full text-left bg-white rounded-xl shadow-sm border border-gray-200
          overflow-hidden transition-all hover:shadow-md hover:border-gray-300
          focus:outline-none focus:ring-2 focus:ring-blue-500
          flex flex-row
          ${item.isPurchased ? 'opacity-60' : ''}
        `}
      >
        {/* Image - fixed 80x80 */}
        <div className="relative w-[80px] h-[80px] flex-shrink-0">
          <ItemImage
            src={item.imageData}
            alt={item.name}
            className="w-[80px] h-[80px]"
          />
          {item.isPurchased && (
            <div className={`absolute ${purchasedBadgeClasses} bg-green-500 text-white rounded-full font-medium flex items-center gap-1`}>
              <CheckIcon />
            </div>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`absolute ${linkButtonClasses} bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors`}
              aria-label="Open product page"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={linkIconClasses}
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

        {/* Content - flex-1 to fill remaining space */}
        <div className={`flex-1 ${contentPadding}`}>
          <h3 className={nameClasses}>{item.name}</h3>
          <span className={priceClasses}>
            {formatPrice(item.currentPrice, item.currency)}
          </span>
          <StarRating value={item.priority} readonly size={starSize} />
        </div>
      </button>
    );
  }

  // Default grid layout for large/medium/small views
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
          className={`w-full ${imageHeight}`}
        />
        {item.isPurchased && (
          <div className={`absolute ${purchasedBadgeClasses} bg-green-500 text-white rounded-full font-medium flex items-center gap-1`}>
            <CheckIcon />
            {viewSize !== 'small' && 'Purchased'}
          </div>
        )}
        {!item.url && viewSize === 'large' && (
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
            className={`absolute ${linkButtonClasses} bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors`}
            aria-label="Open product page"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={linkIconClasses}
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
      <div className={contentPadding}>
        {/* Name */}
        <h3 className={nameClasses}>{item.name}</h3>

        {/* Price */}
        <div className={`flex items-baseline ${viewSize === 'small' ? 'gap-1' : 'gap-2'} flex-wrap`}>
          <span className={priceClasses}>
            {formatPrice(item.currentPrice, item.currency)}
          </span>
          {showConvertedPrice && (
            <span className="text-sm text-gray-600">
              ({formatPrice(item.priceInBaseCurrency!, baseCurrency!)})
            </span>
          )}
          {viewSize === 'large' && item.originalPrice && item.originalPrice > item.currentPrice && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(item.originalPrice, item.currency)}
            </span>
          )}
        </div>

        {/* Price change indicator - only in large view */}
        {viewSize === 'large' && item.priceWhenAdded !== item.currentPrice && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">
              Added: {formatPrice(item.priceWhenAdded, item.currency)}
            </span>
            <PriceChangeFromOriginal
              currentPrice={item.currentPrice}
              priceWhenAdded={item.priceWhenAdded}
            />
          </div>
        )}

        {/* Last checked indicator - only in large view for URL-based items */}
        {viewSize === 'large' && item.url && item.lastChecked && (
          <div className="text-xs text-gray-400">
            Checked {formatTimeAgo(item.lastChecked)}
          </div>
        )}

        {/* Priority */}
        <div className="flex items-center justify-between">
          <StarRating value={item.priority} readonly size={starSize} />
        </div>

        {/* Notes preview - only in large view */}
        {viewSize === 'large' && item.notes && (
          <p className="text-xs text-gray-500 line-clamp-1">{item.notes}</p>
        )}
      </div>
    </button>
  );
}
