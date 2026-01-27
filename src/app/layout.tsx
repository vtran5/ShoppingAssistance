import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shopping Assistant',
  description: 'Track wishlist and budget smartly',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ShopAssist',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
