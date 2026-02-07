# Shopping Assistant - Architecture Design

## High-Level Design

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (iPhone)                           │
│                    Safari / PWA Home Screen                     │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js PWA)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Wishlist   │  │   Budget    │  │      Add Item Form      │  │
│  │    Page     │  │    Page     │  │   (URL paste + manual)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                           │                                      │
│                    Service Worker (Offline Cache)                │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ HTTPS
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Next.js API Routes)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ /api/items  │  │ /api/scrape │  │    /api/budget          │  │
│  │   (CRUD)    │  │  (fetch URL)│  │   (suggestions)         │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                      │                │
└─────────┼────────────────┼──────────────────────┼────────────────┘
          │                │                      │
          ▼                ▼                      │
┌─────────────────┐ ┌─────────────────┐          │
│  Google Sheets  │ │  Web Scraper    │          │
│   (Database)    │ │  (Cheerio/API)  │          │
└─────────────────┘ └─────────────────┘          │
          ▲                                       │
          └───────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **PWA Frontend** | Display wishlist, handle user interactions, offline support |
| **API Routes** | Business logic, data validation, orchestration |
| **Google Sheets** | Data persistence (wishlist items, price history) |
| **Web Scraper** | Extract product info from URLs |

### Data Flow: Adding an Item

```
1. User pastes URL → Frontend
2. Frontend calls POST /api/scrape with URL
3. Scraper fetches HTML, extracts: name, price, images
4. Returns scraped data to Frontend
5. User confirms/edits data
6. Frontend calls POST /api/items
7. Backend writes to Google Sheets
8. Returns success → Frontend updates UI
```

---

## Detailed Design (MVP)

### 1. Frontend Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (PWA meta tags)
│   ├── page.tsx                  # Redirects to /wishlist
│   ├── manifest.ts               # PWA manifest
│   ├── wishlist/
│   │   └── page.tsx              # Main wishlist view
│   ├── budget/
│   │   └── page.tsx              # Budget suggestions view
│   └── api/
│       ├── items/
│       │   └── route.ts          # GET (list), POST (create)
│       ├── items/[id]/
│       │   └── route.ts          # GET, PUT, DELETE single item
│       ├── scrape/
│       │   └── route.ts          # POST: scrape URL
│       └── budget/
│           └── route.ts          # POST: get suggestions
│
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── StarRating.tsx
│   ├── wishlist/
│   │   ├── WishlistGrid.tsx      # Grid of items
│   │   ├── WishlistItem.tsx      # Single item card
│   │   ├── AddItemModal.tsx      # Modal for adding item
│   │   └── EditItemModal.tsx     # Modal for editing item
│   ├── budget/
│   │   ├── BudgetInput.tsx       # Budget amount input
│   │   └── SuggestionCard.tsx    # Single suggestion
│   └── layout/
│       ├── Header.tsx            # App header
│       └── BottomNav.tsx         # Mobile navigation
│
├── lib/
│   ├── sheets.ts                 # Google Sheets client
│   ├── scraper.ts                # URL scraping logic
│   └── budget.ts                 # Budget calculation algorithm
│
├── hooks/
│   ├── useWishlist.ts            # Wishlist data + mutations
│   └── useBudget.ts              # Budget suggestions
│
└── types/
    └── index.ts                  # TypeScript interfaces
```

### 2. Data Models

```typescript
// types/index.ts

type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'VND' | string;

interface WishlistItem {
  id: string;                    // UUID
  name: string;                  // Product name
  url: string | null;            // Product URL (null for manual/offline items)

  // Pricing
  currentPrice: number;          // Current price in original currency
  priceWhenAdded: number;        // Price when first added
  originalPrice: number | null;  // MSRP/retail price (optional)
  currency: Currency;            // Original currency (USD, EUR, etc.)

  // Converted price (for sorting/budget) - calculated via GOOGLEFINANCE in Google Sheets
  priceInBaseCurrency: number | null;  // Converted to user's base currency (null if formula not yet calculated)

