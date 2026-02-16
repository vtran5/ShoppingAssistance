'use client';

import { WishlistItem as WishlistItemType, Currency, ItemViewSize } from '@/types';
import { ItemImage } from '@/components/ui/ItemImage';
import { StarRating } from '@/components/ui/StarRating';
import { formatPrice } from '@/lib/currency';

interface WishlistItemProps {
  item: WishlistItemType;
  onClick: () => void;
  onTogglePurchased?: (id: string, isPurchased: boolean) => void;
  baseCurrency?: Currency;
  viewSize?: ItemViewSize;
}

export function WishlistItem({ item, onClick, onTogglePurchased, baseCurrency, viewSize = 'large' }: WishlistItemProps) {
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

  const toggleIconSize = {
    large: 'h-6 w-6',
    medium: 'h-5 w-5',
    small: 'h-[18px] w-[18px]',
    list: 'h-5 w-5',
  }[viewSize];

  // Purchased visual treatment classes
  const purchased = item.isPurchased;
  const showStrikethrough = purchased && viewSize !== 'small';
  const cardBorderClass = purchased ? 'border-l-4 border-l-green-500' : '';

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePurchased?.(item.id, !item.isPurchased);
  };

  const PurchaseToggle = () => (
    <button
      onClick={handleToggle}
      className="min-h-[44px] min-w-[44px] flex items-center justify-center -m-2 transition-colors"
      aria-label={item.isPurchased ? 'Unmark as purchased' : 'Mark as purchased'}
    >
      {item.isPurchased ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`${toggleIconSize} text-green-500`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <circle cx="12" cy="12" r="11" />
          <path
            d="M7.5 12.5l3 3 6-6"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`${toggleIconSize} text-gray-400 hover:text-gray-500`}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2" />
        </svg>
      )}
    </button>
  );

  const LinkButton = () => {
    if (!item.url) return null;
    return (
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
    );
  };

  // List view renders horizontal layout
  if (viewSize === 'list') {
    return (
      <button
        onClick={onClick}
        className={`
          w-full text-left bg-white rounded-xl shadow-sm border border-gray-200
          overflow-hidden transition-all hover:shadow-md hover:border-gray-300
          focus:outline-none focus:ring-2 focus:ring-blue-500
          flex flex-row
          ${cardBorderClass}
        `}
      >
        {/* Image - fixed 80x80 */}
        <div className={`relative w-[80px] h-[80px] flex-shrink-0 ${purchased ? 'grayscale' : ''}`}>
          <ItemImage
            src={item.imageData}
            alt={item.name}
            className="w-[80px] h-[80px]"
          />
          <LinkButton />
        </div>

        {/* Content */}
        <div className={`flex-1 ${contentPadding} ${purchased ? 'opacity-60' : ''}`}>
          <h3 className={`${nameClasses} ${showStrikethrough ? 'line-through text-gray-500' : ''}`}>
            {item.name}
          </h3>
          <span className={priceClasses}>
            {formatPrice(item.currentPrice, item.currency)}
          </span>
          <StarRating value={item.priority} readonly size={starSize} />
        </div>

        {/* Toggle button - right end */}
        {onTogglePurchased && (
          <div className="flex items-center pr-2 flex-shrink-0">
            <PurchaseToggle />
          </div>
        )}
      </button>
    );
  }

  // Small view: toggle overlays on image
  if (viewSize === 'small') {
    return (
      <button
        onClick={onClick}
        className={`
          w-full text-left bg-white rounded-xl shadow-sm border border-gray-200
          overflow-hidden transition-all hover:shadow-md hover:border-gray-300
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${cardBorderClass}
        `}
      >
        {/* Image */}
        <div className={`relative ${purchased ? 'grayscale' : ''}`}>
          <ItemImage
            src={item.imageData}
            alt={item.name}
            className={`w-full ${imageHeight}`}
          />
          <LinkButton />
          {/* Toggle overlaid on image bottom-right for small view */}
          {onTogglePurchased && (
            <div className="absolute bottom-1 right-1">
              <PurchaseToggle />
            </div>
          )}
        </div>

        {/* Content */}
        <div className={contentPadding}>
          <h3 className={nameClasses}>{item.name}</h3>
          <div className={`flex items-baseline gap-1 flex-wrap`}>
            <span className={priceClasses}>
              {formatPrice(item.currentPrice, item.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <StarRating value={item.priority} readonly size={starSize} />
          </div>
        </div>
      </button>
    );
  }

  // Default grid layout for large/medium views
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left bg-white rounded-xl shadow-sm border border-gray-200
        overflow-hidden transition-all hover:shadow-md hover:border-gray-300
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${cardBorderClass}
      `}
    >
      {/* Image */}
      <div className={`relative ${purchased ? 'grayscale' : ''}`}>
        <ItemImage
          src={item.imageData}
          alt={item.name}
          className={`w-full ${imageHeight}`}
        />
        {!item.url && viewSize === 'large' && (
          <div className="absolute top-2 left-2 bg-gray-700 text-white px-2 py-1 rounded-full text-xs font-medium">
            Manual
          </div>
        )}
        <LinkButton />
      </div>

      {/* Content */}
      <div className={`${contentPadding} ${purchased ? 'opacity-60' : ''}`}>
        {/* Name */}
        <h3 className={`${nameClasses} ${showStrikethrough ? 'line-through text-gray-500' : ''}`}>
          {item.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2 flex-wrap">
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

        {/* Priority + Toggle */}
        <div className="flex items-center justify-between">
          <StarRating value={item.priority} readonly size={starSize} />
          {onTogglePurchased && <PurchaseToggle />}
        </div>

        {/* Notes preview - only in large view */}
        {viewSize === 'large' && item.notes && (
          <p className="text-xs text-gray-500 line-clamp-1">{item.notes}</p>
        )}
      </div>
    </button>
  );
}
