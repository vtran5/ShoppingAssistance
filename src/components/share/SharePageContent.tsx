'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StarRating } from '@/components/ui/StarRating';
import { CurrencySelect } from '@/components/ui/CurrencySelect';
import { ItemImage } from '@/components/ui/ItemImage';
import { CreateItemRequest, Priority, Currency } from '@/types';
import {
  extractUrlFromShareParams,
  extractTitleFromShareParams,
} from '@/lib/urlUtils';

type ShareState =
  | 'extracting'
  | 'scraping'
  | 'editing'
  | 'saving'
  | 'success';

export function SharePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [state, setState] = useState<ShareState>('extracting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [productUrl, setProductUrl] = useState<string | null>(null);
  const [sharedTitle, setSharedTitle] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [priority, setPriority] = useState<Priority>(3);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1: Extract URL from search params on mount
  useEffect(() => {
    const urlParam = searchParams.get('url');
    const textParam = searchParams.get('text');
    const titleParam = searchParams.get('title');

    const extractedUrl = extractUrlFromShareParams({
      url: urlParam,
      text: textParam,
      title: titleParam,
    });

    const extractedTitle = extractTitleFromShareParams({
      url: urlParam,
      text: textParam,
      title: titleParam,
    });

    if (extractedUrl) {
      setProductUrl(extractedUrl);
      setSharedTitle(extractedTitle);
      setState('scraping');
    } else {
      if (extractedTitle) {
        setName(extractedTitle);
      }
      setErrorMessage(
        'No product URL found in the shared content. Please enter details manually.'
      );
      setState('editing');
    }
  }, [searchParams]);

  // Step 2: Auto-scrape when URL is extracted
  useEffect(() => {
    if (state !== 'scraping' || !productUrl) return;

    let cancelled = false;

    const scrape = async () => {
      try {
        const response = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: productUrl }),
        });

        if (cancelled) return;

        const data = await response.json();

        if (data.success) {
          if (data.name) setName(data.name);
          if (data.currentPrice) setCurrentPrice(String(data.currentPrice));
          if (data.originalPrice)
            setOriginalPrice(String(data.originalPrice));
          if (data.currency) setCurrency(data.currency);
          if (data.imageUrl) {
            setImageData(data.imageUrl);
            setImageUrl(data.imageUrl);
          }
        } else {
          if (sharedTitle) setName(sharedTitle);
          setErrorMessage(
            data.error ||
              'Could not fetch product details. Please enter them manually.'
          );
        }
      } catch {
        if (cancelled) return;
        if (sharedTitle) setName(sharedTitle);
        setErrorMessage(
          'Failed to fetch product details. Please enter them manually.'
        );
      }

      if (!cancelled) setState('editing');
    };

    scrape();

    return () => {
      cancelled = true;
    };
  }, [state, productUrl, sharedTitle]);

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

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      setState('saving');
      try {
        const item: CreateItemRequest = {
          name: name.trim(),
          url: productUrl,
          currentPrice: parseFloat(currentPrice),
          originalPrice: originalPrice ? parseFloat(originalPrice) : null,
          currency,
          imageData,
          priority,
          notes: notes.trim(),
        };

        const response = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });

        if (!response.ok) {
          throw new Error('Failed to save item');
        }

        setState('success');
        setTimeout(() => {
          router.push('/wishlist');
        }, 1500);
      } catch {
        setErrors({ submit: 'Failed to save item. Please try again.' });
        setState('editing');
      }
    },
    [
      name,
      productUrl,
      currentPrice,
      originalPrice,
      currency,
      imageData,
      priority,
      notes,
      validate,
      router,
    ]
  );

  const handleCancel = useCallback(() => {
    router.push('/wishlist');
  }, [router]);

  const handleImageUrlChange = useCallback((url: string) => {
    setImageUrl(url);
    if (url) {
      setImageData(url);
    } else {
      setImageData(null);
    }
  }, []);

  // --- Loading / Scraping state ---
  if (state === 'extracting' || state === 'scraping') {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">
              Add from Share
            </h1>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              Cancel
            </button>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
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
            <p className="text-gray-500">Fetching product details...</p>
            {productUrl && (
              <p className="text-gray-400 text-sm mt-2 px-4 truncate max-w-sm">
                {productUrl}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Success state ---
  if (state === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg
            className="h-16 w-16 text-green-500 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-lg font-medium text-gray-900">Item saved!</p>
          <p className="text-gray-500 mt-1">Redirecting to wishlist...</p>
        </div>
      </div>
    );
  }

  // --- Editing state (main form) ---
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            Add from Share
          </h1>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            Cancel
          </button>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Warning banner if scraping failed */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">{errorMessage}</p>
          </div>
        )}

        {/* Shared URL display */}
        {productUrl && (
          <div className="mb-4 p-3 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Shared URL</p>
            <p className="text-sm text-blue-600 truncate">{productUrl}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Image preview */}
          {imageData && (
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
          )}

          {/* Image URL input */}
          <Input
            label="Image URL (optional)"
            type="url"
            value={imageUrl}
            onChange={handleImageUrlChange}
            placeholder="https://example.com/image.jpg"
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

          {/* Submit error */}
          {errors.submit && (
            <p className="text-sm text-red-500 text-center">{errors.submit}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2 pb-8">
            <Button
              variant="secondary"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={state === 'saving'}
              className="flex-1"
            >
              Save to Wishlist
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
