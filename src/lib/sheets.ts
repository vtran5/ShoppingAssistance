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
    range: `${WISHLIST_SHEET}!A1:N1`,
  });

  if (!wishlistData.data.values || wishlistData.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${WISHLIST_SHEET}!A1:N1`,
      valueInputOption: 'RAW',
      requestBody: { values: [WISHLIST_HEADERS] },
    });
  } else if (wishlistData.data.values[0].length < WISHLIST_HEADERS.length) {
    // Add missing PriceInBaseCurrency header if sheet exists but column is missing
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${WISHLIST_SHEET}!N1`,
      valueInputOption: 'RAW',
      requestBody: { values: [['PriceInBaseCurrency']] },
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
  };
}

// Convert WishlistItem to sheet row
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

// Read all items
export async function getAllItems(): Promise<WishlistItem[]> {
  await ensureInitialized();
  const sheets = getClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A2:N`,
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

// Add new item
export async function addItem(item: WishlistItem): Promise<void> {
  await ensureInitialized();
  const sheets = getClient();

  // Append item data to columns A-M
  const appendResponse = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A:M`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [itemToRow(item)],
    },
  });

  // Extract the row number from the updated range (e.g., "Wishlist!A5:M5" -> 5)
  const updatedRange = appendResponse.data.updates?.updatedRange;
  if (updatedRange) {
    const rowMatch = updatedRange.match(/:M(\d+)$/);
    if (rowMatch) {
      const rowNumber = rowMatch[1];
      // Set the GOOGLEFINANCE formula for currency conversion in column N
      // Formula: If currency equals base currency, use currentPrice; otherwise convert
      const formula = `=IF(G${rowNumber}=Settings!$B$2,D${rowNumber},D${rowNumber}*GOOGLEFINANCE("CURRENCY:"&G${rowNumber}&Settings!$B$2))`;

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${WISHLIST_SHEET}!N${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[formula]],
        },
      });
    }
  }
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

  // Get current row data (A-N for reading, but we only write A-M to preserve formula in N)
  const currentRow = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WISHLIST_SHEET}!A${rowIndex + 1}:N${rowIndex + 1}`,
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
    range: `${WISHLIST_SHEET}!A${rowIndex + 1}:N${rowIndex + 1}`,
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
