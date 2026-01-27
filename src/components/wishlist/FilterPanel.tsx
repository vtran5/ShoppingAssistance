'use client';

import { useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FilterOptions, Priority } from '@/types';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
}

const PRIORITIES: Priority[] = [5, 4, 3, 2, 1];

export function FilterPanel({
  isOpen,
  onClose,
  filters,
  onChange,
}: FilterPanelProps) {
  const handlePriorityToggle = useCallback(
    (priority: Priority) => {
      const newPriorities = filters.priorities.includes(priority)
        ? filters.priorities.filter((p) => p !== priority)
        : [...filters.priorities, priority];

      onChange({ ...filters, priorities: newPriorities });
    },
    [filters, onChange]
  );

  const handleMinPriceChange = useCallback(
    (value: string) => {
      const minPrice = value ? parseFloat(value) : null;
      onChange({ ...filters, minPrice });
    },
    [filters, onChange]
  );

  const handleMaxPriceChange = useCallback(
    (value: string) => {
      const maxPrice = value ? parseFloat(value) : null;
      onChange({ ...filters, maxPrice });
    },
    [filters, onChange]
  );

  const handleStatusChange = useCallback(
    (status: FilterOptions['status']) => {
      onChange({ ...filters, status });
    },
    [filters, onChange]
  );

  const handleReset = useCallback(() => {
    onChange({
      priorities: [1, 2, 3, 4, 5],
      minPrice: null,
      maxPrice: null,
      status: 'all',
    });
  }, [onChange]);

  const renderStars = (count: number) => {
    return (
      <span className="text-yellow-400">
        {'★'.repeat(count)}
        <span className="text-gray-300">{'★'.repeat(5 - count)}</span>
      </span>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filter Items">
      <div className="space-y-6">
        {/* Priority filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Priority</h3>
          <div className="space-y-2">
            {PRIORITIES.map((priority) => (
              <label
                key={priority}
                className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={filters.priorities.includes(priority)}
                  onChange={() => handlePriorityToggle(priority)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="flex-1">{renderStars(priority)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price range filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Price Range
          </h3>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={filters.minPrice ?? ''}
              onChange={handleMinPriceChange}
              placeholder="Min"
              min={0}
              step={0.01}
              className="flex-1"
            />
            <span className="text-gray-400">—</span>
            <Input
              type="number"
              value={filters.maxPrice ?? ''}
              onChange={handleMaxPriceChange}
              placeholder="Max"
              min={0}
              step={0.01}
              className="flex-1"
            />
          </div>
        </div>

        {/* Status filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Status</h3>
          <div className="flex gap-2">
            {(['all', 'active', 'purchased'] as const).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`
                  flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    filters.status === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={handleReset}
            className="flex-1"
          >
            Reset
          </Button>
          <Button onClick={onClose} className="flex-1">
            Apply
          </Button>
        </div>
      </div>
    </Modal>
  );
}
