'use client';

import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { UnifiedLog, EnvironmentLog, ResetLog, DemoFillerLog, CloseBillsLog, ControlCentreLog } from '@/types/unified-log';
import { StatusBadge, getStatusCardStyle } from '@/components/StatusBadge';
import { CopyButton } from '@/components/CopyButton';
import { Pagination } from '@/components/Pagination';
import { useAdaptivePolling } from '@/hooks/useAdaptivePolling';
import { ApiCallLogs } from '@/components/ApiCallLogs';

const ITEMS_PER_PAGE = 20;

function getLogTypeLabel(type: UnifiedLog['logType']) {
  switch (type) {
    case 'environment':
      return { label: 'New Sandbox', color: 'bg-info-100 text-info-700' };
    case 'reset':
      return { label: 'Sandbox Reset', color: 'bg-primary-100 text-primary-700' };
    case 'demo_filler':
      return { label: 'Sandbox Filler', color: 'bg-warning-50 text-warning-700' };
    case 'close_bills':
      return { label: 'Close Bills', color: 'bg-warning-100 text-warning-700' };
    case 'morning_prep':
      return { label: 'Morning Prep', color: 'bg-blue-100 text-blue-700' };
    case 'auto_checkout':
      return { label: 'Auto Checkout', color: 'bg-green-100 text-green-700' };
    case 'scenario':
      return { label: 'Scenario', color: 'bg-purple-100 text-purple-700' };
    case 'doors':
      return { label: 'Door Provisioning', color: 'bg-gray-100 text-gray-700' };
    default:
      return { label: 'Unknown', color: 'bg-gray-100 text-gray-700' };
  }
}

function formatDate(timestamp: string | Date) {
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
  let text = `Login URL: ${log.loginUrl}\nEmail: ${log.loginEmail}\nPassword: ${log.loginPassword}`;
  if (log.signInUrl) {
    text += `\nSign-in URL (passwordless): ${log.signInUrl}`;
  }
  return text;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<UnifiedLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const currentPageRef = useRef(currentPage);
  const debouncedSearchRef = useRef(debouncedSearch);
  currentPageRef.current = currentPage;
  debouncedSearchRef.current = debouncedSearch;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPage = useCallback(async (page: number, searchQuery: string, signal?: AbortSignal) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(ITEMS_PER_PAGE) });
    if (searchQuery) params.set('search', searchQuery);
    const response = await fetch(`/api/logs?${params}`, { signal });
    const data = await response.json();
    if (data.success) {
      setLogs(data.logs);
      setTotalCount(data.totalCount ?? data.logs.length);
      setError('');
      return { hasActiveOperations: data.hasActiveOperations ?? false };
    }
    throw new Error(data.error || 'Failed to fetch logs');
  }, []);

  const fetchLogsForPolling = useCallback(async (signal?: AbortSignal) => {
    return fetchPage(currentPageRef.current, debouncedSearchRef.current, signal);
  }, [fetchPage]);

  const { isPolling, lastFetchedAt, refresh } = useAdaptivePolling({
    fetchFn: fetchLogsForPolling,
    fastIntervalMs: 5000,
    idleIntervalMs: 60000,
    enabled: !loading,
  });

  useEffect(() => {
    const controller = new AbortController();
    const initialFetch = async () => {
      try {
        setLoading(true);
        await fetchPage(1, debouncedSearch, controller.signal);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError('Error fetching logs');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    initialFetch();
    return () => controller.abort();
  }, [fetchPage, debouncedSearch]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      await fetchPage(page, debouncedSearch);
    } catch (err) {
      // Error handled by polling
    }
  };

  return (
    <main className="min-h-screen bg-mews-linen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Logs</h1>
            <div className="flex items-center gap-3">
              {isPolling && (
                <span className="flex items-center gap-1.5 text-xs text-primary-600">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                  </span>
                  Auto-updating
                </span>
              )}
              {!isPolling && lastFetchedAt && (
                <span className="text-xs text-gray-500">
                  Updated {formatRelativeTime(lastFetchedAt)}
                </span>
              )}
              <button
                onClick={() => startTransition(() => { refresh(); })}
                className="min-w-[36px] px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Refresh logs"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="mb-4">
            <input
              type="search"
              placeholder="Search by property name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Loading logs...</p>
            </div>
          )}

          {error && (
            <div className="bg-error-50 border border-error-100 rounded-lg p-4 mb-6">
              <p className="text-error-700">{error}</p>
            </div>
          )}

          {!loading && !error && logs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {debouncedSearch ? (
                <p className="text-lg">No logs found for &ldquo;{debouncedSearch}&rdquo;.</p>
              ) : (
                <>
                  <p className="text-lg">No sandboxes created yet.</p>
                  <Link href="/" className="mt-4 inline-block text-primary-600 hover:text-info-700 font-medium">
                    Create your first sandbox &rarr;
                  </Link>
                </>
              )}
            </div>
          )}

          {!loading && !error && logs.length > 0 && (
            <div className="space-y-3">
              {logs.map((log) => {
                const cardStyle = getStatusCardStyle(log.status);
                const typeInfo = getLogTypeLabel(log.logType);
                const displayName = log.logType === 'environment' && 'propertyName' in log
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
                        {'requestorEmail' in log && log.requestorEmail && (
                          <p className="text-xs text-gray-500 mt-0.5">Requested by {log.requestorEmail}</p>
                        )}
                      </div>
                      <StatusBadge status={log.status} />
                    </div>

                    {log.logType === 'environment' && <EnvironmentContent log={log} />}
                    {log.logType === 'reset' && <ResetContent log={log} />}
                    {log.logType === 'demo_filler' && <DemoFillerContent log={log} />}
                    {log.logType === 'close_bills' && <CloseBillsContent log={log as CloseBillsLog} />}
                    {(log.logType === 'morning_prep' || log.logType === 'auto_checkout' || log.logType === 'scenario' || log.logType === 'doors') && (
                      <ControlCentreContent log={log as ControlCentreLog} />
                    )}
                  </div>
                );
              })}

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
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
                {log.operationDetails.customers?.status === 'processing' && <span className="text-warning-600 ml-1">⏳</span>}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-1"><span>🏨</span> Reservations:</span>
              <span className="font-medium text-gray-800">
                {log.operationDetails.reservations
                  ? `${log.operationDetails.reservations.success} / ${log.operationDetails.reservations.total}`
                  : 'Pending'}
                {log.operationDetails.reservations?.status === 'processing' && <span className="text-warning-600 ml-1">⏳</span>}
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
                  <summary className="cursor-pointer text-warning-600 font-medium hover:text-warning-700">
                    ⚠️ {log.operationDetails.reservations.failures.length} reservation{log.operationDetails.reservations.failures.length !== 1 ? 's' : ''}{' '}
                    {log.operationDetails.reservations.failures.every(f => f.skipped) ? 'skipped' : 'failed'}
                  </summary>
                  <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                    {log.operationDetails.reservations.failures.map((failure, idx) => (
                      <div key={idx} className="bg-warning-50 rounded p-2 text-gray-700">
                        <div className="font-medium text-warning-700">
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
              <div className="text-xs text-error-600 flex items-center gap-1 mt-2">
                <span>⚠️</span>
                <span>Setup encountered errors</span>
              </div>
            )}
          </div>
        </div>
      )}

      {(log.status === 'building' || log.status === 'processing') && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className={`flex items-center gap-2 ${log.status === 'building' ? 'text-info-700' : 'text-warning-700'}`}>
            <div className={`animate-spin rounded-full h-4 w-4 border-b-2 ${log.status === 'building' ? 'border-info-700' : 'border-warning-700'}`}></div>
            <p className="text-xs font-medium">
              {log.status === 'building' && `Creating ${log.propertyType} for ${log.durationDays || 30} days`}
              {log.status === 'processing' && 'Setting up customers and reservations...'}
            </p>
          </div>
        </div>
      )}

      {(log.status === 'completed' || log.status === 'processing') && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <CopyButton
            text={buildLoginDetailsText(log)}
            label="Copy Login Details"
            toastMessage="Login details copied!"
          />
        </div>
      )}

      {log.status === 'failed' && log.errorMessage && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <h3 className="font-semibold text-gray-800 text-sm mb-2">Error Details</h3>
          <pre className="bg-white rounded p-2 text-xs overflow-x-auto text-gray-700">{log.errorMessage}</pre>
        </div>
      )}

      {log.status !== 'building' && <ApiCallLogs logId={log.id} />}
    </>
  );
}

