# Shopping Assistant PWA - Implementation Plan

## Overview
A Progressive Web App (PWA) optimized for iPhone that helps track wishlist items, manage priorities, and get smart budget-based purchase suggestions.

**Mode**: Personal use (single user, no authentication required)

## Tech Stack
| Layer | Technology | Reason |
|-------|------------|--------|
| Framework | Next.js 14+ (App Router) | PWA support, API routes, SSR |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Mobile-first, rapid development |
| Database | **Google Sheets** | Free, easy to view/edit manually, familiar |
| API | Google Sheets API | Read/write spreadsheet data |
| PWA | next-pwa | Service worker, offline support |

*Google Sheets as database: Simple for MVP, can view/edit data in spreadsheet directly.*

### Google Sheets Structure
```
Sheet: "Wishlist"
Columns: ID | Name | URL | CurrentPrice | PriceWhenAdded | OriginalPrice | Currency | ImageData | Priority | IsPurchased | Notes | CreatedAt | LastChecked

Sheet: "Settings"
Columns: Key | Value
Example: baseCurrency | USD
```

**Note:** Sheets and headers are auto-created on first app launch if they don't exist.

## Core Features

### 1. Wishlist Management
- **Two add modes:**
  - URL mode: Paste URL → auto-scrape product details
  - Manual mode: Enter details manually (for offline/local items)
- Store: name, URL, current price, price when added, original price, currency, images
- **Image handling:**
  - Scraped items: store image URL
  - Manual items: paste image directly (stored as base64) or enter URL
  - Broken/invalid images show placeholder
- Priority rating (1-5 stars)
- **Edit items:** Tap item to open edit modal (change name, price, priority, notes, image)
- Mark items as purchased
- Delete items
- Sort by: priority, price, date added
- Filter by: priority level, price range, purchased status

### 2. Multi-Currency Support
- Each item stores its original currency
- Live exchange rate conversion (via free API)
- User sets base currency for display
- All prices converted for comparison/budget

### 3. Budget Suggestions
- Input budget amount + currency
- Algorithm suggests optimal item combinations based on:
  - Priority (higher priority items preferred)
  - Price (converted to budget currency)
- Show 3 strategies: High Priority, Most Items, Best Value

### 4. Price Tracking (Later Phase)
- Cron job checks prices
- Compare current price vs price when added
- Notify on price drops

## Project Structure

```
src/
├── app/
│   ├── (main)/wishlist/     # Main wishlist view
│   ├── (main)/budget/       # Budget suggestions
│   ├── (main)/settings/     # User settings (base currency)
│   ├── api/items/           # CRUD API
│   ├── api/scrape/          # Price/image scraping
│   ├── api/currency/        # Exchange rates
│   ├── api/settings/        # User settings API
│   └── manifest.ts          # PWA config
├── components/
│   ├── wishlist/            # WishlistGrid, WishlistItem, AddItemForm
│   ├── budget/              # BudgetInput, SuggestionsList
│   └── ui/                  # Button, Input, Modal, CurrencySelect
├── lib/
│   ├── sheets.ts            # Google Sheets API client
│   ├── scraper.ts           # URL parsing logic
│   └── currency.ts          # Exchange rate fetching/conversion
└── types/index.ts
```

## Implementation Phases

### Phase 1: MVP (Foundation) - Detailed

Phase 1 establishes the core application with manual item management, Google Sheets integration, and PWA support.

---

#### Step 1.1: Project Setup
**Goal:** Initialize Next.js project with TypeScript and Tailwind CSS

**Tasks:**
1. Create Next.js 14+ project with App Router
2. Configure TypeScript (`tsconfig.json`)
3. Install and configure Tailwind CSS
4. Create `.env.example` with required variables
5. Set up project folder structure

**Files to Create:**
```
ShoppingAssistance/
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── postcss.config.js
├── .env.example
├── .gitignore
├── public/
│   ├── icon-192.png          # PWA icon (placeholder)
│   └── icon-512.png          # PWA icon (placeholder)
└── src/
    └── app/
        ├── globals.css       # Tailwind imports
        └── layout.tsx        # Root layout (minimal)
```

**Environment Variables (.env.example):**
```
GOOGLE_SPREADSHEET_ID=
GOOGLE_SERVICE_ACCOUNT_KEY=
```

**Verification (FR1):**
- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts server on localhost:3000
- [ ] TypeScript compiles without errors
- [ ] Tailwind utility classes work (test with `className="text-red-500"`)

