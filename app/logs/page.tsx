'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Stats embedded in environment log's operationDetails
interface CustomerStats {
  status: 'processing' | 'completed' | 'failed';
  total: number;
  success: number;
  failed: number;
}

interface ReservationStats {
  status: 'processing' | 'completed' | 'failed';
  total: number;
  success: number;
  failed: number;
  byState?: Record<string, number>;
}

interface EnvironmentSetupStats {
  customers?: CustomerStats;
  reservations?: ReservationStats;
}

interface BaseLog {
  id: string;
  logType: 'environment' | 'reset' | 'demo_filler';
  type: 'environment' | 'reset' | 'demo_filler'; // Backwards compat
  timestamp: string;
  enterpriseId?: string;
  enterpriseName?: string;
  status: string;
  completedAt?: string;
  errorMessage?: string;
}

interface EnvironmentLog extends BaseLog {
  logType: 'environment';
  type: 'environment';
  propertyName: string;
  customerName: string;
  customerEmail: string;
  propertyCountry: string;
  propertyType: string;
  loginUrl: string;
  loginEmail: string;
  loginPassword: string;
  status: 'building' | 'processing' | 'completed' | 'failed';
  requestorEmail?: string;
  durationDays?: number;
  salesforceAccountId?: string;
  operationDetails?: EnvironmentSetupStats;
}

interface ResetLog extends BaseLog {
  logType: 'reset';
  type: 'reset';
  status: 'processing' | 'completed' | 'failed';
  currentStep: number;
  totalSteps: number;
  operationDetails?: any;
}

interface DemoFillerLog extends BaseLog {
  logType: 'demo_filler';
  type: 'demo_filler';
  status: 'processing' | 'completed' | 'failed';
  totalItems: number;
  successCount: number;
  failureCount: number;
  operationDetails?: { byState?: Record<string, number> };
}

type UnifiedLog = EnvironmentLog | ResetLog | DemoFillerLog;

