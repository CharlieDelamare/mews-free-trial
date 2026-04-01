'use client';

import { useState, useEffect, useCallback } from 'react';
import type { OnboardingSessionData, PushResult } from '@/types/onboarding';

interface Step10ConnectProps {
  session: OnboardingSessionData;
  onSessionUpdated: (session: OnboardingSessionData) => void;
}

export function Step10Connect({ session, onSessionUpdated }: Step10ConnectProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [pushResults, setPushResults] = useState<PushResult[] | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  // Poll for environment linking (every 5s when not yet linked)
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/onboarding/sessions/${session.id}`);
      const data = await res.json();
      if (data.success && data.session.enterpriseId && !session.enterpriseId) {
        onSessionUpdated(data.session);
      }
    } catch {
      // ignore polling errors
    }
  }, [session.id, session.enterpriseId, onSessionUpdated]);

  useEffect(() => {
    if (session.enterpriseId) return;
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [session.enterpriseId, poll]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/onboarding/sessions/${session.id}/export`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const filename = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1]
        ?? `onboarding_${session.id}.xlsx`;
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      // Refresh session to pick up status change to 'exported'
      const sessionRes = await fetch(`/api/onboarding/sessions/${session.id}`);
      const sessionData = await sessionRes.json();
      if (sessionData.success) onSessionUpdated(sessionData.session);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePush = async () => {
    setPushResults(null);
    setPushError(null);
    setIsPushing(true);
    try {
      const res = await fetch(`/api/onboarding/sessions/${session.id}/push`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Push failed');
      setPushResults(data.results);
      const sessionRes = await fetch(`/api/onboarding/sessions/${session.id}`);
      const sessionData = await sessionRes.json();
      if (sessionData.success) onSessionUpdated(sessionData.session);
    } catch (err) {
      setPushError(err instanceof Error ? err.message : 'Push failed');
    } finally {
      setIsPushing(false);
    }
  };

  const isLinked = Boolean(session.enterpriseId);

  return (
    <div className="max-w-2xl space-y-8">
      <p className="text-sm text-gray-500">
        Export your completed Excel file, upload it to Mews, then push your configuration answers
        directly to the live environment.
      </p>

      {/* ── Step A: Export ─────────────────────────────────────────────── */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
          <StepBadge n={1} done={session.status !== 'draft'} />
          <h2 className="text-sm font-semibold text-gray-800">Export Excel file</h2>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-gray-500">
            Download the completed RIA import file with all your changes. Upload it to your Mews
            environment, then add the <strong>Mews Onboarding Integration</strong> to connect this
            session.
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--mews-primary-pink)] text-[var(--mews-night-black)] text-sm font-bold rounded-lg hover:bg-[var(--mews-primary-hover)] transition-colors disabled:opacity-60"
          >
            {isExporting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Exporting…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download Excel
              </>
            )}
          </button>
          {session.status !== 'draft' && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Exported
            </p>
          )}
        </div>
      </div>

      {/* ── Step B: Wait for environment ─────────────────────────────── */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
          <StepBadge n={2} done={isLinked} />
          <h2 className="text-sm font-semibold text-gray-800">Link environment</h2>
        </div>
        <div className="px-5 py-4 space-y-3">
          {isLinked ? (
            <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Environment linked — Enterprise ID: <code className="text-xs bg-green-50 px-1.5 py-0.5 rounded font-mono">{session.enterpriseId}</code>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500">
                After uploading your Excel to Mews:
              </p>
              <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                <li>In Mews Dashboard, go to <strong>Settings → Integrations</strong></li>
                <li>Add the <strong>Mews Onboarding Integration</strong></li>
                <li>This page will automatically detect the connection</li>
              </ol>
              <div className="flex items-center gap-2 text-xs text-[var(--mews-primary-pink)] font-medium animate-pulse">
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Waiting for environment…
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Step C: Push ──────────────────────────────────────────────── */}
      <div className={`border rounded-xl overflow-hidden transition-opacity ${isLinked ? 'border-gray-200 opacity-100' : 'border-gray-200 opacity-40'}`}>
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
          <StepBadge n={3} done={session.status === 'pushed'} />
          <h2 className="text-sm font-semibold text-gray-800">Push configuration</h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          <p className="text-xs text-gray-500">
            Push your Q&A answers (steps 6–9) to the live environment. All 6 endpoints are new
            proposed Mews API endpoints — each result will show the prepared payload.
          </p>

          <button
            type="button"
            onClick={handlePush}
            disabled={!isLinked || isPushing}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--mews-night-black)] text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPushing ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Pushing…
              </>
            ) : (
              <>Push config to Mews</>
            )}
          </button>

          {pushError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {pushError}
            </p>
          )}

          {pushResults && (
            <div className="space-y-2 mt-2">
              {pushResults.map((r, i) => (
                <div
                  key={i}
                  className={`rounded-lg border px-4 py-3 space-y-1 ${
                    r.status === 'pushed'
                      ? 'bg-green-50 border-green-200'
                      : r.status === 'failed'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <StatusIcon status={r.status} />
                    <span className="text-sm font-medium text-gray-800">{r.item}</span>
                    <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                      r.status === 'pushed' ? 'bg-green-100 text-green-700' :
                      r.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  {r.endpointNote && (
                    <p className="text-xs text-gray-500 font-mono">{r.endpointNote}</p>
                  )}
                  {r.error && (
                    <p className="text-xs text-red-600">{r.error}</p>
                  )}
                  {r.payload != null && (
                    <details className="mt-1">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                        View prepared payload
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-900 text-green-400 rounded p-3 overflow-auto max-h-48 font-mono">
                        {JSON.stringify(r.payload, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepBadge({ n, done }: { n: number; done: boolean }) {
  return (
    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${done ? 'bg-[var(--mews-primary-pink)] text-[var(--mews-night-black)]' : 'bg-gray-200 text-gray-500'}`}>
      {done ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : n}
    </span>
  );
}

function StatusIcon({ status }: { status: PushResult['status'] }) {
  if (status === 'pushed') {
    return <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
  }
  if (status === 'failed') {
    return <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
  }
  return <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