  imageData: string | null;       // Image URL or base64 data (for pasted images)
  priority: 1 | 2 | 3 | 4 | 5;   // 1=low, 5=high
  isPurchased: boolean;          // Has user bought it?
  notes: string;                 // User notes
  createdAt: string;             // ISO date
  lastChecked: string | null;    // ISO date (null for manual items)
  previousPrice: number | null;  // Price before last automated check (for Phase 4 price tracking)
}

interface BudgetSuggestion {
  items: WishlistItem[];   // Items to buy
  totalCost: number;       // Sum in base currency
  priorityScore: number;   // Sum of priorities
  remaining: number;       // Budget - totalCost
}

interface ScrapedProduct {
  name: string;
  currentPrice: number | null;
  originalPrice: number | null;
  currency: Currency;
  imageUrl: string | null;
  success: boolean;
  error?: string;
}

interface ExchangeRates {
  base: Currency;
  rates: Record<Currency, number>;
  lastUpdated: string;
}

interface UserSettings {
  baseCurrency: Currency;        // User's preferred currency for display
  itemViewSize: ItemViewSize;    // Grid/list view preference
}

type ItemViewSize = 'large' | 'medium' | 'small' | 'list';

// Phase 4: Price Tracking types
interface PriceCheckResult {
  itemId: string;
  itemName: string;
  previousPrice: number;
  currentPrice: number | null;   // null if scraping failed
  currency: Currency;
  priceChanged: boolean;
  percentChange: number | null;
  error?: string;
}

interface PriceCheckSummary {
  totalChecked: number;
  priceDrops: number;
  priceIncreases: number;
  unchanged: number;
  failed: number;
  results: PriceCheckResult[];
  checkedAt: string;             // ISO timestamp
}
```

### 3. Google Sheets Schema

**Sheet: `Wishlist`**

| Column | Type | Description |
|--------|------|-------------|
| A: ID | string | UUID (generated) |
| B: Name | string | Product name |
| C: URL | string | Product page URL (empty for manual items) |
| D: CurrentPrice | number | Current price |
| E: PriceWhenAdded | number | Price when first added |
| F: OriginalPrice | number | Normal price/MSRP (optional) |
| G: Currency | string | Currency code (USD, EUR, etc.) |
| H: ImageData | string | Image URL or base64 data (for manual items) |
| I: Priority | number | 1-5 rating |
| J: IsPurchased | boolean | TRUE/FALSE |
| K: Notes | string | User notes |
| L: CreatedAt | string | ISO timestamp |
| M: LastChecked | string | ISO timestamp (empty for manual items) |
| N: PriceInBaseCurrency | number | **Calculated via formula** - see below |
| O: PreviousPrice | number | Price before last automated check (for price tracking) |

**Currency Conversion Formula (Column N)**

Column N contains a GOOGLEFINANCE formula that automatically converts prices to the user's base currency:

```
=IF(G{row}=Settings!$B$2, D{row}, D{row}*GOOGLEFINANCE("CURRENCY:"&G{row}&Settings!$B$2))
```

- If item currency (G) equals base currency (Settings!$B$2), returns the current price (D)
- Otherwise, converts using live exchange rates from Google Finance
- Formula is automatically inserted when items are added via the API
- Exchange rates update automatically when the sheet is accessed

**Sheet: `Settings`**

| Column | Type | Description |
|--------|------|-------------|
| A: Key | string | Setting name |
| B: Value | string | Setting value |

Example rows:
- `baseCurrency` | `USD`

### 4. API Endpoints

#### `GET /api/items`
Returns all wishlist items.

```typescript
// Response
{
  items: WishlistItem[],
  count: number
}
```

#### `POST /api/items`
Creates a new wishlist item. Supports two modes:

```typescript
// Mode 1: From URL (scraped data)
{
  url: string,
  name: string,           // From scraper or user override
  currentPrice: number,
  originalPrice?: number,
  currency: string,       // Detected or user-selected
  imageUrl?: string,
  priority?: number,      // default: 3
  notes?: string
}

