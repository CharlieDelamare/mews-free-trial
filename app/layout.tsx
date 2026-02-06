import type { Metadata } from 'next';
import { Navbar } from './navbar';
import './globals.css';

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
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
