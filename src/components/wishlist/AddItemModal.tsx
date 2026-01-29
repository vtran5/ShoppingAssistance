'use client';

import { useState, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StarRating } from '@/components/ui/StarRating';
import { CurrencySelect } from '@/components/ui/CurrencySelect';
import { ItemImage } from '@/components/ui/ItemImage';
import { CreateItemRequest, Priority, Currency } from '@/types';
import { resizeImage } from '@/lib/imageUtils';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: CreateItemRequest) => Promise<void>;
}

type TabMode = 'url' | 'manual';

export function AddItemModal({ isOpen, onClose, onSave }: AddItemModalProps) {
  const [mode, setMode] = useState<TabMode>('url');
  const [productUrl, setProductUrl] = useState('');
  const [name, setName] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [priority, setPriority] = useState<Priority>(3);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scraped, setScraped] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = useCallback(() => {
    setMode('url');
    setProductUrl('');
    setName('');
    setCurrentPrice('');
    setOriginalPrice('');
    setCurrency('USD');
    setImageData(null);
    setImageUrl('');
    setPriority(3);
    setNotes('');
    setScraped(false);
    setErrors({});
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleFetchDetails = useCallback(async () => {
    if (!productUrl.trim()) {
      setErrors({ productUrl: 'Please enter a URL' });
      return;
    }

    // Validate URL
    try {
      new URL(productUrl);
    } catch {
      setErrors({ productUrl: 'Please enter a valid URL' });
      return;
    }

    setScraping(true);
    setErrors({});

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.name) setName(data.name);
        if (data.currentPrice) setCurrentPrice(String(data.currentPrice));
        if (data.originalPrice) setOriginalPrice(String(data.originalPrice));
        if (data.currency) setCurrency(data.currency);
        if (data.imageUrl) {
          setImageData(data.imageUrl);
          setImageUrl(data.imageUrl);
        }
        setScraped(true);
      } else {
        setErrors({
          productUrl: data.error || 'Could not fetch product details. Please fill in manually.',
        });
      }
    } catch {
      setErrors({ productUrl: 'Failed to fetch product details. Please try again.' });
    } finally {
      setScraping(false);
    }
  }, [productUrl]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
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
    } else {
      setImageData(null);
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

      if (!validate()) return;

      setLoading(true);
      try {
        const item: CreateItemRequest = {
          name: name.trim(),
          url: mode === 'url' && productUrl.trim() ? productUrl.trim() : null,
          currentPrice: parseFloat(currentPrice),
          originalPrice: originalPrice ? parseFloat(originalPrice) : null,
          currency,
          imageData,
          priority,
          notes: notes.trim(),
        };

        await onSave(item);
        handleClose();
      } catch {
        setErrors({ submit: 'Failed to save item. Please try again.' });
      } finally {
        setLoading(false);
      }
    },
    [
      mode,
      productUrl,
      name,
      currentPrice,
      originalPrice,
      currency,
      imageData,
      priority,
      notes,
      validate,
      onSave,
      handleClose,
    ]
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Item">
      {/* Tab switcher */}
      <div className="flex mb-4 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === 'url'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          From URL
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === 'manual'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Manual Entry
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* URL input - only shown in URL mode */}
        {mode === 'url' && (
          <div className="space-y-2">
            <Input
              label="Product URL"
              type="url"
              value={productUrl}
              onChange={setProductUrl}
              placeholder="https://amazon.com/product..."
              error={errors.productUrl}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleFetchDetails}
              loading={scraping}
              disabled={!productUrl.trim()}
              className="w-full"
            >
              {scraping ? 'Fetching...' : 'Fetch Details'}
            </Button>
            {scraped && (
              <p className="text-sm text-green-600 text-center">
                Details fetched! Review and edit below if needed.
              </p>
            )}
          </div>
        )}

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

        {/* Error message */}
        {errors.submit && (
          <p className="text-sm text-red-500 text-center">{errors.submit}</p>
        )}

        {/* Submit button */}
        <Button type="submit" loading={loading} className="w-full">
          Save Item
        </Button>
      </form>
    </Modal>
  );
}
