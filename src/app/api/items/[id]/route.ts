import { NextResponse } from 'next/server';
import { getItemById, updateItem, deleteItem } from '@/lib/sheets';
import { UpdateItemRequest } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/items/[id] - Get single item
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const item = await getItemById(id);

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Failed to fetch item:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

// PUT /api/items/[id] - Update item
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: UpdateItemRequest = await request.json();

    // Check if item exists
    const existingItem = await getItemById(id);
    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Validate fields if provided
    if (body.name !== undefined && body.name.trim() === '') {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    if (body.priority !== undefined && (body.priority < 1 || body.priority > 5)) {
      return NextResponse.json({ error: 'Priority must be between 1 and 5' }, { status: 400 });
    }

    // Update item
    const updatedItem = await updateItem(id, body);

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error('Failed to update item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

// DELETE /api/items/[id] - Delete item
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if item exists
    const existingItem = await getItemById(id);
    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    await deleteItem(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
