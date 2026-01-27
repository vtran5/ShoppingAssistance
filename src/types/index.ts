// Currency type - common currencies plus custom string
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'VND' | string;

// Priority rating 1-5
export type Priority = 1 | 2 | 3 | 4 | 5;

// Wishlist item - main data model
export interface WishlistItem {
  id: string;
  name: string;
  url: string | null;
  currentPrice: number;
  priceWhenAdded: number;
  originalPrice: number | null;
  currency: Currency;
  imageData: string | null;
  priority: Priority;
  isPurchased: boolean;
  notes: string;
  createdAt: string;
  lastChecked: string | null;
}

// User settings
export interface UserSettings {
  baseCurrency: Currency;
}

// API Response types
export interface ItemsResponse {
  items: WishlistItem[];
  count: number;
}

export interface ItemResponse {
  item: WishlistItem;
}

export interface ErrorResponse {
  error: string;
}

export interface SuccessResponse {
  success: true;
}

export interface SettingsResponse {
  baseCurrency: Currency;
}

// API Request types
export interface CreateItemRequest {
  name: string;
  url?: string | null;
  currentPrice: number;
  originalPrice?: number | null;
  currency: Currency;
  imageData?: string | null;
  priority?: Priority;
  notes?: string;
}

export interface UpdateItemRequest {
  name?: string;
  currentPrice?: number;
  originalPrice?: number | null;
  currency?: Currency;
  imageData?: string | null;
  priority?: Priority;
  isPurchased?: boolean;
  notes?: string;
}

export interface UpdateSettingsRequest {
  baseCurrency: Currency;
}

// Sort and Filter types
export type SortOption = 'priority' | 'price-low' | 'price-high' | 'date-added';

export interface FilterOptions {
  priorities: Priority[];
  minPrice: number | null;
  maxPrice: number | null;
  status: 'all' | 'active' | 'purchased';
}

// Budget suggestion types (for Phase 3)
export interface BudgetSuggestion {
  strategy: 'high-priority' | 'most-items' | 'best-value';
  items: WishlistItem[];
  totalCost: number;
  priorityScore: number;
  remaining: number;
}
