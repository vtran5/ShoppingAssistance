/**
 * Image resizing utility for pasted images
 * Resizes images to fit within 320x200 while preserving aspect ratio
 * Converts to JPEG at 80% quality with gray letterbox background
 */

const MAX_WIDTH = 320;
const MAX_HEIGHT = 200;
const JPEG_QUALITY = 0.8;
const BACKGROUND_COLOR = '#f3f4f6'; // Tailwind gray-100

/**
 * Resizes an image file to fit within the target dimensions
 * @param file - The image file to resize
 * @returns Promise resolving to the resized image as base64 JPEG
 */
export function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Set canvas to target dimensions
        canvas.width = MAX_WIDTH;
        canvas.height = MAX_HEIGHT;

        // Fill with gray background for letterboxing
        ctx.fillStyle = BACKGROUND_COLOR;
        ctx.fillRect(0, 0, MAX_WIDTH, MAX_HEIGHT);

        // Calculate scaled dimensions to fit within bounds while preserving aspect ratio
        // Cap at 1 to prevent upscaling small images
        const scale = Math.min(1, MAX_WIDTH / img.width, MAX_HEIGHT / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        // Center the image on the canvas
        const offsetX = (MAX_WIDTH - scaledWidth) / 2;
        const offsetY = (MAX_HEIGHT - scaledHeight) / 2;

        // Draw the scaled image
        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

        // Convert to JPEG base64
        const base64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        resolve(base64);
      } catch (error) {
        reject(new Error('Failed to resize image'));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Checks if a string is a base64 data URI
 */
export function isBase64Image(data: string): boolean {
  return data.startsWith('data:image/');
}

/**
 * Checks if a string is a URL (not base64)
 */
export function isImageUrl(data: string): boolean {
  return !isBase64Image(data) && (data.startsWith('http://') || data.startsWith('https://'));
}