---

#### Step 1.2: TypeScript Types
**Goal:** Define all TypeScript interfaces for the application

**Tasks:**
1. Define `WishlistItem` interface
2. Define `Currency` type
3. Define `UserSettings` interface
4. Define API request/response types

**Files to Create:**
```
src/types/index.ts
```

**Types to Define:**
```typescript
type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'VND' | string;

interface WishlistItem {
  id: string;
  name: string;
  url: string | null;
  currentPrice: number;
  priceWhenAdded: number;
  originalPrice: number | null;
  currency: Currency;
  imageData: string | null;
  priority: 1 | 2 | 3 | 4 | 5;
  isPurchased: boolean;
  notes: string;
  createdAt: string;
  lastChecked: string | null;
}

interface UserSettings {
  baseCurrency: Currency;
}
```

**Verification:**
- [ ] No TypeScript errors in `types/index.ts`
- [ ] Types can be imported in other files

---

#### Step 1.3: Google Sheets Integration
**Goal:** Create Google Sheets client with auto-initialization

**Tasks:**
1. Install `googleapis` package
2. Create sheets client with service account auth
3. Implement `initializeSheets()` - auto-create sheets and headers
4. Implement `getAllItems()` - read all wishlist items
5. Implement `addItem()` - append new item
6. Implement `updateItem()` - update existing item by ID
7. Implement `deleteItem()` - delete item by ID
8. Implement `getSettings()` / `updateSettings()`

**Files to Create:**
```
src/lib/sheets.ts
```

**Key Functions:**
| Function | Description |
|----------|-------------|
| `getClient()` | Initialize Google Sheets API client |
| `ensureInitialized()` | Auto-create sheets/headers if missing |
| `getAllItems()` | Read all items from Wishlist sheet |
| `getItemById(id)` | Get single item by ID |
| `addItem(item)` | Append item to Wishlist sheet |
| `updateItem(id, updates)` | Find and update item row |
| `deleteItem(id)` | Find and delete item row |
| `getSettings()` | Read settings from Settings sheet |
| `updateSettings(settings)` | Update settings row |

**Verification (FR2):**
- [ ] Empty spreadsheet → Wishlist and Settings sheets created
- [ ] Headers auto-created in both sheets
- [ ] Default `baseCurrency=USD` setting created
- [ ] `getAllItems()` returns empty array for new sheet
- [ ] `addItem()` creates row in Google Sheets
- [ ] `updateItem()` modifies correct row
- [ ] `deleteItem()` removes row

---

#### Step 1.4: API Routes - Items CRUD
**Goal:** Create REST API endpoints for wishlist items

**Tasks:**
1. Create `GET /api/items` - list all items
2. Create `POST /api/items` - create new item
3. Create `GET /api/items/[id]` - get single item
4. Create `PUT /api/items/[id]` - update item
5. Create `DELETE /api/items/[id]` - delete item

**Files to Create:**
```
src/app/api/items/route.ts           # GET, POST
src/app/api/items/[id]/route.ts      # GET, PUT, DELETE
```

**API Specifications:**

| Endpoint | Method | Request Body | Response |
|----------|--------|--------------|----------|
| `/api/items` | GET | - | `{ items: WishlistItem[], count: number }` |
| `/api/items` | POST | `{ name, currentPrice, currency, ... }` | `{ item: WishlistItem }` |
| `/api/items/[id]` | GET | - | `{ item: WishlistItem }` |
| `/api/items/[id]` | PUT | `{ name?, currentPrice?, ... }` | `{ item: WishlistItem }` |
| `/api/items/[id]` | DELETE | - | `{ success: true }` |

**POST /api/items Logic:**
1. Validate required fields (name, currentPrice, currency)
2. Generate UUID for id
3. Set `priceWhenAdded = currentPrice`
4. Set `createdAt = new Date().toISOString()`
5. Set `isPurchased = false`
6. Set `priority = 3` if not provided
7. Call `addItem()` to save

**Verification (API Requirements):**
- [ ] `GET /api/items` returns 200 with items array
- [ ] `POST /api/items` with valid data returns 201
- [ ] `POST /api/items` with missing name returns 400
- [ ] `GET /api/items/[id]` with valid ID returns 200
- [ ] `GET /api/items/[id]` with invalid ID returns 404
- [ ] `PUT /api/items/[id]` updates item and returns 200
- [ ] `DELETE /api/items/[id]` removes item and returns 200

