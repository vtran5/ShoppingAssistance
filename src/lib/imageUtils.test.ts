import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resizeImage, isBase64Image, isImageUrl } from './imageUtils';

describe('isBase64Image', () => {
  it('returns true for base64 PNG data URI', () => {
    expect(isBase64Image('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
  });

  it('returns true for base64 JPEG data URI', () => {
    expect(isBase64Image('data:image/jpeg;base64,/9j/4AAQSkZJRg==')).toBe(true);
  });

  it('returns false for HTTP URL', () => {
    expect(isBase64Image('http://example.com/image.png')).toBe(false);
  });

  it('returns false for HTTPS URL', () => {
    expect(isBase64Image('https://example.com/image.png')).toBe(false);
  });

  it('returns false for arbitrary string', () => {
    expect(isBase64Image('not an image')).toBe(false);
  });
});

describe('isImageUrl', () => {
  it('returns true for HTTP URL', () => {
    expect(isImageUrl('http://example.com/image.png')).toBe(true);
  });

  it('returns true for HTTPS URL', () => {
    expect(isImageUrl('https://example.com/image.png')).toBe(true);
  });

  it('returns false for base64 data URI', () => {
    expect(isImageUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(false);
  });

  it('returns false for arbitrary string', () => {
    expect(isImageUrl('not a url')).toBe(false);
  });

  it('returns false for FTP URL', () => {
    expect(isImageUrl('ftp://example.com/image.png')).toBe(false);
  });
});

describe('resizeImage', () => {
  let mockCtx: {
    fillStyle: string;
    fillRect: ReturnType<typeof vi.fn>;
    drawImage: ReturnType<typeof vi.fn>;
  };

  let mockToDataURL: ReturnType<typeof vi.fn>;
  let originalCreateElement: typeof document.createElement;

  beforeEach(() => {
    mockCtx = {
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    };

    mockToDataURL = vi.fn(() => 'data:image/jpeg;base64,mockResult');

    originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        const canvas = originalCreateElement('canvas');
        vi.spyOn(canvas, 'getContext').mockReturnValue(
          mockCtx as unknown as CanvasRenderingContext2D
        );
        vi.spyOn(canvas, 'toDataURL').mockImplementation(mockToDataURL);
        return canvas;
      }
      return originalCreateElement(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createMockFileReader(options: { shouldFail?: boolean } = {}) {
    class MockFileReader {
      onload: ((e: ProgressEvent<FileReader>) => void) | null = null;
      onerror: (() => void) | null = null;
      result: string | null = null;

      readAsDataURL() {
        setTimeout(() => {
          if (options.shouldFail) {
            this.onerror?.();
          } else {
            this.result = 'data:image/png;base64,test';
            this.onload?.({
              target: { result: this.result },
            } as ProgressEvent<FileReader>);
          }
        }, 0);
      }
    }
    return MockFileReader;
  }

  function createMockImage(options: {
    width?: number;
    height?: number;
    shouldFail?: boolean;
  }) {
    const { width = 100, height = 100, shouldFail = false } = options;

    return class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      width = width;
      height = height;
      private _src = '';

      get src() {
        return this._src;
      }

      set src(value: string) {
        this._src = value;
        setTimeout(() => {
          if (shouldFail) {
            this.onerror?.();
          } else {
            this.onload?.();
          }
        }, 0);
      }
    };
  }

  it('resizes large image to fit within 320x200', async () => {
    const mockFile = new File([''], 'test.png', { type: 'image/png' });

    vi.stubGlobal('FileReader', createMockFileReader());
    const MockImage = createMockImage({ width: 640, height: 400 });
    vi.stubGlobal('Image', MockImage);

    const result = await resizeImage(mockFile);

    expect(result).toBe('data:image/jpeg;base64,mockResult');
    expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 320, 200);
    // Scale = 0.5, so image should be 320x200, centered at (0, 0)
    expect(mockCtx.drawImage).toHaveBeenCalled();
    const drawCall = mockCtx.drawImage.mock.calls[0];
    expect(drawCall[1]).toBe(0); // offsetX
    expect(drawCall[2]).toBe(0); // offsetY
    expect(drawCall[3]).toBe(320); // width
    expect(drawCall[4]).toBe(200); // height
  });

  it('does not upscale small images', async () => {
    const mockFile = new File([''], 'small.png', { type: 'image/png' });

    vi.stubGlobal('FileReader', createMockFileReader());
    vi.stubGlobal('Image', createMockImage({ width: 100, height: 50 }));

    await resizeImage(mockFile);

    // Small image should be centered without upscaling
    // Scale = 1 (capped), offsetX = (320 - 100) / 2 = 110, offsetY = (200 - 50) / 2 = 75
    expect(mockCtx.drawImage).toHaveBeenCalled();
    const drawCall = mockCtx.drawImage.mock.calls[0];
    expect(drawCall[1]).toBe(110); // offsetX
    expect(drawCall[2]).toBe(75); // offsetY
    expect(drawCall[3]).toBe(100); // width (not upscaled)
    expect(drawCall[4]).toBe(50); // height (not upscaled)
  });

  it('rejects when file reading fails', async () => {
    const mockFile = new File([''], 'test.png', { type: 'image/png' });

    vi.stubGlobal('FileReader', createMockFileReader({ shouldFail: true }));
    vi.stubGlobal('Image', createMockImage({}));

    await expect(resizeImage(mockFile)).rejects.toThrow(
      'Failed to read image file'
    );
  });

  it('rejects when image loading fails', async () => {
    const mockFile = new File([''], 'test.png', { type: 'image/png' });

    vi.stubGlobal('FileReader', createMockFileReader());
    vi.stubGlobal('Image', createMockImage({ shouldFail: true }));

    await expect(resizeImage(mockFile)).rejects.toThrow('Failed to load image');
  });

  it('rejects when canvas context is unavailable', async () => {
    const mockFile = new File([''], 'test.png', { type: 'image/png' });

    vi.stubGlobal('FileReader', createMockFileReader());
    vi.stubGlobal('Image', createMockImage({}));

    // Override canvas mock to return null context
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        const canvas = originalCreateElement('canvas');
        vi.spyOn(canvas, 'getContext').mockReturnValue(null);
        return canvas;
      }
      return originalCreateElement(tag);
    });

    await expect(resizeImage(mockFile)).rejects.toThrow(
      'Failed to get canvas context'
    );
  });

  it('preserves aspect ratio for wide images', async () => {
    const mockFile = new File([''], 'wide.png', { type: 'image/png' });

    vi.stubGlobal('FileReader', createMockFileReader());
    vi.stubGlobal('Image', createMockImage({ width: 800, height: 200 }));

    await resizeImage(mockFile);

    // Scale = 320/800 = 0.4, scaledWidth = 320, scaledHeight = 80
    // offsetX = 0, offsetY = (200 - 80) / 2 = 60
    expect(mockCtx.drawImage).toHaveBeenCalled();
    const drawCall = mockCtx.drawImage.mock.calls[0];
    expect(drawCall[1]).toBe(0); // offsetX
    expect(drawCall[2]).toBe(60); // offsetY
    expect(drawCall[3]).toBe(320); // width
    expect(drawCall[4]).toBe(80); // height
  });

  it('preserves aspect ratio for tall images', async () => {
    const mockFile = new File([''], 'tall.png', { type: 'image/png' });

    vi.stubGlobal('FileReader', createMockFileReader());
    vi.stubGlobal('Image', createMockImage({ width: 200, height: 600 }));

    await resizeImage(mockFile);

    // Scale = 200/600 = 1/3, scaledWidth = 66.67, scaledHeight = 200
    // offsetX = (320 - 66.67) / 2 = 126.67, offsetY = 0
    const drawCall = mockCtx.drawImage.mock.calls[0];
    expect(drawCall[1]).toBeCloseTo(126.67, 0); // offsetX
    expect(drawCall[2]).toBe(0); // offsetY
    expect(drawCall[3]).toBeCloseTo(66.67, 0); // width
    expect(drawCall[4]).toBe(200); // height
  });

  it('uses correct JPEG quality and background color', async () => {
    const mockFile = new File([''], 'test.png', { type: 'image/png' });

    vi.stubGlobal('FileReader', createMockFileReader());
    vi.stubGlobal('Image', createMockImage({ width: 100, height: 100 }));

    await resizeImage(mockFile);

    // Check background color was set
    expect(mockCtx.fillStyle).toBe('#f3f4f6');
    // Check JPEG quality (0.8)
    expect(mockToDataURL).toHaveBeenCalledWith('image/jpeg', 0.8);
  });
});