// Mode 2: Manual entry (offline items)
{
  url: null,              // Explicitly null for manual items
  name: string,
  currentPrice: number,
  originalPrice?: number,
  currency: string,       // User-selected
  imageUrl?: string,      // Optional: user can paste image URL
  priority?: number,
  notes?: string
}

// Response
{
  item: WishlistItem
}
```

#### `PUT /api/items/[id]`
Updates an existing item.

```typescript
// Request body (all optional)
{
  name?: string,
  currentPrice?: number,
  originalPrice?: number,
  priority?: number,
  isPurchased?: boolean,
  notes?: string
}
```

#### `DELETE /api/items/[id]`
Deletes an item.

#### `POST /api/scrape`
Scrapes product info from URL.

```typescript
// Request body
{
  url: string
}

// Response
{
  name: string,
  currentPrice: number | null,
  originalPrice: number | null,
  imageUrl: string | null,
  success: boolean,
  error?: string
}
```

#### `POST /api/budget`
Gets purchase suggestions for a budget.

```typescript
// Request body
{
  budget: number,
  currency: string,        // Budget currency
  maxSuggestions?: number  // default: 3
}

// Response
{
  suggestions: BudgetSuggestion[],
  baseCurrency: string
}
```

#### `GET /api/currency/rates`
Gets current exchange rates.

```typescript
// Query params
?base=USD  // Optional, defaults to user's base currency

// Response
{
  base: string,
  rates: { EUR: 0.92, GBP: 0.79, ... },
  lastUpdated: string
}
```

#### `GET /api/settings` / `PUT /api/settings`
Get or update user settings.

```typescript
// GET Response / PUT Request body
{
  baseCurrency: string  // e.g., "USD"
}
```

#### `POST /api/price-check`
Triggers automated price checking for all URL-based, unpurchased items.

**Authentication:** Requires `Authorization: Bearer <CRON_SECRET>` header.

```typescript
// Response
{
  summary: {
    totalChecked: number,
    priceDrops: number,
    priceIncreases: number,
    unchanged: number,
    failed: number,
    results: PriceCheckResult[],
    checkedAt: string  // ISO timestamp
  }
}
```

**Notes:**
- Called by GitHub Actions cron job (daily at 8:00 UTC)
- Includes 3-second delay between requests to avoid rate limiting
- Only logs price changes >= 1% threshold
- Updates `currentPrice`, `previousPrice`, and `lastChecked` in Google Sheets

### 5. Google Sheets Integration

```typescript
// lib/sheets.ts

import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const WISHLIST_SHEET = 'Wishlist';
const SETTINGS_SHEET = 'Settings';

// Header row for Wishlist sheet
const WISHLIST_HEADERS = [
  'ID', 'Name', 'URL', 'CurrentPrice', 'PriceWhenAdded',
  'OriginalPrice', 'Currency', 'ImageData', 'Priority',
  'IsPurchased', 'Notes', 'CreatedAt', 'LastChecked'
];

const SETTINGS_HEADERS = ['Key', 'Value'];