---

#### Step 1.5: API Routes - Settings
**Goal:** Create API endpoints for user settings

**Tasks:**
1. Create `GET /api/settings` - get current settings
2. Create `PUT /api/settings` - update settings

**Files to Create:**
```
src/app/api/settings/route.ts        # GET, PUT
```

**Verification (FR12):**
- [ ] `GET /api/settings` returns `{ baseCurrency: "USD" }`
- [ ] `PUT /api/settings` with `{ baseCurrency: "EUR" }` updates setting
- [ ] Setting persists in Google Sheets

---

#### Step 1.6: Basic UI Components
**Goal:** Create reusable UI components

**Tasks:**
1. Create Button component
2. Create Input component
3. Create Modal component
4. Create StarRating component (display + interactive)
5. Create ItemImage component (with fallback)
6. Create CurrencySelect component

**Files to Create:**
```
src/components/ui/Button.tsx
src/components/ui/Input.tsx
src/components/ui/Modal.tsx
src/components/ui/StarRating.tsx
src/components/ui/ItemImage.tsx
src/components/ui/CurrencySelect.tsx
```

**Component Specifications:**

| Component | Props | Behavior |
|-----------|-------|----------|
| `Button` | `variant?, size?, disabled?, onClick, children` | Primary/secondary styles, loading state |
| `Input` | `label?, type, value, onChange, error?, placeholder?` | Text/number input with label and error |
| `Modal` | `isOpen, onClose, title, children` | Overlay modal with close button |
| `StarRating` | `value: 1-5, onChange?, readonly?` | 5 stars, clickable if not readonly |
| `ItemImage` | `src: string \| null, alt` | Image with onError fallback to placeholder |
| `CurrencySelect` | `value, onChange` | Dropdown: USD, EUR, GBP, JPY, AUD, CAD, VND |

**Verification (UI Requirements):**
- [ ] Button renders with correct styles
- [ ] Input shows label and handles onChange
- [ ] Modal opens/closes correctly
- [ ] StarRating displays correct stars, clickable changes value
- [ ] ItemImage shows placeholder on error/null
- [ ] CurrencySelect shows dropdown options

---

#### Step 1.7: Wishlist Components
**Goal:** Create wishlist-specific components

**Tasks:**
1. Create WishlistItem card component
2. Create WishlistGrid component
3. Create AddItemModal component (manual mode only for Phase 1)
4. Create EditItemModal component

**Files to Create:**
```
src/components/wishlist/WishlistItem.tsx
src/components/wishlist/WishlistGrid.tsx
src/components/wishlist/AddItemModal.tsx
src/components/wishlist/EditItemModal.tsx
```

**WishlistItem Display:**
- Image (or placeholder)
- Name
- Current price with currency symbol
- Original price (strikethrough) if exists
- Priority stars
- "Price when added → Current" comparison
- "Manual" badge if url is null
- Purchased state (grayed out + checkmark)

**AddItemModal (Manual Mode):**
- Name input (required)
- Price input (required)
- Currency select (required)
- Original price input (optional)
- Image paste area or URL input (optional)
- Priority star selector (default 3)
- Notes textarea (optional)
- Save button

**EditItemModal:**
- Same fields as AddItemModal
- Pre-filled with current values
- "Mark as Purchased" checkbox
- Delete button
- Save button

**Verification (FR3, FR4, FR5):**
- [ ] WishlistItem displays all required info
- [ ] WishlistItem shows placeholder for missing image
- [ ] WishlistItem shows "Manual" badge for url=null items
- [ ] AddItemModal opens and closes
- [ ] AddItemModal validates required fields
- [ ] AddItemModal saves item successfully
- [ ] EditItemModal pre-fills current values
- [ ] EditItemModal saves changes
- [ ] EditItemModal delete works

---

#### Step 1.8: Wishlist Page
**Goal:** Create main wishlist page with full functionality

**Tasks:**
1. Create wishlist page layout
2. Fetch and display items from API
3. Add "+" button to open AddItemModal
4. Handle item tap to open EditItemModal
5. Implement loading and empty states
6. Implement error handling

**Files to Create:**
```
src/app/(main)/wishlist/page.tsx
src/app/(main)/layout.tsx            # Shared layout with bottom nav
```

