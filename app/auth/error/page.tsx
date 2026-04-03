'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const MESSAGES: Record<string, string> = {
  AccessDenied: 'Only @mews.com accounts are allowed. Please sign in with your Mews Google account.',
  Configuration: 'Server configuration error. Contact the platform team.',
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') ?? 'unknown';
  const message = MESSAGES[error] ?? `Authentication failed (${error}).`;

  return (
    <div className="flex flex-col items-center gap-4 p-10 rounded-2xl bg-white shadow-md max-w-md text-center">
      <h1 className="text-2xl font-heading text-[--mews-charcoal]">Sign-in failed</h1>
      <p className="text-sm text-[--mews-charcoal]/70">{message}</p>
      <a href="/auth/signin" className="text-mews-primary underline text-sm">Try again</a>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[--mews-linen]">
      <Suspense fallback={null}>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
