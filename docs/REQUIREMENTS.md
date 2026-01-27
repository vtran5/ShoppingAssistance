# Shopping Assistant - Requirements Document

This document defines all requirements for the Shopping Assistant MVP. Each requirement includes acceptance criteria that can be used to verify implementation.

---

## Table of Contents
1. [Functional Requirements](#functional-requirements)
   - [FR1: Project Setup](#fr1-project-setup)
   - [FR2: Google Sheets Integration](#fr2-google-sheets-integration)
   - [FR3: Wishlist Management](#fr3-wishlist-management)
   - [FR4: Item Addition](#fr4-item-addition)
   - [FR5: Item Editing](#fr5-item-editing)
   - [FR6: Item Deletion](#fr6-item-deletion)
   - [FR7: Image Handling](#fr7-image-handling)
   - [FR8: Multi-Currency Support](#fr8-multi-currency-support)
   - [FR9: Sorting and Filtering](#fr9-sorting-and-filtering)
   - [FR10: Budget Suggestions](#fr10-budget-suggestions)
   - [FR11: PWA Configuration](#fr11-pwa-configuration)
   - [FR12: User Settings](#fr12-user-settings)
2. [Non-Functional Requirements](#non-functional-requirements)
3. [API Requirements](#api-requirements)
4. [Data Requirements](#data-requirements)
5. [UI Requirements](#ui-requirements)

---

## Functional Requirements

### FR1: Project Setup

**Description:** Initialize the project with required dependencies and configuration.

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR1.1 | Next.js 14+ with App Router | `npx next --version` shows 14.x or higher |
| FR1.2 | TypeScript configured | `tsconfig.json` exists, `.tsx` files compile without errors |
| FR1.3 | Tailwind CSS configured | `tailwind.config.js` exists, utility classes apply styles |
| FR1.4 | Environment variables | `.env.example` lists all required variables |
| FR1.5 | Development server runs | `npm run dev` starts server on localhost:3000 |

**Required Environment Variables:**
```
GOOGLE_SPREADSHEET_ID=
GOOGLE_SERVICE_ACCOUNT_KEY=
EXCHANGE_RATE_API_URL=
```

---

### FR2: Google Sheets Integration

**Description:** Connect to Google Sheets as the database backend.

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR2.1 | Connect to Google Sheets API | API client initializes without error using service account |
| FR2.2 | Auto-create Wishlist sheet | If sheet doesn't exist, create it on first request |
| FR2.3 | Auto-create Settings sheet | If sheet doesn't exist, create it on first request |
| FR2.4 | Auto-create headers | If headers missing, add them: ID, Name, URL, CurrentPrice, PriceWhenAdded, OriginalPrice, Currency, ImageData, Priority, IsPurchased, Notes, CreatedAt, LastChecked |
| FR2.5 | Default settings | Create default `baseCurrency=USD` if Settings sheet is empty |
| FR2.6 | Read items | Fetch all rows from Wishlist sheet (excluding header) |
| FR2.7 | Write item | Append new row to Wishlist sheet |
| FR2.8 | Update item | Find row by ID and update values |
| FR2.9 | Delete item | Find row by ID and remove entire row |

**Verification Steps:**
1. Start app with empty spreadsheet → sheets and headers created
2. Add item → row appears in Google Sheets
3. Edit item → row updates in Google Sheets
4. Delete item → row removed from Google Sheets

---

### FR3: Wishlist Management

**Description:** Display and manage wishlist items.

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR3.1 | Display all items | All items from database shown in grid layout |
| FR3.2 | Show item details | Each card shows: image, name, current price, original price (strikethrough), priority stars, price change (added → current) |
| FR3.3 | Show converted price | If item currency differs from base currency, show converted price in parentheses |
| FR3.4 | Manual item badge | Items with `url=null` show "Manual" badge |
| FR3.5 | Purchased items | Purchased items visually distinct (e.g., grayed out, checkmark) |
| FR3.6 | Empty state | Show helpful message when wishlist is empty |
| FR3.7 | Loading state | Show loading indicator while fetching items |
| FR3.8 | Error state | Show error message if fetch fails |

**Verification Steps:**
1. Empty wishlist → shows "No items yet" message
2. Add items with different currencies → converted prices shown
3. Add manual item → "Manual" badge visible
4. Mark item purchased → visual change applied

---

### FR4: Item Addition

**Description:** Add items to wishlist via URL or manual entry.

#### FR4.1: URL Mode

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR4.1.1 | URL input field | Text input accepts URL |
| FR4.1.2 | Fetch button | "Fetch Details" button triggers scraping |
| FR4.1.3 | Loading state | Show spinner while scraping |
| FR4.1.4 | Auto-fill fields | After scrape: name, price, currency, image auto-populated |
| FR4.1.5 | Editable results | User can modify auto-filled values before saving |
| FR4.1.6 | Scrape error handling | Show error message if scraping fails, allow manual entry |

#### FR4.2: Manual Mode

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR4.2.1 | Tab toggle | Switch between "From URL" and "Manual Entry" tabs |
| FR4.2.2 | Required fields | Name and Price are required |
| FR4.2.3 | Currency selector | Dropdown to select currency |
| FR4.2.4 | Optional fields | Original price, image, notes are optional |
| FR4.2.5 | Image paste | Can paste image from clipboard |
| FR4.2.6 | Image URL | Can enter image URL manually |
| FR4.2.7 | Priority selector | 1-5 star rating, default is 3 |
| FR4.2.8 | Save button | Saves item to database |
| FR4.2.9 | Validation | Show error if required fields empty |
| FR4.2.10 | Success feedback | Close modal and show new item in grid |

#### FR4.3: Data Storage

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR4.3.1 | Generate UUID | Each item gets unique ID |
| FR4.3.2 | Set priceWhenAdded | `priceWhenAdded = currentPrice` at creation |
| FR4.3.3 | Set createdAt | ISO timestamp of creation |
| FR4.3.4 | URL items set lastChecked | `lastChecked = createdAt` for URL items |
| FR4.3.5 | Manual items null lastChecked | `lastChecked = null` for manual items |
| FR4.3.6 | Default isPurchased | `isPurchased = false` |

**Verification Steps:**
1. Paste Amazon URL → details auto-filled
2. Switch to Manual tab → all fields editable
3. Submit without name → validation error shown
4. Submit valid form → item appears in grid
5. Check Google Sheets → row has correct data

---

### FR5: Item Editing

**Description:** Edit existing wishlist items.

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR5.1 | Open edit modal | Tap item card → opens edit modal with current values |
| FR5.2 | Show image preview | Current image displayed at top of modal |
| FR5.3 | Editable fields | Can edit: name, currentPrice, originalPrice, priority, notes, image |
| FR5.4 | URL read-only | URL field disabled for scraped items |
| FR5.5 | Change image | Can paste new image or change URL |
| FR5.6 | Mark purchased | Checkbox to toggle isPurchased |
| FR5.7 | Save changes | Save button updates database |
| FR5.8 | Cancel | X button closes modal without saving |
| FR5.9 | Delete option | Delete button available in edit modal |

**Verification Steps:**
1. Tap item → modal opens with correct data
2. Change priority → save → grid updates
3. Paste new image → save → new image shown
4. Check "Mark as Purchased" → save → item styled as purchased
5. Check Google Sheets → row updated

---

### FR6: Item Deletion

**Description:** Remove items from wishlist.

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR6.1 | Delete button | Delete button in edit modal |
| FR6.2 | Confirmation | Confirm dialog before deletion |
| FR6.3 | Remove from database | Item removed from Google Sheets |
| FR6.4 | Remove from UI | Item disappears from grid |
| FR6.5 | Success feedback | Toast/message confirms deletion |

**Verification Steps:**
1. Click delete → confirmation dialog appears
2. Confirm → item removed from grid
3. Check Google Sheets → row deleted

---

### FR7: Image Handling

**Description:** Handle images for wishlist items.

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR7.1 | Display URL images | Images from URLs render correctly |
| FR7.2 | Display base64 images | Pasted images (base64) render correctly |
| FR7.3 | Broken URL fallback | If image URL fails to load, show placeholder |
| FR7.4 | No image placeholder | Items without image show placeholder icon |
| FR7.5 | Paste detection | Detect image paste from clipboard |
| FR7.6 | Convert to base64 | Pasted images converted to base64 data URI |
| FR7.7 | Size limit warning | Warn if pasted image exceeds ~35KB |

**Verification Steps:**
1. Add item with image URL → image displays
2. Paste screenshot in manual mode → image displays
3. Add item with broken URL → placeholder shown
4. Add item without image → placeholder shown

---

### FR8: Multi-Currency Support

**Description:** Support multiple currencies with live conversion.

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR8.1 | Currency selection | Dropdown with common currencies (USD, EUR, GBP, JPY, AUD, CAD, VND, etc.) |
| FR8.2 | Store original currency | Item's currency saved to database |
| FR8.3 | Fetch exchange rates | Call exchange rate API |
| FR8.4 | Cache rates | Cache rates for 1 hour |
| FR8.5 | Convert prices | Convert item prices to base currency for display |
| FR8.6 | Show both prices | Display original price + converted price |
| FR8.7 | Base currency setting | User can change base currency in settings |
| FR8.8 | Handle API failure | If rate API fails, show prices in original currency only |

**Verification Steps:**
1. Add item in EUR → shows EUR price + USD equivalent
2. Change base currency to EUR → all prices converted to EUR
3. Disconnect network → API failure handled gracefully

---

### FR9: Sorting and Filtering

**Description:** Sort and filter wishlist items.

#### FR9.1: Sorting

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR9.1.1 | Sort dropdown | Dropdown with sort options |
| FR9.1.2 | Sort by priority | Highest priority first (5→1) |
| FR9.1.3 | Sort by price (low) | Lowest price first (in base currency) |
| FR9.1.4 | Sort by price (high) | Highest price first (in base currency) |
| FR9.1.5 | Sort by date added | Newest first |
| FR9.1.6 | Persist sort | Remember sort preference |

#### FR9.2: Filtering

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR9.2.1 | Filter button | Opens filter panel |
| FR9.2.2 | Filter by priority | Checkboxes for each priority level (1-5) |
| FR9.2.3 | Filter by price range | Min/max price inputs (in base currency) |
| FR9.2.4 | Filter by status | Active / Purchased toggle |
| FR9.2.5 | Apply filters | Apply button updates grid |
| FR9.2.6 | Reset filters | Reset button clears all filters |
| FR9.2.7 | Filter indicator | Show active filter count on button |

**Verification Steps:**
1. Sort by priority → highest priority items first
2. Filter by priority 5 only → only 5-star items shown
3. Set price range $10-$50 → only items in range shown
4. Filter purchased → only purchased items shown
5. Reset → all items shown

---

### FR10: Budget Suggestions

**Description:** Suggest items to buy based on budget.

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR10.1 | Budget input | Number input for budget amount |
| FR10.2 | Currency selector | Select budget currency |
| FR10.3 | Get suggestions button | Triggers calculation |
| FR10.4 | Strategy 1: High Priority | Suggest highest priority items that fit budget |
| FR10.5 | Strategy 2: Most Items | Suggest most items (cheapest first) that fit budget |
| FR10.6 | Strategy 3: Best Value | Suggest best priority-per-dollar items |
| FR10.7 | Show 3 suggestions | Display up to 3 different suggestions |
| FR10.8 | Suggestion details | Each suggestion shows: items list, total cost, remaining budget, priority score |
| FR10.9 | Convert prices | All prices converted to budget currency |
| FR10.10 | Exclude purchased | Don't include purchased items |
| FR10.11 | Handle empty | Show message if no items fit budget |

**Verification Steps:**
1. Enter $100 budget with items totaling $200 → valid suggestions shown
2. Enter $10 budget with cheapest item $20 → "No items fit budget" message
3. All items purchased → "No unpurchased items" message
4. Check suggestions use correct conversion rates

---

### FR11: PWA Configuration

**Description:** Configure app as Progressive Web App for iPhone.

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR11.1 | Web manifest | `/manifest.json` or `manifest.ts` exists |
| FR11.2 | App name | `name: "Shopping Assistant"`, `short_name: "ShopAssist"` |
| FR11.3 | Display mode | `display: "standalone"` |
| FR11.4 | Theme color | Theme color defined |
| FR11.5 | Icons | 192x192 and 512x512 PNG icons |
| FR11.6 | Apple meta tags | `apple-mobile-web-app-capable`, status bar style |
| FR11.7 | Service worker | Service worker registered (via next-pwa) |
| FR11.8 | Start URL | `start_url: "/wishlist"` |

**Verification Steps:**
1. Open in Safari iOS → "Add to Home Screen" available
2. Add to home screen → app icon appears
3. Launch from home screen → opens in standalone mode (no browser UI)
4. Manifest validates at https://manifest-validator.appspot.com

---

### FR12: User Settings

**Description:** User preferences and settings.

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR12.1 | Settings page | Accessible via navigation or menu |
| FR12.2 | Base currency | Dropdown to select base currency |
| FR12.3 | Save settings | Settings saved to Google Sheets |
| FR12.4 | Load settings | Settings loaded on app start |
| FR12.5 | Apply immediately | Currency change updates all displayed prices |

**Verification Steps:**
1. Change base currency → all prices recalculated
2. Reload app → setting persists
3. Check Google Sheets Settings tab → value updated

---

## Non-Functional Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| NFR1 | Mobile-first design | UI works on 375px width (iPhone SE) |
| NFR2 | Responsive | UI adapts to tablet/desktop widths |
| NFR3 | Touch-friendly | Buttons minimum 44x44px tap target |
| NFR4 | Loading feedback | All async operations show loading state |
| NFR5 | Error handling | All errors show user-friendly message |
| NFR6 | No console errors | No JavaScript errors in production |
| NFR7 | Type safety | No TypeScript errors |
| NFR8 | API rate limits | Exchange rate API cached to stay under limits |

---

## API Requirements

| Endpoint | Method | Request | Response | Status Codes |
|----------|--------|---------|----------|--------------|
| `/api/items` | GET | - | `{ items: WishlistItem[], count: number }` | 200, 500 |
| `/api/items` | POST | `{ name, url?, currentPrice, currency, ... }` | `{ item: WishlistItem }` | 201, 400, 500 |
| `/api/items/[id]` | GET | - | `{ item: WishlistItem }` | 200, 404, 500 |
| `/api/items/[id]` | PUT | `{ name?, currentPrice?, priority?, ... }` | `{ item: WishlistItem }` | 200, 400, 404, 500 |
| `/api/items/[id]` | DELETE | - | `{ success: true }` | 200, 404, 500 |
| `/api/scrape` | POST | `{ url: string }` | `{ name, currentPrice, currency, imageUrl, success, error? }` | 200, 400, 500 |
| `/api/budget` | POST | `{ budget: number, currency: string }` | `{ suggestions: BudgetSuggestion[] }` | 200, 400, 500 |
| `/api/currency/rates` | GET | `?base=USD` | `{ base, rates, lastUpdated }` | 200, 500 |
| `/api/settings` | GET | - | `{ baseCurrency: string }` | 200, 500 |
| `/api/settings` | PUT | `{ baseCurrency: string }` | `{ baseCurrency: string }` | 200, 400, 500 |

---

## Data Requirements

### WishlistItem Schema

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| id | string | Yes | UUID | Unique identifier |
| name | string | Yes | - | Product name |
| url | string \| null | No | null | Product URL (null for manual) |
| currentPrice | number | Yes | - | Current price |
| priceWhenAdded | number | Yes | currentPrice | Price at creation |
| originalPrice | number \| null | No | null | MSRP/retail price |
| currency | string | Yes | "USD" | Currency code |
| imageData | string \| null | No | null | Image URL or base64 |
| priority | 1-5 | Yes | 3 | Priority rating |
| isPurchased | boolean | Yes | false | Purchase status |
| notes | string | No | "" | User notes |
| createdAt | string | Yes | now() | ISO timestamp |
| lastChecked | string \| null | No | null | Last price check |

---

## UI Requirements

### Pages

| Page | Route | Components |
|------|-------|------------|
| Wishlist | `/wishlist` | Header, WishlistGrid, WishlistItem, BottomNav, AddItemModal, EditItemModal, FilterPanel |
| Budget | `/budget` | Header, BudgetInput, SuggestionCard, BottomNav |
| Settings | `/settings` | Header, CurrencySelect, BottomNav |

### Components Checklist

| Component | Required Props | Behavior |
|-----------|---------------|----------|
| WishlistGrid | `items: WishlistItem[]` | Renders items in responsive grid |
| WishlistItem | `item: WishlistItem` | Displays item card, tap opens edit |
| AddItemModal | `isOpen, onClose, onSave` | Tab toggle, form fields, save/cancel |
| EditItemModal | `item, isOpen, onClose, onSave, onDelete` | Pre-filled form, save/delete/cancel |
| ItemImage | `src: string \| null, alt: string` | Image with broken URL fallback |
| StarRating | `value: 1-5, onChange?` | Interactive or display-only stars |
| CurrencySelect | `value, onChange` | Dropdown of currencies |
| BudgetInput | `onSubmit` | Amount + currency + submit button |
| SuggestionCard | `suggestion: BudgetSuggestion` | List items, totals, priority score |
| FilterPanel | `filters, onChange, onReset` | Priority, price range, status filters |
| BottomNav | - | Wishlist, Budget tabs |

---

## Verification Checklist (End-to-End)

Use this checklist to verify the complete application:

### Setup
- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts server
- [ ] App loads at localhost:3000
- [ ] No TypeScript errors
- [ ] No console errors

### Google Sheets
- [ ] Empty spreadsheet → sheets auto-created
- [ ] Headers auto-created
- [ ] Default settings created

### Add Item (URL)
- [ ] Paste valid URL → fetch details works
- [ ] Fields auto-populated
- [ ] Can modify before save
- [ ] Save → item in grid and Google Sheets

### Add Item (Manual)
- [ ] Switch to manual tab
- [ ] Enter required fields
- [ ] Paste image → displays
- [ ] Save → item in grid with "Manual" badge

### Edit Item
- [ ] Tap item → edit modal opens
- [ ] Change fields → save → updates
- [ ] Change priority → reflected in grid
- [ ] Mark purchased → visual change

### Delete Item
- [ ] Delete → confirmation shown
- [ ] Confirm → item removed

### Images
- [ ] URL images display
- [ ] Base64 images display
- [ ] Broken URLs show placeholder

### Currency
- [ ] Add item in different currency
- [ ] Converted price shown
- [ ] Change base currency → prices update

### Sort & Filter
- [ ] Sort by priority works
- [ ] Sort by price works
- [ ] Filter by priority works
- [ ] Filter by price range works
- [ ] Reset clears filters

### Budget
- [ ] Enter budget → suggestions shown
- [ ] 3 strategies displayed
- [ ] Totals calculated correctly
- [ ] Excludes purchased items

### PWA
- [ ] Manifest valid
- [ ] Can add to home screen (iOS)
- [ ] Opens in standalone mode

### Settings
- [ ] Change base currency
- [ ] Setting persists after reload
