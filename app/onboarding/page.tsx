'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { OnboardingSessionData } from '@/types/onboarding';
import { WIZARD_STEPS } from '@/types/onboarding';

export default function OnboardingListPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<OnboardingSessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetch('/api/onboarding/sessions')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSessions(data.sessions);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const startNewSession = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/onboarding/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/onboarding/${data.session.id}`);
      }
    } catch {
      alert('Failed to create session');
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--mews-night-black)]">Onboarding wizard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Guide a hotel through their Mews onboarding — Excel review, config Q&amp;A, and API push.
          </p>
        </div>
        <button
          type="button"
          onClick={startNewSession}
          disabled={isCreating}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--mews-primary-pink)] text-[var(--mews-night-black)] text-sm font-bold rounded-lg hover:bg-[var(--mews-primary-hover)] transition-colors disabled:opacity-60"
        >
          {isCreating ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New onboarding
            </>
          )}
        </button>
      </div>

      {/* Session list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <div className="w-14 h-14 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[var(--mews-primary-pink)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">No onboarding sessions yet</p>
          <p className="text-xs text-gray-400 mb-6">Start a new session to begin onboarding a hotel.</p>
          <button
            type="button"
            onClick={startNewSession}
            className="px-5 py-2.5 bg-[var(--mews-primary-pink)] text-[var(--mews-night-black)] text-sm font-bold rounded-lg hover:bg-[var(--mews-primary-hover)] transition-colors"
          >
            Start first onboarding
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/onboarding/${session.id}`}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-[var(--mews-primary-pink)] hover:shadow-sm transition-all group"
            >
              {/* Step progress ring */}
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-pink-50 border-2 border-pink-100 text-[var(--mews-primary-pink)] font-bold text-sm">
                {session.currentStep + 1}/{WIZARD_STEPS.length}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {session.propertyName ?? 'Unnamed property'}
                  </p>
                  <StatusPill status={session.status} />
                </div>
                <p className="text-xs text-gray-400">
                  {WIZARD_STEPS[session.currentStep]?.label ?? 'Unknown step'} ·{' '}
                  {new Date(session.updatedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {session.createdBy && ` · ${session.createdBy}`}
                </p>
              </div>

              {/* Arrow */}
              <svg
                className="w-4 h-4 text-gray-300 group-hover:text-[var(--mews-primary-pink)] transition-colors flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-500' },
    exported: { label: 'Exported', cls: 'bg-blue-50 text-blue-600' },
    pushed: { label: 'Pushed', cls: 'bg-green-50 text-green-700' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
}