// Initialize client with service account
function getClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// Initialize sheets with headers if they don't exist
async function initializeSheets(): Promise<void> {
  const sheets = getClient();

  // Get spreadsheet info
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });

  const existingSheets = spreadsheet.data.sheets?.map(s => s.properties?.title) ?? [];

  // Create Wishlist sheet if missing
  if (!existingSheets.includes(WISHLIST_SHEET)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: WISHLIST_SHEET } } }],
      },
    });
  }

  // Create Settings sheet if missing
  if (!existingSheets.includes(SETTINGS_SHEET)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: SETTINGS_SHEET } } }],
      },
    });
  }

  // Check and add headers for Wishlist
  const wishlistData = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A1:M1`,
  });

  if (!wishlistData.data.values || wishlistData.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${WISHLIST_SHEET}!A1:M1`,
      valueInputOption: 'RAW',
      requestBody: { values: [WISHLIST_HEADERS] },
    });
  }

  // Check and add headers for Settings
  const settingsData = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SETTINGS_SHEET}!A1:B1`,
  });

  if (!settingsData.data.values || settingsData.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SETTINGS_SHEET}!A1:B1`,
      valueInputOption: 'RAW',
      requestBody: { values: [SETTINGS_HEADERS] },
    });
    // Add default settings
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SETTINGS_SHEET}!A:B`,
      valueInputOption: 'RAW',
      requestBody: { values: [['baseCurrency', 'USD']] },
    });
  }
}

// Call on app startup or first API request
let initialized = false;
async function ensureInitialized(): Promise<void> {
  if (!initialized) {
    await initializeSheets();
    initialized = true;
  }
}

// Read all items
async function getAllItems(): Promise<WishlistItem[]> {
  await ensureInitialized();
  const sheets = getClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A2:M`,  // Skip header row
  });

  return response.data.values?.map(rowToItem) ?? [];
}

// Append new item
async function addItem(item: WishlistItem): Promise<void> {
  await ensureInitialized();
  const sheets = getClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A:M`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [itemToRow(item)],
    },
  });
}

// Update item (find row by ID, update values)
async function updateItem(id: string, updates: Partial<WishlistItem>): Promise<void> {
  await ensureInitialized();
  const sheets = getClient();

  // 1. Find the row with matching ID
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A:A`,
  });

  const rows = response.data.values ?? [];
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) {
    throw new Error(`Item with ID ${id} not found`);
  }

  // 2. Get current row data
  const currentRow = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A${rowIndex + 1}:M${rowIndex + 1}`,
  });

  // 3. Merge updates and write back
  const updatedItem = { ...rowToItem(currentRow.data.values![0]), ...updates };
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A${rowIndex + 1}:M${rowIndex + 1}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [itemToRow(updatedItem)] },
  });
}

// Delete item (find row by ID, delete row)
async function deleteItem(id: string): Promise<void> {
  await ensureInitialized();
  const sheets = getClient();

  // 1. Get sheet ID
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  const sheetId = spreadsheet.data.sheets?.find(
    s => s.properties?.title === WISHLIST_SHEET
  )?.properties?.sheetId;

  // 2. Find row index
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A:A`,
  });

  const rows = response.data.values ?? [];
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) {
    throw new Error(`Item with ID ${id} not found`);
  }

  // 3. Delete the row
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1,
          },
        },
      }],
    },
  });
}
```

### 6. Web Scraper Design

```typescript
// lib/scraper.ts

interface ScrapedProduct {
  name: string;
  currentPrice: number | null;
  originalPrice: number | null;
  imageUrl: string | null;
}

async function scrapeProduct(url: string): Promise<ScrapedProduct> {
  // 1. Fetch HTML
  const html = await fetch(url).then(r => r.text());

  // 2. Try JSON-LD first (most reliable)
  const jsonLd = extractJsonLd(html);
  if (jsonLd?.['@type'] === 'Product') {
    return parseJsonLdProduct(jsonLd);
  }

  // 3. Try OpenGraph meta tags
  const og = extractOpenGraph(html);
  if (og.title && og.price) {
    return parseOpenGraphProduct(og);
  }

  // 4. Try common selectors as fallback
  return parseGenericProduct(html);
}

function extractJsonLd(html: string): object | null {
  // Find <script type="application/ld+json">
  // Parse and return Product schema
}

function extractOpenGraph(html: string): object {
  // Find og:title, product:price:amount, og:image
}

function parseGenericProduct(html: string): ScrapedProduct {
  // Try common class names: .product-title, .price, etc.
}
```

### 7. Budget Algorithm

```typescript
// lib/budget.ts

