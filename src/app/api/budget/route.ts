import { NextRequest, NextResponse } from 'next/server';
import { getAllItems, getSettings } from '@/lib/sheets';
import { suggestPurchases } from '@/lib/budget';
import { Currency, BudgetSuggestion } from '@/types';

interface BudgetRequest {
  budget: number;
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

    // Get all items and settings
    const [items, settings] = await Promise.all([
      getAllItems(),
      getSettings(),
    ]);

    // Generate suggestions using base currency
    // priceInBaseCurrency is calculated via GOOGLEFINANCE formula in Google Sheets
    // Falls back to currentPrice for items already in the base currency
    const suggestions = suggestPurchases(items, body.budget, settings.baseCurrency);

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
