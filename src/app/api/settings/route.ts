import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/sheets';
import { UpdateSettingsRequest } from '@/types';

// GET /api/settings - Get current settings
export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT /api/settings - Update settings
export async function PUT(request: Request) {
  try {
    const body: UpdateSettingsRequest = await request.json();

    // Validate baseCurrency
    if (!body.baseCurrency || body.baseCurrency.trim() === '') {
      return NextResponse.json({ error: 'Base currency is required' }, { status: 400 });
    }

    const updatedSettings = await updateSettings({
      baseCurrency: body.baseCurrency.toUpperCase(),
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
