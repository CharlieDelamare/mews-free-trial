'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { UnifiedLog, EnvironmentLog } from '@/types/logs';
import { StatusBadge, getStatusCardStyle } from '@/components/StatusBadge';
import { CopyButton } from '@/components/CopyButton';
import { Pagination } from '@/components/Pagination';
import { useAdaptivePolling } from '@/hooks/useAdaptivePolling';

const ITEMS_PER_PAGE = 20;

function getLogTypeLabel(type: UnifiedLog['type']) {
  switch (type) {
    case 'environment':
      return { label: 'New Sandbox', color: 'bg-blue-100 text-blue-800' };
    case 'reset':
      return { label: 'Sandbox Reset', color: 'bg-purple-100 text-purple-800' };
    case 'demo_filler':
      return { label: 'Sandbox Filler', color: 'bg-orange-100 text-orange-800' };
  }
}

function formatDate(timestamp: string) {
  return new Date(timestamp).toLocaleString();
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return date.toLocaleTimeString();
}

function buildLoginDetailsText(log: EnvironmentLog): string {
  return `Login URL: ${log.loginUrl}\nEmail: ${log.loginEmail}\nPassword: ${log.loginPassword}`;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<UnifiedLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLogsForPolling = useCallback(async () => {
    const response = await fetch('/api/logs');
    const data = await response.json();
    if (data.success) {
      setLogs(data.logs);
      setError(''); // Clear any previous error state
      return { hasActiveOperations: data.hasActiveOperations ?? false };
    }
    throw new Error(data.error || 'Failed to fetch logs');
  }, []);

  const { isPolling, lastFetchedAt, refresh } = useAdaptivePolling({
    fetchFn: fetchLogsForPolling,
    fastIntervalMs: 5000,
    idleIntervalMs: 60000,
    enabled: !loading,
  });

  useEffect(() => {
    const initialFetch = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/logs');
        const data = await response.json();
        if (data.success) setLogs(data.logs);
        else setError('Failed to load logs');
      } catch (err) {
        setError('Error fetching logs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initialFetch();
  }, []);

  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentLogs = logs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            &larr; Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Logs</h1>
            <div className="flex items-center gap-3">
              {isPolling && (
                <span className="flex items-center gap-1.5 text-xs text-blue-600">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  Auto-updating
                </span>
              )}
              {!isPolling && lastFetchedAt && (
                <span className="text-xs text-gray-400">
                  Updated {formatRelativeTime(lastFetchedAt)}
                </span>
              )}
              <button
                onClick={refresh}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Refresh logs"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading logs...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!loading && !error && logs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No sandboxes created yet.</p>
              <Link href="/" className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium">
                Create your first sandbox &rarr;
              </Link>
            </div>
          )}

          {!loading && !error && logs.length > 0 && (
            <div className="space-y-3">
              {currentLogs.map((log) => {
                const cardStyle = getStatusCardStyle(log.status);
                const typeInfo = getLogTypeLabel(log.type);
                const displayName = log.type === 'environment' && 'propertyName' in log
                  ? log.propertyName
                  : log.enterpriseName || log.enterpriseId || 'Unknown';

                return (
                  <div key={log.id} className={`border rounded-lg p-4 ${cardStyle}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800">{displayName}</h2>
                        <p className="text-xs text-gray-600 mt-0.5">{formatDate(log.timestamp)}</p>
                      </div>
                      <StatusBadge status={log.status} />
                    </div>

                    {log.type === 'environment' && <EnvironmentContent log={log} />}
                    {log.type === 'reset' && <ResetContent log={log} />}
                    {log.type === 'demo_filler' && <DemoFillerContent log={log} />}
                  </div>
                );
              })}

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={logs.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function EnvironmentContent({ log }: { log: EnvironmentLog }) {
  return (
    <>
      {log.operationDetails && (log.operationDetails.customers || log.operationDetails.reservations) && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Setup Progress</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-1"><span>👥</span> Customers:</span>
              <span className="font-medium text-gray-800">
                {log.operationDetails.customers
                  ? `${log.operationDetails.customers.success} / ${log.operationDetails.customers.total}`
                  : 'Pending'}
                {log.operationDetails.customers?.status === 'processing' && <span className="text-yellow-600 ml-1">⏳</span>}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-1"><span>🏨</span> Reservations:</span>
              <span className="font-medium text-gray-800">
                {log.operationDetails.reservations
                  ? `${log.operationDetails.reservations.success} / ${log.operationDetails.reservations.total}`
                  : 'Pending'}
                {log.operationDetails.reservations?.status === 'processing' && <span className="text-yellow-600 ml-1">⏳</span>}
              </span>
            </div>

            {log.operationDetails.reservations?.byState && (
              <div className="ml-6 mt-1 space-y-1 text-xs">
                {Object.entries(log.operationDetails.reservations.byState)
                  .filter(([_, count]) => count > 0)
                  .map(([state, count]) => (
                    <div key={state} className="flex items-center justify-between text-gray-500">
                      <span>└─ {state}:</span>
                      <span className="font-mono">{count}</span>
                    </div>
                  ))}
              </div>
            )}

            {log.operationDetails.reservations?.failures && log.operationDetails.reservations.failures.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-200">
                <details className="text-xs">
                  <summary className="cursor-pointer text-orange-600 font-medium hover:text-orange-700">
                    ⚠️ {log.operationDetails.reservations.failures.length} reservation{log.operationDetails.reservations.failures.length !== 1 ? 's' : ''}{' '}
                    {log.operationDetails.reservations.failures.every(f => f.skipped) ? 'skipped' : 'failed'}
                  </summary>
                  <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                    {log.operationDetails.reservations.failures.map((failure, idx) => (
                      <div key={idx} className="bg-orange-50 rounded p-2 text-gray-700">
                        <div className="font-medium text-orange-800">
                          {failure.skipped ? '⏭️ Skipped' : '❌ Failed'}
                        </div>
                        <div className="mt-0.5">{failure.error}</div>
                        {(failure.checkInUtc || failure.checkOutUtc) && (
                          <div className="mt-1 text-gray-500 text-[10px]">
                            {failure.checkInUtc && <span>Check-in: {new Date(failure.checkInUtc).toLocaleDateString()}</span>}
                            {failure.checkInUtc && failure.checkOutUtc && <span> • </span>}
                            {failure.checkOutUtc && <span>Check-out: {new Date(failure.checkOutUtc).toLocaleDateString()}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}

            {(log.operationDetails.customers?.status === 'failed' || log.operationDetails.reservations?.status === 'failed') && (
              <div className="text-xs text-red-600 flex items-center gap-1 mt-2">
                <span>⚠️</span>
                <span>Setup encountered errors</span>
              </div>
            )}
          </div>
        </div>
      )}

      {(log.status === 'building' || log.status === 'processing' || log.status === 'Updating') && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className={`flex items-center gap-2 ${log.status === 'building' ? 'text-blue-700' : 'text-yellow-700'}`}>
            <div className={`animate-spin rounded-full h-4 w-4 border-b-2 ${log.status === 'building' ? 'border-blue-700' : 'border-yellow-700'}`}></div>
            <p className="text-xs font-medium">
              {log.status === 'building' && `Creating ${log.propertyType} for ${log.durationDays || 30} days`}
              {(log.status === 'processing' || log.status === 'Updating') && 'Setting up customers and reservations. Login details will appear when ready.'}
            </p>
          </div>
        </div>
      )}

      {log.status === 'completed' && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <CopyButton
            text={buildLoginDetailsText(log)}
            label="Copy Login Details"
            toastMessage="Login details copied!"
          />
        </div>
      )}

      {(log.status === 'failed' || log.status === 'failure') && log.errorMessage && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <h3 className="font-semibold text-gray-800 text-sm mb-2">Error Details</h3>
          <pre className="bg-white rounded p-2 text-xs overflow-x-auto text-gray-700">{log.errorMessage}</pre>
        </div>
      )}
    </>
  );
}

function ResetContent({ log }: { log: import('@/types/logs').ResetLog }) {
  return (
    <>
      <div className="border-t border-gray-200 pt-3 mt-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Progress:</span>
            <span className="font-medium text-gray-800">Step {log.currentStep} of {log.totalSteps}</span>
          </div>
          {log.completedAt && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium text-gray-800">{formatDate(log.completedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {log.status === 'processing' && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex items-center gap-2 text-yellow-700">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-700"></div>
            <p className="text-xs font-medium">Resetting sandbox...</p>
          </div>
        </div>
      )}

      {log.status === 'failed' && log.errorMessage && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <h3 className="font-semibold text-gray-800 text-sm mb-2">Error Details</h3>
          <pre className="bg-white rounded p-2 text-xs overflow-x-auto text-gray-700">{log.errorMessage}</pre>
        </div>
      )}
    </>
  );
}

function DemoFillerContent({ log }: { log: import('@/types/logs').DemoFillerLog }) {
  return (
    <>
      <div className="border-t border-gray-200 pt-3 mt-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 flex items-center gap-1"><span>🏨</span> Reservations:</span>
            <span className="font-medium text-gray-800">{log.successCount} / {log.totalItems}</span>
          </div>
          {log.failureCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-red-600">Failed:</span>
              <span className="font-medium text-red-800">{log.failureCount}</span>
            </div>
          )}
          {log.completedAt && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium text-gray-800">{formatDate(log.completedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {log.status === 'processing' && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex items-center gap-2 text-yellow-700">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-700"></div>
            <p className="text-xs font-medium">Creating reservations...</p>
          </div>
        </div>
      )}

      {log.status === 'failed' && log.errorMessage && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <h3 className="font-semibold text-gray-800 text-sm mb-2">Error Details</h3>
          <pre className="bg-white rounded p-2 text-xs overflow-x-auto text-gray-700">{log.errorMessage}</pre>
        </div>
      )}
    </>
  );
}