function suggestPurchases(
  items: WishlistItem[],
  budget: number,
  maxSuggestions: number = 3
): BudgetSuggestion[] {
  // Filter: only unpurchased items within budget
  const available = items
    .filter(i => !i.isPurchased && i.currentPrice <= budget)
    .sort((a, b) => b.priority - a.priority);  // Highest priority first

  const suggestions: BudgetSuggestion[] = [];

  // Strategy 1: Greedy by priority
  // Pick highest priority items that fit
  suggestions.push(greedyByPriority(available, budget));

  // Strategy 2: Maximize items count
  // Pick cheapest items first to get more items
  suggestions.push(greedyByCheapest(available, budget));

  // Strategy 3: Best value (priority per dollar)
  // Maximize total priority / total cost
  suggestions.push(greedyByValue(available, budget));

  // Remove duplicates and return
  return deduplicateSuggestions(suggestions);
}

function greedyByPriority(items: WishlistItem[], budget: number): BudgetSuggestion {
  const selected: WishlistItem[] = [];
  let remaining = budget;

  for (const item of items) {  // Already sorted by priority
    if (item.currentPrice <= remaining) {
      selected.push(item);
      remaining -= item.currentPrice;
    }
  }

  return {
    items: selected,
    totalCost: budget - remaining,
    priorityScore: selected.reduce((sum, i) => sum + i.priority, 0),
    remaining,
  };
}
```

### 8. Currency Conversion

```typescript
// lib/currency.ts

const EXCHANGE_API = 'https://api.exchangerate-api.com/v4/latest';

interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  date: string;
}

// Cache rates for 1 hour
let cachedRates: ExchangeRates | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function getExchangeRates(base: string = 'USD'): Promise<ExchangeRates> {
  const now = Date.now();
  if (cachedRates && cachedRates.base === base && now - cacheTime < CACHE_DURATION) {
    return cachedRates;
  }

  const response = await fetch(`${EXCHANGE_API}/${base}`);
  cachedRates = await response.json();
  cacheTime = now;
  return cachedRates;
}

function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: ExchangeRates
): number {
  if (from === to) return amount;

  // Convert to base, then to target
  const inBase = from === rates.base ? amount : amount / rates.rates[from];
  const inTarget = to === rates.base ? inBase : inBase * rates.rates[to];

  return Math.round(inTarget * 100) / 100; // Round to 2 decimals
}
```

**Free Exchange Rate APIs:**
- exchangerate-api.com (1,500 req/month free)
- frankfurter.app (unlimited, EUR base only)
- fixer.io (100 req/month free)

For MVP, use exchangerate-api.com with caching.

### 9. PWA Configuration

```typescript
// app/manifest.ts
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Shopping Assistant',
    short_name: 'ShopAssist',
    description: 'Track wishlist and budget smartly',
    start_url: '/wishlist',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
```

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: 'Shopping Assistant',
  description: 'Track wishlist and budget smartly',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ShopAssist',
  },
};
```

### 9. View Size Options

The wishlist supports four view size options that control how items are displayed:

| View Size | Layout | Columns (Mobile) | Image Size | Content Shown |
|-----------|--------|------------------|------------|---------------|
| **Large** | Grid (vertical cards) | 1 | 200px height | Full details: name, prices, converted price, original price, price change, priority, notes |
| **Medium** | Grid (vertical cards) | 2 | 120px height | Name, current price, priority stars |
| **Small** | Grid (vertical cards) | 4 | 80px height | Name, current price, priority stars (compact) |
| **List** | Horizontal cards | 1 | 80×80px (fixed) | Name, current price, priority stars |

**List View Layout:**
```
┌────────────────────────────────────────────────┐
│ ┌────────┐                                     │
│ │  IMG   │  Product Name (line-clamp-1)        │
│ │ 80x80  │  $29.99                             │
│ │ [link] │  ★★★★☆                              │
│ └────────┘                                     │
└────────────────────────────────────────────────┘
```

