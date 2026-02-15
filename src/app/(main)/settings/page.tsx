'use client';

import { useState, useEffect, useCallback } from 'react';
import { CurrencySelect } from '@/components/ui/CurrencySelect';
import { Button } from '@/components/ui/Button';
import { Currency } from '@/types';

export default function SettingsPage() {
  const [baseCurrency, setBaseCurrency] = useState<Currency>('USD');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch current settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        const data = await response.json();
        setBaseCurrency(data.baseCurrency);
      } catch (err) {
        setError('Failed to load settings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  // Save settings
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseCurrency }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, [baseCurrency]);

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
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Settings</h2>
          <p className="text-sm text-gray-500">
            Configure your app preferences
          </p>
        </div>

        {/* Base Currency */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base Currency
          </label>
          <p className="text-xs text-gray-500 mb-3">
            All prices will be displayed in this currency for comparison
          </p>
          <CurrencySelect
            value={baseCurrency}
            onChange={setBaseCurrency}
            className="w-full"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">
            Settings saved successfully!
          </div>
        )}

        {/* Save button */}
        <Button onClick={handleSave} loading={saving} className="w-full">
          Save Settings
        </Button>

        {/* Share from Safari */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-1">
            Share from Safari
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Add items directly from Safari using the Share button
          </p>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-700 mb-2">
              Setup with iOS Shortcuts:
            </p>
            <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside">
              <li>
                Open the <span className="font-medium">Shortcuts</span> app on
                your iPhone
              </li>
              <li>
                Tap <span className="font-medium">+</span> to create a new
                shortcut
              </li>
              <li>
                Add action:{' '}
                <span className="font-medium">Receive input</span> from{' '}
                <span className="font-medium">Share Sheet</span> (accept URLs)
              </li>
              <li>
                Add action:{' '}
                <span className="font-medium">Open URL</span> and set it to:
                <code className="block mt-1 px-2 py-1 bg-white rounded border border-gray-200 text-[11px] text-gray-800 break-all">
                  {typeof window !== 'undefined'
                    ? window.location.origin
                    : 'https://your-app-url'}
                  /share?url=[Shortcut Input]
                </code>
              </li>
              <li>
                Name it{' '}
                <span className="font-medium">&quot;Add to Wishlist&quot;</span>{' '}
                and tap Done
              </li>
            </ol>
            <p className="text-xs text-gray-500 mt-3">
              After setup, tap the Share button in Safari on any product page,
              then select &quot;Add to Wishlist&quot; from the share sheet.
            </p>
          </div>
        </div>

        {/* App info */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">About</h3>
          <div className="text-xs text-gray-500 space-y-1">
            <p>Shopping Assistant v0.1.0</p>
            <p>A PWA for tracking your wishlist items and budget.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
