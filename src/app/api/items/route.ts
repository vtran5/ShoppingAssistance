import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getAllItems, addItem } from '@/lib/sheets';
import { WishlistItem, CreateItemRequest, Priority } from '@/types';

// GET /api/items - List all items
export async function GET() {
  try {
    const items = await getAllItems();
    return NextResponse.json({ items, count: items.length });
  } catch (error) {
    console.error('Failed to fetch items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

// POST /api/items - Create new item
export async function POST(request: Request) {
  try {
    const body: CreateItemRequest = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (body.currentPrice === undefined || body.currentPrice === null) {
      return NextResponse.json({ error: 'Current price is required' }, { status: 400 });
    }

    if (!body.currency) {
      return NextResponse.json({ error: 'Currency is required' }, { status: 400 });
    }

    // Create new item
    const now = new Date().toISOString();
    const newItem: WishlistItem = {
      id: uuidv4(),
      name: body.name.trim(),
      url: body.url || null,
      currentPrice: body.currentPrice,
      priceWhenAdded: body.currentPrice,
      originalPrice: body.originalPrice ?? null,
      currency: body.currency,
      imageData: body.imageData ?? null,
      priority: (body.priority as Priority) || 3,
      isPurchased: false,
      notes: body.notes || '',
      createdAt: now,
      lastChecked: body.url ? now : null,
    };

    await addItem(newItem);

    return NextResponse.json({ item: newItem }, { status: 201 });
  } catch (error) {
    console.error('Failed to create item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
