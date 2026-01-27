'use client';

import { Priority } from '@/types';

interface StarRatingProps {
  value: Priority;
  onChange?: (value: Priority) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const containerClasses = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1.5',
  };

  const handleClick = (rating: Priority) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className={`flex ${containerClasses[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star as Priority)}
          disabled={readonly}
          className={`
            ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
            transition-transform focus:outline-none
            ${!readonly ? 'min-h-[44px] min-w-[44px] flex items-center justify-center -m-2' : ''}
          `}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={`${sizeClasses[size]} ${
              star <= value ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'
            }`}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}
