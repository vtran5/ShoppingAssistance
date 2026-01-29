import { google } from 'googleapis';
import { NextResponse } from 'next/server';

/**
 * Test endpoint to verify GOOGLEFINANCE formulas work via Sheets API.
 *
 * This endpoint:
 * 1. Writes a GOOGLEFINANCE formula to a test cell
 * 2. Reads the cell value back
 * 3. Returns whether the formula returned a calculated value or the formula text
 *
 * DELETE THIS ENDPOINT after testing is complete.
 */

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const TEST_SHEET = 'Settings'; // Use Settings sheet for test

function getClient() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  const credentials = JSON.parse(serviceAccountKey);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export async function GET() {
  try {
    if (!SPREADSHEET_ID) {
      return NextResponse.json(
        { error: 'GOOGLE_SPREADSHEET_ID not configured' },
        { status: 500 }
      );
    }

    const sheets = getClient();

    // Step 1: Write a GOOGLEFINANCE formula to test cell (D2 in Settings)
    // Formula: Get EUR to USD exchange rate
    const testFormula = '=GOOGLEFINANCE("CURRENCY:EURUSD")';

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TEST_SHEET}!D2`,
      valueInputOption: 'USER_ENTERED', // This allows formulas to be interpreted
      requestBody: {
        values: [[testFormula]],
      },
    });

    // Step 2: Read the cell value back
    // Using valueRenderOption: 'FORMATTED_VALUE' to get the calculated result
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TEST_SHEET}!D2`,
      valueRenderOption: 'FORMATTED_VALUE',
    });

    const cellValue = response.data.values?.[0]?.[0];

    // Step 3: Also get the formula to compare
    const formulaResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TEST_SHEET}!D2`,
      valueRenderOption: 'FORMULA',
    });

    const formulaValue = formulaResponse.data.values?.[0]?.[0];

    // Step 4: Clean up - clear the test cell
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TEST_SHEET}!D2`,
    });

    // Analyze results
    const isNumeric = !isNaN(parseFloat(cellValue));
    const isFormula = cellValue?.toString().startsWith('=');

    return NextResponse.json({
      success: true,
      test: {
        formula: testFormula,
        returnedValue: cellValue,
        returnedFormula: formulaValue,
        isNumeric,
        isFormula,
      },
      conclusion: isNumeric
        ? 'GOOGLEFINANCE works! The API returned a numeric value.'
        : isFormula
          ? 'GOOGLEFINANCE NOT working via API. The formula text was returned instead of calculated value.'
          : `Unexpected result: ${cellValue}`,
      nextStep: isNumeric
        ? 'Proceed with Phase 2 implementation using GOOGLEFINANCE formulas.'
        : 'Need alternative approach - consider fetching rates via external API.',
    });
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