function ResetContent({ log }: { log: ResetLog }) {
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
          <div className="flex items-center gap-2 text-warning-700">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-warning-700"></div>
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

      <ApiCallLogs logId={log.id} />
    </>
  );
}

function DemoFillerContent({ log }: { log: DemoFillerLog }) {
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
              <span className="text-error-600">Failed:</span>
              <span className="font-medium text-error-700">{log.failureCount}</span>
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
          <div className="flex items-center gap-2 text-warning-700">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-warning-700"></div>
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

      <ApiCallLogs logId={log.id} />
    </>
  );
}

function ControlCentreContent({ log }: { log: ControlCentreLog }) {
  const scenarioType = log.logType === 'scenario'
    ? (log.operationDetails?.scenarioType as string | undefined)
    : undefined;

  return (
    <>
      <div className="border-t border-gray-200 pt-3 mt-3">
        <div className="space-y-2 text-sm">
          {scenarioType && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Scenario:</span>
              <span className="font-medium text-gray-800 capitalize">{scenarioType.replace('_', ' ')}</span>
            </div>
          )}
          {log.totalItems != null && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Items processed:</span>
              <span className="font-medium text-gray-800">{log.successCount ?? 0} / {log.totalItems}</span>
            </div>
          )}
          {(log.failureCount ?? 0) > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-error-600">Failed:</span>
              <span className="font-medium text-error-700">{log.failureCount}</span>
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
          <div className="flex items-center gap-2 text-warning-700">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-warning-700"></div>
            <p className="text-xs font-medium">Running...</p>
          </div>
        </div>
      )}

      {log.status === 'failed' && log.errorMessage && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <h3 className="font-semibold text-gray-800 text-sm mb-2">Error Details</h3>
          <pre className="bg-white rounded p-2 text-xs overflow-x-auto text-gray-700">{log.errorMessage}</pre>
        </div>
      )}

      <ApiCallLogs logId={log.id} />
    </>
  );
}

function CloseBillsContent({ log }: { log: CloseBillsLog }) {
  const details = log.operationDetails;
  const totalBills = details?.totalBills ?? log.totalItems;

  return (
    <>
      <div className="border-t border-gray-200 pt-3 mt-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Bills closed:</span>
            <span className="font-medium text-gray-800">{log.successCount} / {totalBills}</span>
          </div>
          {log.failureCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-error-600">Failed:</span>
              <span className="font-medium text-error-700">{log.failureCount}</span>
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
          <div className="flex items-center gap-2 text-warning-700">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-warning-700"></div>
            <p className="text-xs font-medium">Closing bills...</p>
          </div>
        </div>
      )}

      {log.status === 'failed' && log.errorMessage && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <h3 className="font-semibold text-gray-800 text-sm mb-2">Error Details</h3>
          <pre className="bg-white rounded p-2 text-xs overflow-x-auto text-gray-700">{log.errorMessage}</pre>
        </div>
      )}

      <ApiCallLogs logId={log.id} />
    </>
  );
}
