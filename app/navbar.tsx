'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  return (
    <nav aria-label="Main navigation" className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 h-16">
          {/* Left: Brand */}
          <div className="flex items-center">
            <Link href="/create" className="text-sm sm:text-base md:text-xl font-bold text-gray-900 truncate">
              Mews Sandbox Manager
            </Link>
          </div>

          {/* Center: Navigation Links */}
          <div className="flex items-center space-x-1 justify-self-center">
            <Link
              href="/create"
              className={`px-2 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/create')
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Create
            </Link>
            <Link
              href="/reset"
              className={`px-2 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/reset')
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Reset
            </Link>
            <Link
              href="/fill"
              className={`px-2 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/fill')
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Fill
            </Link>
          </div>

          {/* Right: Logs Link */}
          <div className="flex items-center justify-self-end">
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
