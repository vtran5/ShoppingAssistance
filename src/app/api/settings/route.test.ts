import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT, GET } from './route';
import * as sheets from '@/lib/sheets';

// Mock the sheets module
vi.mock('@/lib/sheets', () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
}));

describe('Settings API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/settings', () => {
    it('returns settings successfully', async () => {
      const mockSettings = { baseCurrency: 'USD', itemViewSize: 'large' };
      vi.mocked(sheets.getSettings).mockResolvedValue(mockSettings);

      const response = await GET();
      const data = await response.json();

      expect(data).toEqual(mockSettings);
      expect(response.status).toBe(200);
    });

    it('returns 500 on error', async () => {
      vi.mocked(sheets.getSettings).mockRejectedValue(new Error('DB error'));

      const response = await GET();
      const data = await response.json();

      expect(data.error).toBe('Failed to fetch settings');
      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/settings', () => {
    it('updates baseCurrency only', async () => {
      const mockSettings = { baseCurrency: 'EUR', itemViewSize: 'large' };
      vi.mocked(sheets.updateSettings).mockResolvedValue(mockSettings);

      const request = new Request('http://localhost/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ baseCurrency: 'eur' }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(sheets.updateSettings).toHaveBeenCalledWith({ baseCurrency: 'EUR' });
      expect(data).toEqual(mockSettings);
      expect(response.status).toBe(200);
    });

    it('updates itemViewSize only', async () => {
      const mockSettings = { baseCurrency: 'USD', itemViewSize: 'small' };
      vi.mocked(sheets.updateSettings).mockResolvedValue(mockSettings);

      const request = new Request('http://localhost/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ itemViewSize: 'small' }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(sheets.updateSettings).toHaveBeenCalledWith({ itemViewSize: 'small' });
      expect(data).toEqual(mockSettings);
      expect(response.status).toBe(200);
    });

    it('updates both settings together', async () => {
      const mockSettings = { baseCurrency: 'GBP', itemViewSize: 'medium' };
      vi.mocked(sheets.updateSettings).mockResolvedValue(mockSettings);

      const request = new Request('http://localhost/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ baseCurrency: 'gbp', itemViewSize: 'medium' }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(sheets.updateSettings).toHaveBeenCalledWith({
        baseCurrency: 'GBP',
        itemViewSize: 'medium',
      });
      expect(data).toEqual(mockSettings);
      expect(response.status).toBe(200);
    });

    it('returns 400 when no settings provided', async () => {
      const request = new Request('http://localhost/api/settings', {
        method: 'PUT',
        body: JSON.stringify({}),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(data.error).toBe('At least one setting is required');
      expect(response.status).toBe(400);
    });

    it('returns 400 when baseCurrency is empty string', async () => {
      const request = new Request('http://localhost/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ baseCurrency: '  ' }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(data.error).toBe('Base currency cannot be empty');
      expect(response.status).toBe(400);
    });

    it('returns 400 for invalid itemViewSize', async () => {
      const request = new Request('http://localhost/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ itemViewSize: 'invalid' }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(data.error).toBe('Invalid item view size');
      expect(response.status).toBe(400);
    });

    it('validates itemViewSize accepts only valid values', async () => {
      const validSizes = ['large', 'medium', 'small'];

      for (const size of validSizes) {
        vi.mocked(sheets.updateSettings).mockResolvedValue({
          baseCurrency: 'USD',
          itemViewSize: size as 'large' | 'medium' | 'small',
        });

        const request = new Request('http://localhost/api/settings', {
          method: 'PUT',
          body: JSON.stringify({ itemViewSize: size }),
        });

        const response = await PUT(request);
        expect(response.status).toBe(200);
      }
    });

    it('returns 500 on update error', async () => {
      vi.mocked(sheets.updateSettings).mockRejectedValue(new Error('Update failed'));

      const request = new Request('http://localhost/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ baseCurrency: 'USD' }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(data.error).toBe('Failed to update settings');
      expect(response.status).toBe(500);
    });

    it('handles null baseCurrency without throwing', async () => {
      // This tests the null safety fix
      const request = new Request('http://localhost/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ baseCurrency: null, itemViewSize: 'small' }),
      });

      const mockSettings = { baseCurrency: 'USD', itemViewSize: 'small' };
      vi.mocked(sheets.updateSettings).mockResolvedValue(mockSettings);

      const response = await PUT(request);
      // Should not throw, should process itemViewSize
      expect(response.status).toBe(200);
    });
  });
});
