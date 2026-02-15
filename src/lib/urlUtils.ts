/**
 * Utilities for extracting URLs and titles from shared content.
 *
 * When a user shares a webpage from Safari (or other browsers), the shared
 * data can arrive in various formats:
 * - Just the URL in the `url` param
 * - Title + URL combined in the `text` param (e.g., "Product Name\nhttps://...")
 * - Just the URL in the `text` param
 */

interface ShareParams {
  url?: string | null;
  text?: string | null;
  title?: string | null;
}

/**
 * Extracts a URL from shared parameters, checking url → text → title.
 */
export function extractUrlFromShareParams(params: ShareParams): string | null {
  if (params.url) {
    const trimmed = params.url.trim();
    if (isValidHttpUrl(trimmed)) {
      return trimmed;
    }
  }

  if (params.text) {
    const urlFromText = findUrlInText(params.text);
    if (urlFromText) {
      return urlFromText;
    }
  }

  if (params.title) {
    const urlFromTitle = findUrlInText(params.title);
    if (urlFromTitle) {
      return urlFromTitle;
    }
  }

  return null;
}

/**
 * Extracts a title from shared parameters, excluding any URL portion.
 */
export function extractTitleFromShareParams(params: ShareParams): string | null {
  if (params.title && !isValidHttpUrl(params.title.trim())) {
    return params.title.trim();
  }

  if (params.text) {
    const withoutUrls = params.text.replace(/https?:\/\/[^\s]+/g, '').trim();
    if (withoutUrls.length > 0) {
      return withoutUrls;
    }
  }

  return null;
}

function findUrlInText(text: string): string | null {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const matches = text.match(urlRegex);
  if (matches && matches.length > 0) {
    // Remove trailing punctuation that may have been captured
    return matches[0].replace(/[.,;:!?)]+$/, '');
  }
  return null;
}

function isValidHttpUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
