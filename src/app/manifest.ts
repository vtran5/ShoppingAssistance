import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Shopping Assistant',
    short_name: 'ShopAssist',
    description: 'Track wishlist and budget smartly',
    start_url: '/wishlist',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  };
}