export default function LogsPage() {
  const [logs, setLogs] = useState<UnifiedLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Initial fetch
    fetchLogs();

    // Set up polling interval (10 seconds)
    const intervalId = setInterval(() => {
      fetchLogsInBackground();
    }, 10000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/logs');
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs);
        setLastUpdated(new Date());
      } else {
        setError('Failed to load logs');
      }
    } catch (err) {
      setError('Error fetching logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogsInBackground = async () => {
    try {
      const response = await fetch('/api/logs');
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs);
        setLastUpdated(new Date());
      }
    } catch (err) {
      // Silent failure - log to console but don't disrupt UI
      console.error('Background log fetch failed:', err);
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const copyAllLoginDetails = (log: EnvironmentLog) => {
    const loginDetails = `Login URL: ${log.loginUrl}\nEmail: ${log.loginEmail}\nPassword: ${log.loginPassword}`;
    navigator.clipboard.writeText(loginDetails);
  };

  const getLogTypeLabel = (type: UnifiedLog['type']) => {
    switch (type) {
      case 'environment':
        return { label: 'New Environment', color: 'bg-blue-100 text-blue-800' };
      case 'reset':
        return { label: 'Environment Reset', color: 'bg-purple-100 text-purple-800' };
      case 'demo_filler':
        return { label: 'Demo Filler', color: 'bg-orange-100 text-orange-800' };
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">
              Logs
            </h1>

            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Last updated: {getTimeAgo(lastUpdated)}
                </span>
              )}
              <button
                onClick={async () => {
                  setIsRefreshing(true);
                  await fetchLogs();
                  setIsRefreshing(false);
                }}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
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
              <p className="text-lg">No environments created yet.</p>
              <Link
                href="/"
                className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first trial →
              </Link>
            </div>
          )}

          {!loading && !error && logs.length > 0 && (
            <div className="space-y-3">
              <div className="mb-3 text-xs text-gray-600">
                Total environments: {logs.length}
              </div>

              {logs.map((log) => {
                const statusStyles = {
                  building: {
                    card: 'bg-blue-50 border-blue-200',
                    badge: 'bg-blue-200 text-blue-800'
                  },
                  processing: {
                    card: 'bg-yellow-50 border-yellow-200',
                    badge: 'bg-yellow-200 text-yellow-800'
                  },
                  // Legacy status - alias to processing
                  Updating: {
                    card: 'bg-yellow-50 border-yellow-200',
                    badge: 'bg-yellow-200 text-yellow-800'
                  },
                  completed: {
                    card: 'bg-green-50 border-green-200',
                    badge: 'bg-green-200 text-green-800'
                  },
                  failed: {
                    card: 'bg-red-50 border-red-200',
                    badge: 'bg-red-200 text-red-800'
                  },
                  // Legacy status - alias to failed
                  failure: {
                    card: 'bg-red-50 border-red-200',
                    badge: 'bg-red-200 text-red-800'
                  }
                };
                const style = statusStyles[log.status as keyof typeof statusStyles] || statusStyles.completed;
                const typeInfo = getLogTypeLabel(log.type);

                // Get display name based on log type
                const displayName = log.type === 'environment' && 'propertyName' in log
                  ? log.propertyName
                  : log.enterpriseName || log.enterpriseId || 'Unknown';

                return (
                  <div
                    key={log.id}
                    className={`border rounded-lg p-4 ${style.card}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800">
                          {displayName}
                        </h2>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {formatDate(log.timestamp)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.badge}`}>
                        {log.status === 'building' && '🏗️ Building'}
                        {(log.status === 'processing' || log.status === 'Updating') && '⏳ Processing'}
                        {log.status === 'completed' && '✅ Completed'}
                        {(log.status === 'failed' || log.status === 'failure') && '❌ Failed'}
                      </span>
                    </div>

                  {/* Environment-specific content */}
                  {log.type === 'environment' && (
                    <>
                      {/* Operation Details Section */}
                      {log.operationDetails && (log.operationDetails.customers || log.operationDetails.reservations) && (
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <h3 className="text-xs font-semibold text-gray-700 mb-2">Setup Progress</h3>

                          <div className="space-y-2 text-sm">
                            {/* Customers */}
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 flex items-center gap-1">
                                <span>👥</span> Customers:
                              </span>
                              <span className="font-medium text-gray-800">
                                {log.operationDetails.customers
                                  ? `${log.operationDetails.customers.success} / ${log.operationDetails.customers.total}`
                                  : 'Pending'}
                                {log.operationDetails.customers?.status === 'processing' && <span className="text-yellow-600 ml-1">⏳</span>}
                              </span>
                            </div>

                            {/* Reservations */}
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 flex items-center gap-1">
                                <span>🏨</span> Reservations:
                              </span>
                              <span className="font-medium text-gray-800">
                                {log.operationDetails.reservations
                                  ? `${log.operationDetails.reservations.success} / ${log.operationDetails.reservations.total}`
                                  : 'Pending'}
                                {log.operationDetails.reservations?.status === 'processing' && <span className="text-yellow-600 ml-1">⏳</span>}
                              </span>
                            </div>

                            {/* State Breakdown */}
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

                            {/* Error indicators */}
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
                          <button
                            onClick={() => copyAllLoginDetails(log)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1.5 rounded hover:bg-blue-50 transition-colors"
                          >
                            Copy Login Details
                          </button>
                        </div>
                      )}

                      {(log.status === 'failed' || log.status === 'failure') && log.errorMessage && (
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <h3 className="font-semibold text-gray-800 text-sm mb-2">Error Details</h3>
                          <pre className="bg-white rounded p-2 text-xs overflow-x-auto text-gray-700">
                            {log.errorMessage}
                          </pre>
                        </div>
                      )}
                    </>
                  )}

                  {/* Reset-specific content */}
                  {log.type === 'reset' && (
                    <>
                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Progress:</span>
                            <span className="font-medium text-gray-800">
                              Step {log.currentStep} of {log.totalSteps}
                            </span>
                          </div>
                          {log.completedAt && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Completed:</span>
                              <span className="font-medium text-gray-800">
                                {formatDate(log.completedAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {log.status === 'processing' && (
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <div className="flex items-center gap-2 text-yellow-700">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-700"></div>
                            <p className="text-xs font-medium">Resetting environment...</p>
                          </div>
                        </div>
                      )}

                      {log.status === 'failed' && log.errorMessage && (
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <h3 className="font-semibold text-gray-800 text-sm mb-2">Error Details</h3>
                          <pre className="bg-white rounded p-2 text-xs overflow-x-auto text-gray-700">
                            {log.errorMessage}
                          </pre>
                        </div>
                      )}
                    </>
                  )}

                  {/* Demo Filler-specific content */}
                  {log.type === 'demo_filler' && (
                    <>
                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 flex items-center gap-1">
                              <span>🏨</span> Reservations:
                            </span>
                            <span className="font-medium text-gray-800">
                              {log.successCount} / {log.totalItems}
                            </span>
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
                              <span className="font-medium text-gray-800">
                                {formatDate(log.completedAt)}
                              </span>
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
                          <pre className="bg-white rounded p-2 text-xs overflow-x-auto text-gray-700">
                            {log.errorMessage}
                          </pre>
                        </div>
                      )}
                    </>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
