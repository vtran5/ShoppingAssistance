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

    // Validate at least one setting is provided
    if (!body.baseCurrency && !body.itemViewSize) {
      return NextResponse.json({ error: 'At least one setting is required' }, { status: 400 });
    }

    // Validate baseCurrency if provided
    if (body.baseCurrency !== undefined && body.baseCurrency !== null && body.baseCurrency.trim() === '') {
      return NextResponse.json({ error: 'Base currency cannot be empty' }, { status: 400 });
    }

    // Validate itemViewSize if provided
    const validViewSizes = ['large', 'medium', 'small', 'list'];
    if (body.itemViewSize !== undefined && !validViewSizes.includes(body.itemViewSize)) {
      return NextResponse.json({ error: 'Invalid item view size' }, { status: 400 });
    }

    const updatedSettings = await updateSettings({
      ...(body.baseCurrency && { baseCurrency: body.baseCurrency.toUpperCase() }),
      ...(body.itemViewSize && { itemViewSize: body.itemViewSize }),
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
