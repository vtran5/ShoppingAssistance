// Currency type - common currencies plus custom string
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'VND' | string;

// Priority rating 1-5
export type Priority = 1 | 2 | 3 | 4 | 5;

// Item view size for mobile grid layout
export type ItemViewSize = 'large' | 'medium' | 'small' | 'list';

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
  priceInBaseCurrency: number | null; // Calculated via GOOGLEFINANCE formula in Google Sheets
  previousPrice: number | null; // Price before last automated check (for Phase 4)
}

// User settings
export interface UserSettings {
  baseCurrency: Currency;
  itemViewSize: ItemViewSize;
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
  itemViewSize: ItemViewSize;
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
  baseCurrency?: Currency;
  itemViewSize?: ItemViewSize;
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

// Price check types (for Phase 4)
export interface PriceCheckResult {
  itemId: string;
  itemName: string;
  previousPrice: number;
  currentPrice: number | null; // null if scraping failed
  currency: Currency;
  priceChanged: boolean;
  percentChange: number | null;
  error?: string;
}

export interface PriceCheckSummary {
  totalChecked: number;
  priceDrops: number;
  priceIncreases: number;
  unchanged: number;
  failed: number;
  results: PriceCheckResult[];
  checkedAt: string;
}

export interface PriceCheckResponse {
  summary: PriceCheckSummary;
}