**Page Layout:**
```
┌─────────────────────────────┐
│  Shopping Assistant    [+]  │  ← Header
├─────────────────────────────┤
│ (Sort/Filter - Phase 1.9)   │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ [WishlistItem]          │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ [WishlistItem]          │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│  [Wishlist]  [Budget]       │  ← Bottom nav (Budget disabled in Phase 1)
└─────────────────────────────┘
```

**Verification (FR3):**
- [ ] Page loads and fetches items from API
- [ ] Items display in grid
- [ ] "+" button opens AddItemModal
- [ ] Tap item opens EditItemModal
- [ ] Empty state shows "No items yet" message
- [ ] Loading state shows spinner
- [ ] Error state shows error message

---

#### Step 1.9: Sort and Filter
**Goal:** Add sorting and filtering to wishlist

**Tasks:**
1. Create sort dropdown (priority, price low/high, date added)
2. Create filter panel (priority checkboxes, price range, status)
3. Apply sort/filter to items list
4. Show filter count indicator

**Files to Create/Update:**
```
src/components/wishlist/SortDropdown.tsx
src/components/wishlist/FilterPanel.tsx
src/app/(main)/wishlist/page.tsx     # Update to include sort/filter
```

**Sort Options:**
- Priority (High → Low)
- Price (Low → High)
- Price (High → Low)
- Date Added (Newest)

**Filter Options:**
- Priority: Checkboxes for 1-5 stars
- Price Range: Min/Max inputs
- Status: Active / Purchased

**Verification (FR9):**
- [ ] Sort by priority shows highest first
- [ ] Sort by price works correctly
- [ ] Filter by priority shows only selected levels
- [ ] Filter by price range works
- [ ] Filter by status works
- [ ] Reset clears all filters
- [ ] Active filter count shown on button

---

#### Step 1.10: PWA Configuration
**Goal:** Configure app as installable PWA

**Tasks:**
1. Create web manifest
2. Add Apple-specific meta tags
3. Configure next-pwa for service worker
4. Create placeholder icons

**Files to Create/Update:**
```
src/app/manifest.ts
src/app/layout.tsx                   # Add PWA meta tags
next.config.js                       # Add next-pwa config
public/icon-192.png
public/icon-512.png
```

**Manifest Configuration:**
```typescript
{
  name: 'Shopping Assistant',
  short_name: 'ShopAssist',
  description: 'Track wishlist and budget smartly',
  start_url: '/wishlist',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#2563eb',
  icons: [...]
}
```

**Verification (FR11):**
- [ ] Manifest loads at `/manifest.json` or via `manifest.ts`
- [ ] Service worker registers
- [ ] "Add to Home Screen" available on iOS Safari
- [ ] App opens in standalone mode from home screen

---

#### Step 1.11: Settings Page
**Goal:** Create settings page for base currency

**Tasks:**
1. Create settings page
2. Add base currency selector
3. Save settings to API
4. Update bottom navigation

**Files to Create:**
```
src/app/(main)/settings/page.tsx
src/components/layout/BottomNav.tsx  # Update with settings link
```

**Verification (FR12):**
- [ ] Settings page accessible
- [ ] Base currency dropdown works
- [ ] Saving updates Google Sheets
- [ ] Setting persists after reload

---

#### Step 1.12: Currency Conversion (Basic)
**Goal:** Add basic currency display (full conversion in Phase 2)

**Tasks:**
1. Create currency utility functions
2. Display currency symbols correctly
3. Prepare for exchange rate integration

**Files to Create:**
```
src/lib/currency.ts
```

**Functions:**
```typescript
getCurrencySymbol(currency: Currency): string
formatPrice(amount: number, currency: Currency): string
```

**Verification (FR8 partial):**
- [ ] Prices display with correct currency symbol
- [ ] Format handles different currencies (USD, EUR, JPY, etc.)

---

#### Step 1.13: Root Page & Navigation
**Goal:** Set up app entry point and navigation

**Tasks:**
1. Create root page that redirects to /wishlist
2. Create bottom navigation component
3. Style active/inactive nav states

**Files to Create/Update:**
```
src/app/page.tsx
src/components/layout/BottomNav.tsx
src/components/layout/Header.tsx
```

**Verification:**
- [ ] Visiting `/` redirects to `/wishlist`
- [ ] Bottom nav shows Wishlist, Budget, Settings
- [ ] Active tab highlighted
- [ ] Budget tab works (shows "Coming soon" for Phase 1)

---

