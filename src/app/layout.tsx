import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], preload: false });

export const metadata: Metadata = {
  title: 'Horv\u00E1th',
  description: 'Horv\u00E1th Assessment Platform',
  icons: {
    icon: [{ url: '/favicon.webp', type: 'image/webp' }],
    shortcut: '/favicon.webp',
    apple: '/favicon.webp',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
