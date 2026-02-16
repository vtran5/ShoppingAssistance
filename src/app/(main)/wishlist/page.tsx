'use client';

import { useState, useEffect, useCallback } from 'react';
import { WishlistGrid } from '@/components/wishlist/WishlistGrid';
import { AddItemModal } from '@/components/wishlist/AddItemModal';
import { EditItemModal } from '@/components/wishlist/EditItemModal';
import { SortDropdown } from '@/components/wishlist/SortDropdown';
import { ViewSizeDropdown } from '@/components/wishlist/ViewSizeDropdown';
import { FilterPanel } from '@/components/wishlist/FilterPanel';
import { Button } from '@/components/ui/Button';
import {
  WishlistItem,
  CreateItemRequest,
  UpdateItemRequest,
  SortOption,
  FilterOptions,
  Currency,
  ItemViewSize,
} from '@/types';

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseCurrency, setBaseCurrency] = useState<Currency>('USD');
  const [itemViewSize, setItemViewSize] = useState<ItemViewSize>('large');

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<WishlistItem | null>(null);

  // Sort and filter states
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [filters, setFilters] = useState<FilterOptions>({
    priorities: [1, 2, 3, 4, 5],
    minPrice: null,
    maxPrice: null,
    status: 'all',
  });
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Fetch items and settings
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch items and settings in parallel
      const [itemsResponse, settingsResponse] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/settings'),
      ]);

      if (!itemsResponse.ok) {
        throw new Error('Failed to fetch items');
      }

      const itemsData = await itemsResponse.json();
      setItems(itemsData.items);

      // Settings fetch is optional - don't fail if it errors
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        if (settingsData.baseCurrency) {
          setBaseCurrency(settingsData.baseCurrency);
        }
        if (settingsData.itemViewSize) {
          setItemViewSize(settingsData.itemViewSize);
        }
      }
    } catch (err) {
      setError('Failed to load items. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Add item
  const handleAddItem = useCallback(async (item: CreateItemRequest) => {
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      throw new Error('Failed to add item');
    }

    const data = await response.json();
    setItems((prev) => [data.item, ...prev]);
  }, []);

  // Update item
  const handleUpdateItem = useCallback(
    async (id: string, updates: UpdateItemRequest) => {
      const response = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      const data = await response.json();
      setItems((prev) =>
        prev.map((item) => (item.id === id ? data.item : item))
      );
    },
    []
  );

  // Toggle purchased status (optimistic update)
  const handleTogglePurchased = useCallback(
    async (id: string, isPurchased: boolean) => {
      // Optimistic update
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isPurchased } : item
        )
      );

      try {
        const response = await fetch(`/api/items/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPurchased }),
        });

        if (!response.ok) {
          throw new Error('Failed to update item');
        }

        const data = await response.json();
        setItems((prev) =>
          prev.map((item) => (item.id === id ? data.item : item))
        );
      } catch {
        // Rollback on failure
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isPurchased: !isPurchased } : item
          )
        );
        console.error('Failed to toggle purchased status');
      }
    },
    []
  );

  // Delete item
  const handleDeleteItem = useCallback(async (id: string) => {
    const response = await fetch(`/api/items/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete item');
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Change view size
  const handleViewSizeChange = useCallback(async (size: ItemViewSize) => {
    setItemViewSize(size);

    // Save to settings (fire and forget - don't block UI)
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemViewSize: size }),
    }).catch((err) => {
      console.error('Failed to save view size preference:', err);
    });
  }, []);

  // Helper to get price for sorting/filtering (uses converted price if available)
  const getComparablePrice = useCallback((item: WishlistItem): number => {
    // Use priceInBaseCurrency if available, otherwise fall back to currentPrice
    return item.priceInBaseCurrency ?? item.currentPrice;
  }, []);

  // Sort items
  const sortedItems = useCallback(() => {
    const sorted = [...items];

    switch (sortBy) {
      case 'priority':
        sorted.sort((a, b) => b.priority - a.priority);
        break;
      case 'price-low':
        sorted.sort((a, b) => getComparablePrice(a) - getComparablePrice(b));
        break;
      case 'price-high':
        sorted.sort((a, b) => getComparablePrice(b) - getComparablePrice(a));
        break;
      case 'date-added':
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return sorted;
  }, [items, sortBy, getComparablePrice]);

  // Filter items
  const filteredItems = useCallback(() => {
    return sortedItems().filter((item) => {
      // Filter by priority
      if (!filters.priorities.includes(item.priority)) {
        return false;
      }

      // Filter by price range (using converted price for consistent comparison)
      const price = getComparablePrice(item);
      if (filters.minPrice !== null && price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== null && price > filters.maxPrice) {
        return false;
      }

      // Filter by status
      if (filters.status === 'active' && item.isPurchased) {
        return false;
      }
      if (filters.status === 'purchased' && !item.isPurchased) {
        return false;
      }

      return true;
    });
  }, [sortedItems, filters, getComparablePrice]);

  // Calculate active filter count
  const activeFilterCount = useCallback(() => {
    let count = 0;
    if (filters.priorities.length < 5) count++;
    if (filters.minPrice !== null) count++;
    if (filters.maxPrice !== null) count++;
    if (filters.status !== 'all') count++;
    return count;
  }, [filters]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-500">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchItems}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      {/* Sort and Filter controls */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <SortDropdown value={sortBy} onChange={setSortBy} />
        <div className="flex items-center gap-2">
          <ViewSizeDropdown value={itemViewSize} onChange={handleViewSizeChange} />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFilterPanelOpen(true)}
            className="relative"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filter
            {activeFilterCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount()}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Items grid */}
      <WishlistGrid
        items={filteredItems()}
        onItemClick={(item) => setEditItem(item)}
        onTogglePurchased={handleTogglePurchased}
        baseCurrency={baseCurrency}
        viewSize={itemViewSize}
      />

      {/* Add button (FAB) */}
      <button
        onClick={() => setAddModalOpen(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Add item"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Modals */}
      <AddItemModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={handleAddItem}
      />

      <EditItemModal
        item={editItem}
        isOpen={editItem !== null}
        onClose={() => setEditItem(null)}
        onSave={handleUpdateItem}
        onDelete={handleDeleteItem}
      />

      <FilterPanel
        isOpen={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        filters={filters}
        onChange={setFilters}
      />
    </div>
  );
}