### Phase 1 Completion Checklist

Before moving to Phase 2, verify all Phase 1 requirements:

**Setup**
- [ ] Project runs with `npm run dev`
- [ ] No TypeScript errors
- [ ] No console errors

**Google Sheets**
- [ ] Auto-creates sheets and headers
- [ ] CRUD operations work

**API**
- [ ] All item endpoints work (GET, POST, PUT, DELETE)
- [ ] Settings endpoints work

**UI**
- [ ] Wishlist displays items
- [ ] Add item (manual) works
- [ ] Edit item works
- [ ] Delete item works
- [ ] Sort works
- [ ] Filter works
- [ ] Images display (with fallback)

**PWA**
- [ ] Installable on iPhone
- [ ] Opens in standalone mode

**Settings**
- [ ] Base currency can be changed
- [ ] Setting persists

---

### Phase 2: Auto-Scraping
1. Create `/api/scrape` endpoint
2. Implement generic parser (JSON-LD, OpenGraph)
3. Add site-specific parsers (Amazon, etc.)
4. Update AddItemModal with "From URL" tab
5. Handle scraping errors gracefully
6. Integrate exchange rate API for live conversion

### Phase 3: Budget Suggestions
1. Create `/api/budget` endpoint
2. Implement 3 suggestion algorithms
3. Create Budget page UI
4. Display suggestion cards

### Phase 4: Price Tracking - Detailed

Phase 4 implements automated price checking via GitHub Actions cron, with in-app price change indicators.

---

#### Step 4.1: Data Model Updates
**Goal:** Add `previousPrice` field to track price before last check

**Tasks:**
1. Add `PriceCheckResult` and `PriceCheckSummary` types to `src/types/index.ts`
2. Add `previousPrice` field to `WishlistItem` interface
3. Add column O (PreviousPrice) to Google Sheets schema

**Verification:**
- [x] Types compile without errors
- [x] New column added to WISHLIST_HEADERS

---

#### Step 4.2: Google Sheets Integration Updates
**Goal:** Support reading/writing previousPrice and price check operations

**Tasks:**
1. Update `WISHLIST_HEADERS` to include PreviousPrice
2. Update `rowToItem()` to parse column O
3. Update `getAllItems()` range to A2:O
4. Add `getItemsForPriceCheck()` - returns URL-based, unpurchased items
5. Add `updateItemAfterPriceCheck()` - batch update price, lastChecked, previousPrice

**Verification:**
- [x] New functions exported from sheets.ts
- [x] Existing items still load correctly

---

#### Step 4.3: Price Checker Module
**Goal:** Core price checking logic with rate limiting

**File:** `src/lib/priceChecker.ts`

**Tasks:**
1. Implement `checkItemPrice()` - scrape single item, compare prices
2. Implement `checkAllPrices()` - iterate all eligible items with delay
3. Apply 1% threshold for significant price changes
4. Update Google Sheets on price change

**Verification:**
- [x] Module exports `checkAllPrices()` function
- [x] Rate limiting (3s delay) between requests

---

#### Step 4.4: Price Check API Endpoint
**Goal:** Protected API endpoint for triggering price checks

**File:** `src/app/api/price-check/route.ts`

**Tasks:**
1. Create POST endpoint with Bearer token auth (CRON_SECRET)
2. Call `checkAllPrices()` and return summary
3. Support GET for compatibility

**Verification:**
- [x] Returns 401 without valid auth
- [x] Returns 200 with summary on success

---

#### Step 4.5: GitHub Actions Workflow
**Goal:** Automated daily price checking

**File:** `.github/workflows/price-check.yml`

**Tasks:**
1. Cron schedule: daily at 8:00 UTC
2. Manual trigger via workflow_dispatch
3. Call API endpoint with CRON_SECRET
4. Generate job summary

**Required Secrets:**
- `VERCEL_APP_URL` - Deployed app URL
- `CRON_SECRET` - Same as in Vercel env vars

**Verification:**
- [x] Workflow file created
- [x] Manual trigger works from GitHub UI

---

#### Step 4.6: UI Updates
**Goal:** Display price changes and last checked timestamp

**File:** `src/components/wishlist/WishlistItem.tsx`

**Tasks:**
1. Add `PriceChangeFromOriginal` component (green/red arrows with %)
2. Add `formatTimeAgo()` helper for relative time
3. Show "Checked Xh/Xd ago" for URL-based items (large view)

