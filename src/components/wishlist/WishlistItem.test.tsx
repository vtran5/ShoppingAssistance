import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WishlistItem } from './WishlistItem';
import { WishlistItem as WishlistItemType } from '@/types';

const mockItem: WishlistItemType = {
  id: '1',
  name: 'Test Product',
  currentPrice: 99.99,
  priceWhenAdded: 120,
  currency: 'USD',
  priority: 4,
  isPurchased: false,
  dateAdded: '2024-01-01',
  url: 'https://example.com/product',
  imageData: null,
  notes: 'This is a test note',
  originalPrice: 150,
  priceInBaseCurrency: null,
};

describe('WishlistItem', () => {
  describe('view size: large (default)', () => {
    it('renders item name', () => {
      render(<WishlistItem item={mockItem} onClick={vi.fn()} />);
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('renders current price', () => {
      render(<WishlistItem item={mockItem} onClick={vi.fn()} />);
      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });

    it('renders original price with strikethrough when on sale', () => {
      render(<WishlistItem item={mockItem} onClick={vi.fn()} />);
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    it('renders price change indicator', () => {
      render(<WishlistItem item={mockItem} onClick={vi.fn()} />);
      // Price change indicator shows "Added: $120.00" in one span
      expect(screen.getByText(/Added:.*\$120\.00/)).toBeInTheDocument();
    });

    it('renders notes preview', () => {
      render(<WishlistItem item={mockItem} onClick={vi.fn()} />);
      expect(screen.getByText('This is a test note')).toBeInTheDocument();
    });

    it('renders link button when URL is present', () => {
      render(<WishlistItem item={mockItem} onClick={vi.fn()} />);
      const link = screen.getByRole('link', { name: /open product page/i });
      expect(link).toHaveAttribute('href', 'https://example.com/product');
    });

    it('renders Manual badge when no URL', () => {
      const itemWithoutUrl = { ...mockItem, url: null };
      render(<WishlistItem item={itemWithoutUrl} onClick={vi.fn()} />);
      expect(screen.getByText('Manual')).toBeInTheDocument();
    });

    it('applies purchased visual treatment when purchased', () => {
      const purchasedItem = { ...mockItem, isPurchased: true };
      const { container } = render(<WishlistItem item={purchasedItem} onClick={vi.fn()} />);
      // Green left border on card
      const card = container.querySelector('button');
      expect(card?.className).toContain('border-l-green-500');
      // Grayscale on image wrapper
      expect(container.querySelector('.grayscale')).toBeInTheDocument();
    });

    it('applies 200px image height', () => {
      const { container } = render(
        <WishlistItem item={mockItem} onClick={vi.fn()} />
      );
      expect(container.querySelector('.h-\\[200px\\]')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
      const onClick = vi.fn();
      const { container } = render(<WishlistItem item={mockItem} onClick={onClick} />);

      // Get the main card button (first button, which is the card wrapper)
      const cardButton = container.querySelector('button');
      fireEvent.click(cardButton!);
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('view size: medium', () => {
    it('applies 120px image height', () => {
      const { container } = render(
        <WishlistItem item={mockItem} onClick={vi.fn()} viewSize="medium" />
      );
      expect(container.querySelector('.h-\\[120px\\]')).toBeInTheDocument();
    });

    it('hides notes preview', () => {
      render(
        <WishlistItem item={mockItem} onClick={vi.fn()} viewSize="medium" />
      );
      expect(screen.queryByText('This is a test note')).not.toBeInTheDocument();
    });

    it('hides price change indicator', () => {
      render(
        <WishlistItem item={mockItem} onClick={vi.fn()} viewSize="medium" />
      );
      expect(screen.queryByText(/Added:/)).not.toBeInTheDocument();
    });

    it('hides original price strikethrough', () => {
      render(
        <WishlistItem item={mockItem} onClick={vi.fn()} viewSize="medium" />
      );
      expect(screen.queryByText('$150.00')).not.toBeInTheDocument();
    });

    it('applies purchased visual treatment when purchased', () => {
      const purchasedItem = { ...mockItem, isPurchased: true };
      const { container } = render(
        <WishlistItem item={purchasedItem} onClick={vi.fn()} viewSize="medium" />
      );
      const card = container.querySelector('button');
      expect(card?.className).toContain('border-l-green-500');
      expect(container.querySelector('.grayscale')).toBeInTheDocument();
    });
  });

  describe('view size: small', () => {
    it('applies 80px image height', () => {
      const { container } = render(
        <WishlistItem item={mockItem} onClick={vi.fn()} viewSize="small" />
      );
      expect(container.querySelector('.h-\\[80px\\]')).toBeInTheDocument();
    });

    it('hides notes preview', () => {
      render(
        <WishlistItem item={mockItem} onClick={vi.fn()} viewSize="small" />
      );
      expect(screen.queryByText('This is a test note')).not.toBeInTheDocument();
    });

    it('hides price change indicator', () => {
      render(
        <WishlistItem item={mockItem} onClick={vi.fn()} viewSize="small" />
      );
      expect(screen.queryByText(/Added:/)).not.toBeInTheDocument();
    });

    it('hides Manual badge', () => {
      const itemWithoutUrl = { ...mockItem, url: null };
      render(
        <WishlistItem item={itemWithoutUrl} onClick={vi.fn()} viewSize="small" />
      );
      expect(screen.queryByText('Manual')).not.toBeInTheDocument();
    });

    it('applies purchased visual treatment when purchased', () => {
      const purchasedItem = { ...mockItem, isPurchased: true };
      const { container } = render(
        <WishlistItem item={purchasedItem} onClick={vi.fn()} viewSize="small" />
      );
      // No "Purchased" text badge
      expect(screen.queryByText('Purchased')).not.toBeInTheDocument();
      // Green left border and grayscale image
      const card = container.querySelector('button');
      expect(card?.className).toContain('border-l-green-500');
      expect(container.querySelector('.grayscale')).toBeInTheDocument();
    });
  });

  describe('view size: list', () => {
    it('renders with horizontal flex layout', () => {
      const { container } = render(
        <WishlistItem item={mockItem} onClick={vi.fn()} viewSize="list" />
      );
      // Check for flex-row class on the button
      const button = container.querySelector('button');
      expect(button?.className).toContain('flex');
      expect(button?.className).toContain('flex-row');
    });

    it('applies 80x80 fixed image size', () => {
      const { container } = render(
        <WishlistItem item={mockItem} onClick={vi.fn()} viewSize="list" />
      );
      expect(container.querySelector('.w-\\[80px\\]')).toBeInTheDocument();
      expect(container.querySelector('.h-\\[80px\\]')).toBeInTheDocument();
    });

    it('renders item name', () => {
      render(<WishlistItem item={mockItem} onClick={vi.fn()} viewSize="list" />);
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('renders current price', () => {
      render(<WishlistItem item={mockItem} onClick={vi.fn()} viewSize="list" />);
      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });

    it('renders star rating', () => {
      const { container } = render(
        <WishlistItem item={mockItem} onClick={vi.fn()} viewSize="list" />
      );
      // StarRating component should be present
      expect(container.querySelector('[data-testid="star-rating"]') || container.querySelectorAll('svg').length > 0).toBeTruthy();
    });

    it('hides notes preview', () => {
      render(
        <WishlistItem item={mockItem} onClick={vi.fn()} viewSize="list" />
      );
      expect(screen.queryByText('This is a test note')).not.toBeInTheDocument();
    });

    it('hides price change indicator', () => {
      render(
        <WishlistItem item={mockItem} onClick={vi.fn()} viewSize="list" />
      );
      expect(screen.queryByText(/Added:/)).not.toBeInTheDocument();
    });

    it('hides original price strikethrough', () => {
      render(
        <WishlistItem item={mockItem} onClick={vi.fn()} viewSize="list" />
      );
      expect(screen.queryByText('$150.00')).not.toBeInTheDocument();
    });

    it('hides Manual badge', () => {
      const itemWithoutUrl = { ...mockItem, url: null };
      render(
        <WishlistItem item={itemWithoutUrl} onClick={vi.fn()} viewSize="list" />
      );
      expect(screen.queryByText('Manual')).not.toBeInTheDocument();
    });

    it('applies purchased visual treatment when purchased', () => {
      const purchasedItem = { ...mockItem, isPurchased: true };
      const { container } = render(
        <WishlistItem item={purchasedItem} onClick={vi.fn()} viewSize="list" />
      );
      // No "Purchased" text badge
      expect(screen.queryByText('Purchased')).not.toBeInTheDocument();
      // Green left border and grayscale image
      const card = container.querySelector('button');
      expect(card?.className).toContain('border-l-green-500');
      expect(container.querySelector('.grayscale')).toBeInTheDocument();
    });

    it('renders link button when URL is present', () => {
      render(<WishlistItem item={mockItem} onClick={vi.fn()} viewSize="list" />);
      const link = screen.getByRole('link', { name: /open product page/i });
      expect(link).toHaveAttribute('href', 'https://example.com/product');
    });

    it('calls onClick when clicked', () => {
      const onClick = vi.fn();
      const { container } = render(<WishlistItem item={mockItem} onClick={onClick} viewSize="list" />);

      const cardButton = container.querySelector('button');
      fireEvent.click(cardButton!);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('hides converted price', () => {
      const itemWithConversion = {
        ...mockItem,
        currency: 'EUR',
        priceInBaseCurrency: 110,
      };
      render(
        <WishlistItem
          item={itemWithConversion}
          onClick={vi.fn()}
          baseCurrency="USD"
          viewSize="list"
        />
      );
      expect(screen.queryByText('($110.00)')).not.toBeInTheDocument();
    });
  });

  describe('converted price', () => {
    it('shows converted price in large view when currencies differ', () => {
      const itemWithConversion: WishlistItemType = {
        ...mockItem,
        currency: 'EUR',
        priceInBaseCurrency: 110,
      };
      render(
        <WishlistItem
          item={itemWithConversion}
          onClick={vi.fn()}
          baseCurrency="USD"
          viewSize="large"
        />
      );
      expect(screen.getByText('($110.00)')).toBeInTheDocument();
    });

    it('hides converted price in medium view', () => {
      const itemWithConversion: WishlistItemType = {
        ...mockItem,
        currency: 'EUR',
        priceInBaseCurrency: 110,
      };
      render(
        <WishlistItem
          item={itemWithConversion}
          onClick={vi.fn()}
          baseCurrency="USD"
          viewSize="medium"
        />
      );
      expect(screen.queryByText('($110.00)')).not.toBeInTheDocument();
    });

    it('hides converted price in small view', () => {
      const itemWithConversion: WishlistItemType = {
        ...mockItem,
        currency: 'EUR',
        priceInBaseCurrency: 110,
      };
      render(
        <WishlistItem
          item={itemWithConversion}
          onClick={vi.fn()}
          baseCurrency="USD"
          viewSize="small"
        />
      );
      expect(screen.queryByText('($110.00)')).not.toBeInTheDocument();
    });
  });
});
