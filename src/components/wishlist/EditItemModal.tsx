'use client';

import { useState, useCallback, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StarRating } from '@/components/ui/StarRating';
import { CurrencySelect } from '@/components/ui/CurrencySelect';
import { ItemImage } from '@/components/ui/ItemImage';
import { WishlistItem, UpdateItemRequest, Priority, Currency } from '@/types';
import { resizeImage } from '@/lib/imageUtils';

interface EditItemModalProps {
  item: WishlistItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: UpdateItemRequest) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function EditItemModal({
  item,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: EditItemModalProps) {
  const [name, setName] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [priority, setPriority] = useState<Priority>(3);
  const [notes, setNotes] = useState('');
  const [isPurchased, setIsPurchased] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with item data
  useEffect(() => {
    if (item) {
      setName(item.name);
      setCurrentPrice(item.currentPrice.toString());
      setOriginalPrice(item.originalPrice?.toString() || '');
      setCurrency(item.currency);
      setImageData(item.imageData);
      setImageUrl(item.imageData?.startsWith('data:') ? '' : item.imageData || '');
      setPriority(item.priority);
      setNotes(item.notes);
      setIsPurchased(item.isPurchased);
      setDeleteConfirm(false);
      setErrors({});
    }
  }, [item]);

  const handleClose = useCallback(() => {
    setDeleteConfirm(false);
    setErrors({});
    onClose();
  }, [onClose]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const clipboardItem of Array.from(items)) {
      if (clipboardItem.type.startsWith('image/')) {
        const file = clipboardItem.getAsFile();
        if (file) {
          try {
            const resizedBase64 = await resizeImage(file);
            setImageData(resizedBase64);
            setImageUrl('');
            setErrors((prev) => {
              const { image, ...rest } = prev;
              return rest;
            });
          } catch {
            setErrors((prev) => ({
              ...prev,
              image: 'Failed to process image. Please try again.',
            }));
          }
        }
        break;
      }
    }
  }, []);

  const handleImageUrlChange = useCallback((url: string) => {
    setImageUrl(url);
    if (url) {
      setImageData(url);
    }
  }, []);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!currentPrice || parseFloat(currentPrice) <= 0) {
      newErrors.currentPrice = 'Valid price is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, currentPrice]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!item || !validate()) return;

      setLoading(true);
      try {
        const updates: UpdateItemRequest = {
          name: name.trim(),
          currentPrice: parseFloat(currentPrice),
          originalPrice: originalPrice ? parseFloat(originalPrice) : null,
          currency,
          imageData,
          priority,
          notes: notes.trim(),
          isPurchased,
        };

        await onSave(item.id, updates);
        handleClose();
      } catch {
        setErrors({ submit: 'Failed to save changes. Please try again.' });
      } finally {
        setLoading(false);
      }
    },
    [
      item,
      name,
      currentPrice,
      originalPrice,
      currency,
      imageData,
      priority,
      notes,
      isPurchased,
      validate,
      onSave,
      handleClose,
    ]
  );

  const handleDelete = useCallback(async () => {
    if (!item) return;

    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setLoading(true);
    try {
      await onDelete(item.id);
      handleClose();
    } catch {
      setErrors({ submit: 'Failed to delete item. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, [item, deleteConfirm, onDelete, handleClose]);

  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Image preview and paste area */}
        <div
          onPaste={handlePaste}
          className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
        >
          {imageData ? (
            <div className="relative">
              <ItemImage
                src={imageData}
                alt="Preview"
                className="w-full h-32 rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  setImageData(null);
                  setImageUrl('');
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <div className="py-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 mx-auto text-gray-400 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm text-gray-500">
                Paste an image here or enter URL below
              </p>
            </div>
          )}
        </div>

        {/* Image URL input */}
        <Input
          label="Image URL (optional)"
          type="url"
          value={imageUrl}
          onChange={handleImageUrlChange}
          placeholder="https://example.com/image.jpg"
          error={errors.image}
        />

        {/* Product URL - clickable link */}
        {item.url && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Product URL
            </label>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 w-full px-3 py-2 min-h-[44px] rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 flex-shrink-0"
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
              <span className="truncate text-sm">{item.url}</span>
            </a>
          </div>
        )}

        {/* Name */}
        <Input
          label="Name"
          value={name}
          onChange={setName}
          placeholder="Product name"
          required
          error={errors.name}
        />

        {/* Price and Currency */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="Current Price"
              type="number"
              value={currentPrice}
              onChange={setCurrentPrice}
              placeholder="0.00"
              required
              min={0}
              step={0.01}
              error={errors.currentPrice}
            />
          </div>
          <div className="w-32">
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Currency
            </label>
            <CurrencySelect value={currency} onChange={setCurrency} />
          </div>
        </div>

        {/* Original Price */}
        <Input
          label="Original Price (optional)"
          type="number"
          value={originalPrice}
          onChange={setOriginalPrice}
          placeholder="0.00"
          min={0}
          step={0.01}
        />

        {/* Priority */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Priority
          </label>
          <StarRating value={priority} onChange={setPriority} size="lg" />
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        {/* Mark as Purchased */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isPurchased}
            onChange={(e) => setIsPurchased(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Mark as Purchased
          </span>
        </label>

        {/* Error message */}
        {errors.submit && (
          <p className="text-sm text-red-500 text-center">{errors.submit}</p>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant={deleteConfirm ? 'danger' : 'secondary'}
            onClick={handleDelete}
            disabled={loading}
            className="flex-1"
          >
            {deleteConfirm ? 'Confirm Delete?' : 'Delete'}
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