**Verification:**
- [x] Price drops show green down arrow
- [x] Price increases show red up arrow
- [x] Last checked timestamp displays

---

#### Step 4.7: Environment Updates
**Goal:** Document required environment variables

**Tasks:**
1. Add `CRON_SECRET` to `.env.example`

**Verification:**
- [x] .env.example updated

---

### Phase 4 Completion Checklist

- [x] Types added (PriceCheckResult, PriceCheckSummary)
- [x] WishlistItem has previousPrice field
- [x] Google Sheets column O (PreviousPrice) supported
- [x] getItemsForPriceCheck() and updateItemAfterPriceCheck() functions
- [x] priceChecker.ts module with rate limiting
- [x] POST /api/price-check endpoint with auth
- [x] GitHub Actions workflow with cron schedule
- [x] UI shows price change indicators
- [x] UI shows last checked timestamp
- [x] CRON_SECRET in .env.example

---

## Future Improvements (from Code Review)

Technical debt and improvements identified during PR #1 review. Address these in future iterations.

### High Priority

#### 0. iOS Push Notifications for Price Drops
**Status:** Planned for future release

**Current behavior:** Price drop alerts shown in-app only (user must open the app to see them).

**Goal:** Send push notifications to iOS when significant price drops are detected.

**Requirements:**
- iOS 16.4+ for PWA push notification support
- Web Push API implementation
- VAPID key generation and storage
- Service worker push event handler
- Notification permission request in Settings
- Backend logic to trigger push on price drops (>5%)

**Implementation tasks:**
1. Generate VAPID keys and add to environment variables
2. Update service worker to handle push events
3. Create `/api/push/subscribe` endpoint for subscription management
4. Store push subscriptions in a new Google Sheets tab
5. Update `checkAllPrices()` to send push notifications for price drops
6. Add notification permission UI in Settings page
7. Add `web-push` npm package dependency

**Considerations:**
- Only available for PWAs added to home screen
- User must grant notification permission
- Need to handle subscription expiration
- Consider notification throttling to avoid spam

---

#### 1. Fix Race Condition in Google Sheets Initialization
**File:** `src/lib/sheets.ts:120-125`

**Problem:** If multiple requests arrive simultaneously, `initializeSheets()` could run multiple times before `initialized` is set to `true`.

```typescript
// Current (problematic)
let initialized = false;
async function ensureInitialized(): Promise<void> {
  if (!initialized) {
    await initializeSheets();
    initialized = true;
  }
}
```

**Solution:** Use a promise-based singleton pattern:
```typescript
let initPromise: Promise<void> | null = null;

async function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = initializeSheets();
  }
  return initPromise;
}
```

#### 2. Add Rate Limiting to Scraper
**File:** `src/app/api/scrape/route.ts`

**Problem:** No rate limiting on scraper endpoint could lead to:
- Being blocked by target sites
- Potential abuse if exposed publicly

**Solution:**
- Implement request throttling (e.g., max 10 requests per minute)
- Consider using a queue for scraping requests
- Add caching for recently scraped URLs

#### 3. SSRF Protection for Scraper
**File:** `src/lib/scraper.ts`

**Problem:** The scraper fetches arbitrary URLs from user input.

**Solution:**
- Validate URLs against allowlisted domains (optional)
- Block internal/private IP ranges
- Consider using a proxy service for scraping

---

### Medium Priority

#### 4. Optimize `getItemById()` Query
**File:** `src/lib/sheets.ts:183-187`

**Problem:** Currently fetches ALL items just to find one by ID.

```typescript
// Current (inefficient)
export async function getItemById(id: string): Promise<WishlistItem | null> {
  const items = await getAllItems();
  return items.find((item) => item.id === id) || null;
}
```

**Solution:** Query only the ID column first, then fetch the specific row:
```typescript
export async function getItemById(id: string): Promise<WishlistItem | null> {
  const sheets = getClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A:A`,
  });

  const rowIndex = response.data.values?.findIndex(row => row[0] === id);
  if (rowIndex === -1 || rowIndex === undefined) return null;

  // Fetch only that row
  const rowData = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A${rowIndex + 1}:M${rowIndex + 1}`,
  });

  return rowData.data.values ? rowToItem(rowData.data.values[0]) : null;
}
```

#### 5. Add Optimistic UI Updates
**File:** `src/app/(main)/wishlist/page.tsx`

**Problem:** UI waits for API response before updating, causing perceived slowness.

