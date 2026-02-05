import type { Metadata } from 'next';
import { Navbar } from './navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mews Free Trial',
  description: 'Start your free trial with Mews',
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