**List View Specifics:**
- Image: Fixed 80×80px, positioned on the left
- Content: Flex container on the right with name, price, and priority
- Link button: Overlaid on image (top-left), same as other views
- Purchased styling: Grayed out with checkmark icon (no text)
- Manual badge: Hidden (not shown)
- Notes preview: Hidden
- Converted/original prices: Hidden
- Price change indicator: Hidden
- Single column on all screen sizes (mobile to desktop)

### 10. UI Wireframes (Text-based)

**Wishlist Page (Mobile)**
```
┌─────────────────────────────┐
│  Shopping Assistant    [+]  │  ← Header with Add button
├─────────────────────────────┤
│ Sort: [Priority ▼]  [Filter]│  ← Sort dropdown + filter button
│ Showing in: [USD ▼]         │  ← Base currency selector
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ [IMAGE]                 │ │
│ │ Product Name            │ │
│ │ $29.99  ̶$̶4̶9̶.̶9̶9̶  (€27.50)│ │  ← Price + original + converted
│ │ ★★★★☆                   │ │  ← Star rating
│ │ Added: $35.00 → $29.99  │ │  ← Price when added vs now
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ [IMAGE]                 │ │
│ │ Another Product         │ │
│ │ €15.00  ($16.30)        │ │  ← Different currency item
│ │ ★★★☆☆                   │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ [No Image]              │ │  ← Manual item without image
│ │ Local Store Item        │ │
│ │ $50.00                  │ │
│ │ ★★★★★  📝 Manual         │ │  ← Badge for manual items
│ └─────────────────────────┘ │
├─────────────────────────────┤
│  [Wishlist]  [Budget]       │  ← Bottom navigation
└─────────────────────────────┘

Filter Panel (slides in):
┌─────────────────────────────┐
│ Priority                    │
│ ☑ ★★★★★  ☑ ★★★★☆  ☑ ★★★☆☆  │
│ ☑ ★★☆☆☆  ☑ ★☆☆☆☆           │
│                             │
│ Price Range (in USD)        │
│ Min: [____]  Max: [____]    │
│                             │
│ Status                      │
│ ☑ Active  ☐ Purchased       │
│                             │
│ [Apply]  [Reset]            │
└─────────────────────────────┘
```

**Add Item Modal**
```
┌─────────────────────────────┐
│     Add Item          [X]   │
├─────────────────────────────┤
│  [From URL]  [Manual Entry] │  ← Tab toggle
├─────────────────────────────┤
│                             │
│ === FROM URL TAB ===        │
│                             │
│ URL                         │
│ ┌─────────────────────────┐ │
│ │ https://amazon.com/...  │ │
│ └─────────────────────────┘ │
│         [Fetch Details]     │
│                             │
│ (Fields auto-filled below)  │
│                             │
│ === MANUAL TAB ===          │
│                             │
│ (All fields editable)       │
│                             │
├─────────────────────────────┤
│ Name                        │
│ ┌─────────────────────────┐ │
│ │ Product name            │ │
│ └─────────────────────────┘ │
│                             │
│ Price       Currency        │
│ ┌─────────┐ ┌─────────────┐ │
│ │ 29.99   │ │ USD ▼       │ │
│ └─────────┘ └─────────────┘ │
│                             │
│ Original Price (optional)   │
│ ┌─────────────────────────┐ │
│ │ 49.99                   │ │
│ └─────────────────────────┘ │
│                             │
│ Image (optional)            │
│ ┌─────────────────────────┐ │
│ │ [Paste image here]      │ │  ← For manual: paste image directly
│ │ or enter URL:           │ │
│ │ https://...             │ │  ← Or provide URL
│ └─────────────────────────┘ │
│                             │
│ Priority                    │
│ ★ ★ ★ ★ ★                   │
│                             │
│ Notes (optional)            │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│        [Save Item]          │
└─────────────────────────────┘
```

