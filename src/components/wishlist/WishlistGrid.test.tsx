import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WishlistGrid } from './WishlistGrid';
import { WishlistItem } from '@/types';

const mockItem: WishlistItem = {
  id: '1',
  name: 'Test Item',
  currentPrice: 100,
  priceWhenAdded: 100,
  currency: 'USD',
  priority: 3,
  isPurchased: false,
  dateAdded: '2024-01-01',
  url: null,
  imageData: null,
  notes: null,
  originalPrice: null,
  priceInBaseCurrency: null,
};

describe('WishlistGrid', () => {
  it('renders empty state when no items', () => {
    render(<WishlistGrid items={[]} onItemClick={vi.fn()} />);

    expect(screen.getByText('No items yet')).toBeInTheDocument();
    expect(
      screen.getByText('Tap the + button to add your first wishlist item')
    ).toBeInTheDocument();
  });

  it('renders items when provided', () => {
    const items = [mockItem, { ...mockItem, id: '2', name: 'Second Item' }];
    render(<WishlistGrid items={items} onItemClick={vi.fn()} />);

    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText('Second Item')).toBeInTheDocument();
  });

  it('applies large grid classes by default', () => {
    const items = [mockItem];
    const { container } = render(
      <WishlistGrid items={items} onItemClick={vi.fn()} />
    );

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('sm:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
    expect(grid).toHaveClass('gap-4');
  });

  it('applies medium grid classes when viewSize is medium', () => {
    const items = [mockItem];
    const { container } = render(
      <WishlistGrid items={items} onItemClick={vi.fn()} viewSize="medium" />
    );

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-2');
    expect(grid).toHaveClass('sm:grid-cols-3');
    expect(grid).toHaveClass('lg:grid-cols-4');
    expect(grid).toHaveClass('gap-3');
  });

  it('applies small grid classes when viewSize is small', () => {
    const items = [mockItem];
    const { container } = render(
      <WishlistGrid items={items} onItemClick={vi.fn()} viewSize="small" />
    );

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-4');
    expect(grid).toHaveClass('sm:grid-cols-5');
    expect(grid).toHaveClass('lg:grid-cols-6');
    expect(grid).toHaveClass('gap-2');
  });

  it('passes viewSize to WishlistItem components', () => {
    const items = [mockItem];
    const { container } = render(
      <WishlistGrid items={items} onItemClick={vi.fn()} viewSize="small" />
    );

    // In small view, image should have h-[80px] class
    const image = container.querySelector('.h-\\[80px\\]');
    expect(image).toBeInTheDocument();
  });
});
