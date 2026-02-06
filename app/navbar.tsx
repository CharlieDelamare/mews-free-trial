'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left: Brand */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Mews Sandbox Manager
            </Link>
          </div>

          {/* Center: Navigation Links */}
          <div className="flex items-center space-x-1">
            <Link
              href="/"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Create Sandbox
            </Link>
            <Link
              href="/reset"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/reset')
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Reset Sandbox
            </Link>
            <Link
              href="/demo-filler"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/demo-filler')
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Sandbox Filler
            </Link>
          </div>

          {/* Right: Logs Link */}
          <div className="flex items-center">
            <Link
              href="/logs"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Logs
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