**Edit Item Modal** (opened by tapping item card)
```
┌─────────────────────────────┐
│     Edit Item         [X]   │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │      [IMAGE PREVIEW]    │ │  ← Current image (or placeholder)
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ Name                        │
│ ┌─────────────────────────┐ │
│ │ Product name            │ │
│ └─────────────────────────┘ │
│                             │
│ URL (read-only for scraped) │
│ ┌─────────────────────────┐ │
│ │ https://amazon.com/...  │ │  ← Disabled if from URL
│ └─────────────────────────┘ │
│                             │
│ Current Price   Currency    │
│ ┌─────────────┐ ┌─────────┐ │
│ │ 29.99       │ │ USD     │ │
│ └─────────────┘ └─────────┘ │
│                             │
│ Original Price (optional)   │
│ ┌─────────────────────────┐ │
│ │ 49.99                   │ │
│ └─────────────────────────┘ │
│                             │
│ Image                       │
│ ┌─────────────────────────┐ │
│ │ [Paste new image]       │ │
│ │ or change URL:          │ │
│ │ https://...             │ │
│ └─────────────────────────┘ │
│                             │
│ Priority                    │
│ ★ ★ ★ ★ ☆  (4/5)            │  ← Tap to change
│                             │
│ Notes                       │
│ ┌─────────────────────────┐ │
│ │ User notes here...      │ │
│ └─────────────────────────┘ │
│                             │
│ ☐ Mark as Purchased         │  ← Checkbox
│                             │
│ ┌───────────┐ ┌───────────┐ │
│ │  Delete   │ │   Save    │ │
│ └───────────┘ └───────────┘ │
└─────────────────────────────┘
```

**Item Card Actions** (on wishlist grid)
```
┌─────────────────────────┐
│ [IMAGE]            [⋮]  │  ← Three-dot menu
│ Product Name            │
│ $29.99  ̶$̶4̶9̶.̶9̶9̶          │
│ ★★★★☆                   │
│ Added: $35 → $29.99     │
└─────────────────────────┘

Menu options (on tap ⋮):
┌─────────────────┐
│ ✏️ Edit         │
│ ✓ Mark Purchased│
│ 🗑️ Delete       │
└─────────────────┘

Or: Tap anywhere on card → Opens Edit Modal
```

**Budget Page**
```
┌─────────────────────────────┐
│  Budget Suggestions         │
├─────────────────────────────┤
│ Your Budget                 │
│ ┌──────────┐ ┌────────────┐ │
│ │ 100.00   │ │ USD ▼      │ │
│ └──────────┘ └────────────┘ │
│            [Get Suggestions]│
├─────────────────────────────┤
│ Option 1: High Priority     │
│ ┌─────────────────────────┐ │
│ │ • Product A     $29.99  │ │
│ │ • Product B     €41.50  │ │  ← Shows original currency
│ │   (≈$45.00)             │ │  ← With conversion
│ │ ─────────────────────── │ │
│ │ Total: $74.99           │ │  ← All in budget currency
│ │ Remaining: $25.01       │ │
│ │ Priority Score: 9       │ │
│ └─────────────────────────┘ │
│                             │
│ Option 2: Most Items        │
│ ┌─────────────────────────┐ │
│ │ • Product C     $15.00  │ │
│ │ • Product D     ¥2,200  │ │
│ │   (≈$20.00)             │ │
│ │ • Product E     $35.00  │ │
│ │ ─────────────────────── │ │
│ │ Total: $70.00           │ │
│ │ Remaining: $30.00       │ │
│ │ Priority Score: 7       │ │
│ └─────────────────────────┘ │
│                             │
│ Option 3: Best Value        │
│ ┌─────────────────────────┐ │
│ │ (Priority per dollar)   │ │
│ │ ...                     │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│  [Wishlist]  [Budget]       │
└─────────────────────────────┘
```

---

## Key Decisions & Trade-offs

