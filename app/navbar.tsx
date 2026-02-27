'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sandboxLinks = [
  { href: '/create', label: 'Create' },
  { href: '/extend', label: 'Extend' },
  { href: '/save', label: 'Save' },
];

const operationLinks = [
  { href: '/reset', label: 'Reset' },
  { href: '/fill', label: 'Fill' },
  { href: '/close-bills', label: 'Close Bills' },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => pathname.startsWith(path);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const linkClasses = (path: string) =>
    `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      isActive(path)
        ? 'text-primary-600 bg-primary-50'
        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
    }`;

  return (
    <>
      {/* Top bar */}
      <nav aria-label="Main navigation" className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="p-2 -ml-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
            </button>
            <span className="ml-4 text-sm sm:text-base md:text-xl font-bold text-gray-900 truncate">
              Mews Sandbox Manager
            </span>
          </div>
        </div>
      </nav>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-gray-900/50 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Slide-out sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigation menu"
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200">
          <span className="text-lg font-bold text-gray-900">Menu</span>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="p-2 -mr-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main nav links */}
        <nav className="flex-1 flex flex-col px-3 py-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-1">Sandboxes</p>
            <div className="space-y-1">
              {sandboxLinks.map(({ href, label }) => (
                <Link key={href} href={href} onClick={close} className={linkClasses(href)}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-1">Operations</p>
            <div className="space-y-1">
              {operationLinks.map(({ href, label }) => (
                <Link key={href} href={href} onClick={close} className={linkClasses(href)}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Logs pinned to bottom */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            <Link href="/logs" onClick={close} className={linkClasses('/logs')}>
              Logs
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}