**Solution:** Update UI immediately, rollback on error:
```typescript
const handleAddItem = async (item: CreateItemRequest) => {
  // Optimistic update
  const tempId = `temp-${Date.now()}`;
  const optimisticItem = { ...item, id: tempId } as WishlistItem;
  setItems(prev => [optimisticItem, ...prev]);

  try {
    const response = await fetch('/api/items', { ... });
    const data = await response.json();
    // Replace temp item with real item
    setItems(prev => prev.map(i => i.id === tempId ? data.item : i));
  } catch {
    // Rollback on error
    setItems(prev => prev.filter(i => i.id !== tempId));
    // Show error toast
  }
};
```

#### 6. Validate Image Size for URL Images
**File:** `src/components/wishlist/AddItemModal.tsx`

**Problem:** 35KB limit enforced for pasted images but not for URL images. Large base64 strings could exceed Google Sheets cell limits (50,000 characters).

**Solution:**
- For URL images: store URL only (current behavior is fine)
- For base64 images: compress/resize before storing
- Add server-side validation in POST /api/items

#### 7. Add Pagination for Large Wishlists
**File:** `src/lib/sheets.ts`, `src/app/api/items/route.ts`

**Problem:** `getAllItems()` returns everything, which may become slow with many items.

**Solution:** Add pagination support:
```typescript
// API: GET /api/items?page=1&limit=20
export async function getAllItems(page = 1, limit = 50): Promise<{
  items: WishlistItem[];
  total: number;
  hasMore: boolean;
}> {
  // Implementation with range calculation
}
```

#### 8. Add Headless Browser for Bot-Protected Sites
**File:** `src/lib/scraper.ts`, `src/app/api/scrape/route.ts`

**Problem:** Many e-commerce sites (Douglas, Amazon, etc.) use bot protection (Akamai, Cloudflare) that blocks server-side HTTP requests, returning 400/403 errors.

**Current behavior:** Shows user-friendly error message suggesting manual entry.

**Solution:** Use a headless browser (Puppeteer/Playwright) to bypass JavaScript-based bot protection:
```typescript
// Option A: Self-hosted Puppeteer (complex, resource-intensive)
import puppeteer from 'puppeteer';

async function scrapeWithBrowser(url: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });
  const html = await page.content();
  await browser.close();
  return html;
}

// Option B: Use a scraping service API (simpler, has costs)
// - ScraperAPI, Browserless, Apify
```

**Considerations:**
- Puppeteer requires Chromium binary (~400MB), increases Vercel deployment size
- May need Vercel Pro or dedicated server for resource limits
- Third-party scraping APIs have per-request costs
- Could implement as fallback only when regular fetch fails with 400/403

---

### Low Priority

#### 8. Replace console.error with Proper Logging
**Files:** Multiple API routes

**Problem:** `console.error()` used in production code.

**Solution:**
- Use a logging library (e.g., pino, winston)
- Configure log levels for dev vs production
- Consider error tracking service (e.g., Sentry)

#### 9. Make Currency List Configurable
**File:** `src/components/ui/CurrencySelect.tsx`

**Problem:** Hardcoded currency list.

**Solution:** Move to a config file or fetch from settings.

#### 10. Reconsider `userScalable: false`
**File:** `src/app/layout.tsx:21`

**Problem:** Disabling user scaling is an accessibility issue for users who need to zoom.

**Solution:** Remove or set to `true`:
```typescript
export const viewport: Viewport = {
  // ...
  userScalable: true, // Allow accessibility zoom
};
```

---

### Test Coverage (Missing)

No tests were included in Phase 1. Add tests in a future iteration:

#### Unit Tests
- [ ] `src/lib/sheets.ts` - CRUD operations (mock Google API)
- [ ] `src/lib/scraper.ts` - Price parsing, currency detection
- [ ] `src/lib/currency.ts` - Formatting functions

#### Integration Tests
- [ ] API routes - Test all endpoints with mock data
- [ ] Error handling - Test 400, 404, 500 responses

#### Component Tests
- [ ] `AddItemModal` - Form validation, submission
- [ ] `EditItemModal` - Pre-fill, save, delete
- [ ] `WishlistGrid` - Empty state, item display
- [ ] `FilterPanel` - Filter application

#### E2E Tests (Optional)
- [ ] Add item flow (manual)
- [ ] Add item flow (URL scrape)
- [ ] Edit and delete item
- [ ] Sort and filter

