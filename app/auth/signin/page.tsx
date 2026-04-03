'use client';

import { Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';

  return (
    <div className="flex flex-col items-center gap-6 p-10 rounded-2xl bg-white shadow-md">
      <h1 className="text-2xl font-heading text-[--mews-charcoal]">Mews Sandbox Manager</h1>
      <p className="text-sm text-[--mews-charcoal]/60">Sign in with your Mews Microsoft account to continue.</p>
      <button
        onClick={() => signIn('azure-ad', { callbackUrl })}
        className="px-6 py-3 rounded-full bg-mews-primary text-[--mews-night-black] font-semibold hover:bg-mews-primary-hover transition-colors"
      >
        Sign in with Microsoft
      </button>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[--mews-linen]">
      <Suspense fallback={null}>
        <SignInContent />
      </Suspense>
    </div>
  );
}
