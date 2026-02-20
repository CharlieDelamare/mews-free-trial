import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Navbar } from './navbar';
import { Providers } from '@/components/Providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Mews Sandbox Manager',
  description: 'Create and manage Mews sandbox environments',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-mews-linen text-mews-night">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