### 1. Google Sheets vs Local SQLite
**Chose: Google Sheets**
- Pro: Easy to view/edit data manually, free, syncs across devices
- Con: Slower API calls, 60 req/min rate limit
- Trade-off acceptable for personal use MVP

### 2. Server-side scraping vs Client-side
**Chose: Server-side (API route)**
- Pro: Avoids CORS issues, can handle JavaScript-rendered pages
- Con: Requires server, can't work fully offline
- Necessary because browsers block cross-origin fetches

### 3. SPA vs Server-rendered pages
**Chose: Next.js App Router (hybrid)**
- Pro: SSR for SEO, client navigation feels fast
- Con: Slightly more complex than pure SPA
- Best of both worlds for PWA

### 4. State management
**Chose: React Query (TanStack Query)**
- Pro: Handles caching, refetching, optimistic updates
- Con: One more dependency
- Worth it for cleaner data fetching logic

---

## Design Decisions (Confirmed)

| Question | Decision |
|----------|----------|
| Offline support | Not required - app needs internet |
| Image storage | URL for scraped items, base64 for pasted images |
| Currency | Multi-currency with live conversion rates |
| Sorting | By priority, price, date added |
| Filtering | By priority level, price range, purchased status |
| Price history | MVP: only "price when added" + "current price" (no chart) |
| Add item modes | URL (auto-scrape) OR manual entry (for offline-only items) |
| Sheet initialization | Auto-create sheets and headers if missing |
| Broken images | Show placeholder (empty image icon) |

---

## Image Handling

### Storage Format
- **Scraped items**: Store image URL string (e.g., `https://images.amazon.com/...`)
- **Manual items**: User can either:
  - Paste an image directly → automatically resized and stored as JPEG base64 data URI
  - Enter an image URL → stored as URL string

### Image Resizing (Pasted Images)
Pasted images are automatically processed client-side before storage:

| Setting | Value |
|---------|-------|
| **Max dimensions** | 320×200px (fit within, preserve aspect ratio) |
| **Output format** | JPEG at 80% quality |
| **Letterbox background** | Gray (`#f3f4f6` / Tailwind gray-100) |
| **Typical output size** | 15-25KB |

```typescript
// lib/imageUtils.ts

import { resizeImage } from '@/lib/imageUtils';

// Resizes image to fit within 320x200, converts to JPEG
const resizedBase64 = await resizeImage(file);
```

### Display Behavior
- **Display mode**: `object-contain` (shows full image, no cropping)
- **Display height**: 200px (unified across mobile and desktop)
- **Letterbox**: Gray background fills empty space for non-matching aspect ratios
- **Lazy loading**: Native `loading="lazy"` for performance

### Detection Logic
```typescript
// lib/imageUtils.ts

function isBase64Image(data: string): boolean {
  return data.startsWith('data:image/');
}

function isImageUrl(data: string): boolean {
  return !isBase64Image(data) && (data.startsWith('http://') || data.startsWith('https://'));
}
```

### Broken Image Fallback
```tsx
// components/ui/ItemImage.tsx

function ItemImage({ src, alt }: { src: string | null; alt: string }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="w-full h-[200px] bg-gray-100 flex items-center justify-center">
        <ImageIcon className="w-12 h-12 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-gray-100 w-full h-[200px]">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full h-full object-contain"
        onError={() => setError(true)}
      />
    </div>
  );
}
```

### Paste Image Handler (for manual items)
```tsx
// Handle paste event in Add/Edit modal

async function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) {
        // Resize to 320x200, convert to JPEG at 80% quality
        const resizedBase64 = await resizeImage(file);
        setImageData(resizedBase64);
      }
      break;
    }
  }
}
```

### Size Considerations
- Pasted images are automatically resized to fit within 320×200px
- Output is JPEG at 80% quality (~15-25KB typical)
- Base64 encoding adds ~33% overhead
- Final size typically ~20-35KB base64 (well under Google Sheets 50K char limit)
- **No manual size limit needed** - resizing handles this automatically