---

## Scraping Strategy
1. Parse URL → identify retailer
2. Try structured data (JSON-LD schema.org/Product)
3. Fall back to OpenGraph meta tags
4. Fall back to site-specific selectors
5. Use scraping API (ScraperAPI) for JavaScript-heavy sites

## PWA for iPhone
- Manifest with proper icons and splash screens
- `display: standalone` for native-like feel
- Service worker for offline caching
- Apple-specific meta tags for iOS

## Verification Plan
1. **Local testing**: Run `npm run dev`, test on localhost
2. **Mobile testing**: Access dev server from iPhone, install PWA
3. **Scraping test**: Add real product URLs, verify data extraction
4. **Budget test**: Add items with prices/priorities, verify suggestions
5. **Deploy**: Vercel deployment, test production PWA install

## Files to Create (Phase 1)

### Step 1.1: Project Setup
| File | Purpose |
|------|---------|
| `package.json` | Dependencies (next, googleapis, tailwindcss) |
| `next.config.js` | Next.js configuration |
| `tailwind.config.js` | Tailwind CSS configuration |
| `tsconfig.json` | TypeScript configuration |
| `postcss.config.js` | PostCSS for Tailwind |
| `.env.example` | Environment variable template |
| `.gitignore` | Git ignore patterns |
| `public/icon-192.png` | PWA icon 192x192 |
| `public/icon-512.png` | PWA icon 512x512 |
| `src/app/globals.css` | Global styles + Tailwind imports |

### Step 1.2: Types
| File | Purpose |
|------|---------|
| `src/types/index.ts` | All TypeScript interfaces |

### Step 1.3: Google Sheets
| File | Purpose |
|------|---------|
| `src/lib/sheets.ts` | Google Sheets API client + CRUD |

### Step 1.4-1.5: API Routes
| File | Purpose |
|------|---------|
| `src/app/api/items/route.ts` | GET all, POST new item |
| `src/app/api/items/[id]/route.ts` | GET, PUT, DELETE single item |
| `src/app/api/settings/route.ts` | GET, PUT settings |

### Step 1.6: UI Components
| File | Purpose |
|------|---------|
| `src/components/ui/Button.tsx` | Reusable button |
| `src/components/ui/Input.tsx` | Text/number input with label |
| `src/components/ui/Modal.tsx` | Modal overlay |
| `src/components/ui/StarRating.tsx` | 1-5 star rating |
| `src/components/ui/ItemImage.tsx` | Image with fallback |
| `src/components/ui/CurrencySelect.tsx` | Currency dropdown |

### Step 1.7: Wishlist Components
| File | Purpose |
|------|---------|
| `src/components/wishlist/WishlistItem.tsx` | Single item card |
| `src/components/wishlist/WishlistGrid.tsx` | Grid of items |
| `src/components/wishlist/AddItemModal.tsx` | Add item form |
| `src/components/wishlist/EditItemModal.tsx` | Edit item form |

### Step 1.8-1.9: Pages & Sort/Filter
| File | Purpose |
|------|---------|
| `src/app/(main)/layout.tsx` | Layout with bottom nav |
| `src/app/(main)/wishlist/page.tsx` | Wishlist page |
| `src/components/wishlist/SortDropdown.tsx` | Sort options |
| `src/components/wishlist/FilterPanel.tsx` | Filter options |

### Step 1.10: PWA
| File | Purpose |
|------|---------|
| `src/app/manifest.ts` | PWA manifest |
| `src/app/layout.tsx` | Root layout with meta tags |

### Step 1.11-1.13: Settings & Navigation
| File | Purpose |
|------|---------|
| `src/app/(main)/settings/page.tsx` | Settings page |
| `src/app/page.tsx` | Root redirect to /wishlist |
| `src/components/layout/BottomNav.tsx` | Bottom navigation |
| `src/components/layout/Header.tsx` | App header |
| `src/lib/currency.ts` | Currency formatting utilities |

### Total Files: 32

## Google Sheets Setup (One-time)
1. Create a Google Cloud project
2. Enable Google Sheets API
3. Create service account credentials
4. Create an empty Google Spreadsheet
5. Share the spreadsheet with the service account email
6. Store credentials and spreadsheet ID in `.env.local`

**Note:** The app will automatically create the required sheets (`Wishlist`, `Settings`) and headers on first launch. You only need to provide an empty spreadsheet.
