import { google, sheets_v4 } from 'googleapis';
import { WishlistItem, UserSettings, Currency, Priority, ItemViewSize } from '@/types';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const WISHLIST_SHEET = 'Wishlist';
const SETTINGS_SHEET = 'Settings';

const WISHLIST_HEADERS = [
  'ID',
  'Name',
  'URL',
  'CurrentPrice',
  'PriceWhenAdded',
  'OriginalPrice',
  'Currency',
  'ImageData',
  'Priority',
  'IsPurchased',
  'Notes',
  'CreatedAt',
  'LastChecked',
  'PriceInBaseCurrency',
  'PreviousPrice',
];

const SETTINGS_HEADERS = ['Key', 'Value'];

let sheetsClient: sheets_v4.Sheets | null = null;
let initialized = false;

function getClient(): sheets_v4.Sheets {
  if (sheetsClient) return sheetsClient;

  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  const credentials = JSON.parse(serviceAccountKey);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

async function initializeSheets(): Promise<void> {
  const sheets = getClient();

  if (!SPREADSHEET_ID) {
    throw new Error('GOOGLE_SPREADSHEET_ID environment variable is not set');
  }

  // Get spreadsheet info
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });

  const existingSheets = spreadsheet.data.sheets?.map((s) => s.properties?.title) ?? [];

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
    range: `${WISHLIST_SHEET}!A1:O1`,
  });

  if (!wishlistData.data.values || wishlistData.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${WISHLIST_SHEET}!A1:O1`,
      valueInputOption: 'RAW',
      requestBody: { values: [WISHLIST_HEADERS] },
    });
  } else if (wishlistData.data.values[0].length < WISHLIST_HEADERS.length) {
    // Add missing headers if sheet exists but columns are missing
    const existingCount = wishlistData.data.values[0].length;
    const missingHeaders = WISHLIST_HEADERS.slice(existingCount);
    const startColumn = String.fromCharCode(65 + existingCount); // A=65
    const endColumn = String.fromCharCode(65 + WISHLIST_HEADERS.length - 1);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${WISHLIST_SHEET}!${startColumn}1:${endColumn}1`,
      valueInputOption: 'RAW',
      requestBody: { values: [missingHeaders] },
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

export async function ensureInitialized(): Promise<void> {
  if (!initialized) {
    await initializeSheets();
    initialized = true;
  }
}

// Convert sheet row to WishlistItem
function rowToItem(row: string[]): WishlistItem {
  // Parse priceInBaseCurrency, returning null for invalid values (e.g., formula errors like #N/A)
  const parsedBaseCurrencyPrice = row[13] ? parseFloat(row[13]) : null;
  const priceInBaseCurrency =
    parsedBaseCurrencyPrice !== null && !isNaN(parsedBaseCurrencyPrice)
      ? parsedBaseCurrencyPrice
      : null;

  // Parse previousPrice (column O / index 14)
  const parsedPreviousPrice = row[14] ? parseFloat(row[14]) : null;
  const previousPrice =
    parsedPreviousPrice !== null && !isNaN(parsedPreviousPrice)
      ? parsedPreviousPrice
      : null;

  return {
    id: row[0] || '',
    name: row[1] || '',
    url: row[2] || null,
    currentPrice: parseFloat(row[3]) || 0,
    priceWhenAdded: parseFloat(row[4]) || 0,
    originalPrice: row[5] ? parseFloat(row[5]) : null,
    currency: (row[6] as Currency) || 'USD',
    imageData: row[7] || null,
    priority: (parseInt(row[8]) as Priority) || 3,
    isPurchased: row[9]?.toUpperCase() === 'TRUE',
    notes: row[10] || '',
    createdAt: row[11] || new Date().toISOString(),
    lastChecked: row[12] || null,
    priceInBaseCurrency,
    previousPrice,
  };
}

// Convert WishlistItem to sheet row (columns A-M, excludes formula columns N and O)
function itemToRow(item: WishlistItem): (string | number | boolean)[] {
  return [
    item.id,
    item.name,
    item.url || '',
    item.currentPrice,
    item.priceWhenAdded,
    item.originalPrice ?? '',
    item.currency,
    item.imageData || '',
    item.priority,
    item.isPurchased,
    item.notes,
    item.createdAt,
    item.lastChecked || '',
  ];
}

// Convert WishlistItem to full sheet row (columns A-O, includes previousPrice)
function itemToFullRow(item: WishlistItem): (string | number | boolean)[] {
  return [
    ...itemToRow(item),
    '', // Column N: PriceInBaseCurrency (formula, will be added separately)
    item.previousPrice ?? '',
  ];
}

// Read all items
export async function getAllItems(): Promise<WishlistItem[]> {
  await ensureInitialized();
  const sheets = getClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A2:O`,
    valueRenderOption: 'FORMATTED_VALUE', // Get calculated values from formulas
  });

  if (!response.data.values || response.data.values.length === 0) {
    return [];
  }

  return response.data.values.map(rowToItem);
}

// Get single item by ID
export async function getItemById(id: string): Promise<WishlistItem | null> {
  await ensureInitialized();
  const items = await getAllItems();
  return items.find((item) => item.id === id) || null;
}

// Ensure formulas exist for items that need currency conversion
// This lazily repairs any rows missing formulas before budget calculations
export async function ensureFormulasExist(
  items: WishlistItem[],
  baseCurrency: Currency
): Promise<WishlistItem[]> {
  // Find items that might need formula repair:
  // - priceInBaseCurrency is null/invalid
  // - currency !== baseCurrency (can't use currentPrice fallback)
  const suspectItems = items.filter(
    (item) => item.priceInBaseCurrency === null && item.currency !== baseCurrency
  );

  if (suspectItems.length === 0) {
    return items; // Nothing to fix
  }

  await ensureInitialized();
  const sheets = getClient();

  // Get row numbers for suspect items by reading all IDs
  const idsResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A:A`,
  });
  const ids = idsResponse.data.values ?? [];

  // Check formulas for suspect rows
  const formulasResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!N:N`,
    valueRenderOption: 'FORMULA',
  });
  const formulas = formulasResponse.data.values ?? [];

  // Find rows needing formula repair
  const rowsToFix: number[] = [];
  for (const item of suspectItems) {
    const rowIndex = ids.findIndex((row) => row[0] === item.id);
    if (rowIndex > 0) {
      // Skip header (index 0)
      const formula = formulas[rowIndex]?.[0];
      if (!formula || !formula.toString().startsWith('=')) {
        rowsToFix.push(rowIndex + 1); // Convert to 1-indexed row number
      }
    }
  }

  if (rowsToFix.length === 0) {
    return items; // Formulas exist but return errors (GOOGLEFINANCE issue)
  }

  // Add formulas to rows missing them
  for (const rowNumber of rowsToFix) {
    const formula = `=IF(G${rowNumber}=Settings!$B$2,D${rowNumber},D${rowNumber}*GOOGLEFINANCE("CURRENCY:"&G${rowNumber}&Settings!$B$2))`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${WISHLIST_SHEET}!N${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[formula]] },
    });
  }

  // Re-read all items with updated formulas
  return getAllItems();
}

// Add new item (atomic: writes all columns A-N in a single call)
export async function addItem(item: WishlistItem): Promise<void> {
  await ensureInitialized();
  const sheets = getClient();

  // Get current row count to determine new row number
  const countResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A:A`,
  });
  const rowCount = countResponse.data.values?.length ?? 1;
  const newRowNumber = rowCount + 1;

  // Build formula for currency conversion in column N
  // Formula: If currency equals base currency, use currentPrice; otherwise convert
  const formula = `=IF(G${newRowNumber}=Settings!$B$2,D${newRowNumber},D${newRowNumber}*GOOGLEFINANCE("CURRENCY:"&G${newRowNumber}&Settings!$B$2))`;

  // Write entire row (A-N) in single atomic call
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A${newRowNumber}:N${newRowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[...itemToRow(item), formula]],
    },
  });
}

