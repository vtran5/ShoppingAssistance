import { NextRequest, NextResponse } from 'next/server';
import { getAllItems, getSettings } from '@/lib/sheets';
import { suggestPurchases } from '@/lib/budget';
import { Currency, BudgetSuggestion } from '@/types';

interface BudgetRequest {
  budget: number;
  currency: Currency;
}

interface BudgetResponse {
  suggestions: BudgetSuggestion[];
  baseCurrency: Currency;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as BudgetRequest;

    // Validate request
    if (body.budget === undefined || body.budget === null) {
      return NextResponse.json(
        { error: 'Budget amount is required' },
        { status: 400 }
      );
    }

    if (typeof body.budget !== 'number' || body.budget <= 0) {
      return NextResponse.json(
        { error: 'Budget must be a positive number' },
        { status: 400 }
      );
    }

    if (!body.currency) {
      return NextResponse.json(
        { error: 'Currency is required' },
        { status: 400 }
      );
    }

    // Get all items and settings
    const [items, settings] = await Promise.all([
      getAllItems(),
      getSettings(),
    ]);

    // Generate suggestions
    // Note: priceInBaseCurrency is already in the user's base currency from Google Sheets
    // The budget currency should match the base currency for accurate comparison
    const suggestions = suggestPurchases(items, body.budget);

    const response: BudgetResponse = {
      suggestions,
      baseCurrency: settings.baseCurrency,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Budget API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate budget suggestions' },
      { status: 500 }
    );
  }
}