// Update item by ID
export async function updateItem(id: string, updates: Partial<WishlistItem>): Promise<WishlistItem> {
  await ensureInitialized();
  const sheets = getClient();

  // Find the row with matching ID
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A:A`,
  });

  const rows = response.data.values ?? [];
  const rowIndex = rows.findIndex((row) => row[0] === id);

  if (rowIndex === -1) {
    throw new Error(`Item with ID ${id} not found`);
  }

  // Get current row data (A-O for reading, but we only write A-M to preserve formula in N and previousPrice in O)
  const currentRow = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A${rowIndex + 1}:O${rowIndex + 1}`,
    valueRenderOption: 'FORMATTED_VALUE', // Get calculated values from formulas
  });

  if (!currentRow.data.values || currentRow.data.values.length === 0) {
    throw new Error(`Item with ID ${id} not found`);
  }

  // Merge updates (exclude priceInBaseCurrency as it's calculated by formula)
  const currentItem = rowToItem(currentRow.data.values[0]);
  const { priceInBaseCurrency: _, ...updatesWithoutCalculated } = updates;
  const updatedItem: WishlistItem = { ...currentItem, ...updatesWithoutCalculated };

  // Write back to A-M only (preserve formula in column N)
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A${rowIndex + 1}:M${rowIndex + 1}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [itemToRow(updatedItem)] },
  });

  // Re-read to get the recalculated priceInBaseCurrency
  const updatedRow = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A${rowIndex + 1}:O${rowIndex + 1}`,
    valueRenderOption: 'FORMATTED_VALUE',
  });

  return rowToItem(updatedRow.data.values?.[0] || []);
}

// Delete item by ID
export async function deleteItem(id: string): Promise<void> {
  await ensureInitialized();
  const sheets = getClient();

  // Get sheet ID
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });

  const sheetId = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === WISHLIST_SHEET
  )?.properties?.sheetId;

  if (sheetId === undefined) {
    throw new Error('Wishlist sheet not found');
  }

  // Find row index
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A:A`,
  });

  const rows = response.data.values ?? [];
  const rowIndex = rows.findIndex((row) => row[0] === id);

  if (rowIndex === -1) {
    throw new Error(`Item with ID ${id} not found`);
  }

  // Delete the row
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  });
}

// Get settings
export async function getSettings(): Promise<UserSettings> {
  await ensureInitialized();
  const sheets = getClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SETTINGS_SHEET}!A2:B`,
  });

  const settings: UserSettings = {
    baseCurrency: 'USD',
    itemViewSize: 'large',
  };

  if (response.data.values) {
    for (const row of response.data.values) {
      if (row[0] === 'baseCurrency' && row[1]) {
        settings.baseCurrency = row[1] as Currency;
      }
      if (row[0] === 'itemViewSize' && row[1]) {
        settings.itemViewSize = row[1] as ItemViewSize;
      }
    }
  }

  return settings;
}

// Update settings
export async function updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  await ensureInitialized();
  const sheets = getClient();

  // Get current settings
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SETTINGS_SHEET}!A:B`,
  });

  const rows = response.data.values ?? [];

  // Find and update baseCurrency row
  if (settings.baseCurrency !== undefined) {
    const rowIndex = rows.findIndex((row) => row[0] === 'baseCurrency');

    if (rowIndex === -1) {
      // Add new setting
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SETTINGS_SHEET}!A:B`,
        valueInputOption: 'RAW',
        requestBody: { values: [['baseCurrency', settings.baseCurrency]] },
      });
    } else {
      // Update existing setting
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SETTINGS_SHEET}!B${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[settings.baseCurrency]] },
      });
    }
  }

  // Find and update itemViewSize row
  if (settings.itemViewSize !== undefined) {
    // Re-fetch rows in case baseCurrency was just added
    const refreshedResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SETTINGS_SHEET}!A:B`,
    });
    const refreshedRows = refreshedResponse.data.values ?? [];
    const rowIndex = refreshedRows.findIndex((row) => row[0] === 'itemViewSize');

    if (rowIndex === -1) {
      // Add new setting
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SETTINGS_SHEET}!A:B`,
        valueInputOption: 'RAW',
        requestBody: { values: [['itemViewSize', settings.itemViewSize]] },
      });
    } else {
      // Update existing setting
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SETTINGS_SHEET}!B${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[settings.itemViewSize]] },
      });
    }
  }

  return getSettings();
}

// Migration helper: Add formulas to existing rows that don't have them
export async function migrateAddPriceFormulas(): Promise<{ updated: number; skipped: number }> {
  await ensureInitialized();
  const sheets = getClient();

  // Get all rows including column N (to check which need formulas)
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A2:N`,
    valueRenderOption: 'FORMULA', // Get formulas, not values
  });

  if (!response.data.values || response.data.values.length === 0) {
    return { updated: 0, skipped: 0 };
  }

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < response.data.values.length; i++) {
    const row = response.data.values[i];
    const rowNumber = i + 2; // +2 because we start from row 2 (after header)
    const hasFormula = row[13] && row[13].toString().startsWith('=');

    if (!hasFormula) {
      // Add the formula
      const formula = `=IF(G${rowNumber}=Settings!$B$2,D${rowNumber},D${rowNumber}*GOOGLEFINANCE("CURRENCY:"&G${rowNumber}&Settings!$B$2))`;

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${WISHLIST_SHEET}!N${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[formula]],
        },
      });
      updated++;
    } else {
      skipped++;
    }
  }

  return { updated, skipped };
}

// Get items eligible for price checking (URL-based, not purchased)
export async function getItemsForPriceCheck(): Promise<WishlistItem[]> {
  const allItems = await getAllItems();
  return allItems.filter((item) => item.url !== null && !item.isPurchased);
}

// Update item price after automated price check
export async function updateItemAfterPriceCheck(
  id: string,
  newPrice: number,
  previousPrice: number,
  lastChecked: string
): Promise<void> {
  await ensureInitialized();
  const sheets = getClient();

  // Find the row with matching ID
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A:A`,
  });

  const rows = response.data.values ?? [];
  const rowIndex = rows.findIndex((row) => row[0] === id);

  if (rowIndex === -1) {
    throw new Error(`Item with ID ${id} not found`);
  }

  const rowNumber = rowIndex + 1;

  // Update CurrentPrice (D), LastChecked (M), and PreviousPrice (O) in a batch
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: `${WISHLIST_SHEET}!D${rowNumber}`,
          values: [[newPrice]],
        },
        {
          range: `${WISHLIST_SHEET}!M${rowNumber}`,
          values: [[lastChecked]],
        },
        {
          range: `${WISHLIST_SHEET}!O${rowNumber}`,
          values: [[previousPrice]],
        },
      ],
    },
  });
}
