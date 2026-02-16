'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ApiCallSummary, ApiCallGroupSummary } from '@/types/unified-log';

const GROUP_LABELS: Record<string, string> = {
  initial: 'Initial',
  setup: 'Setup',
  customers: 'Customers',
  reservations: 'Reservations',
  state_transitions: 'State Transitions',
  tasks: 'Tasks',
  bills: 'Bills',
};

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function StatusDot({ statusCode, success }: { statusCode: number | null; success: boolean }) {
  let color = 'bg-green-500';
  if (!success || (statusCode && statusCode >= 400)) {
    color = statusCode && statusCode >= 500 ? 'bg-red-500' : 'bg-red-400';
  } else if (statusCode && statusCode >= 300) {
    color = 'bg-yellow-500';
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${color} flex-shrink-0`} />;
}

function formatJson(text: string | null): string {
  if (!text) return '(empty)';
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return text;
  }
}

interface ApiCallDetailData {
  requestBody: string | null;
  responseBody: string | null;
  url: string;
}

function ApiCallRow({
  call,
  isExpanded,
  onToggle,
}: {
  call: ApiCallSummary;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [detail, setDetail] = useState<ApiCallDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (isExpanded && !detail) {
      setDetailLoading(true);
      fetch(`/api/logs/api-calls/${call.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.apiCall) {
            setDetail({
              requestBody: data.apiCall.requestBody,
              responseBody: data.apiCall.responseBody,
              url: data.apiCall.url,
            });
          }
        })
        .catch(err => console.error('Failed to fetch API call detail:', err))
        .finally(() => setDetailLoading(false));
    }
  }, [isExpanded, detail, call.id]);

  return (
    <div>
      <div
        onClick={onToggle}
        className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer text-xs font-mono transition-colors ${
          isExpanded ? 'bg-gray-100' : 'hover:bg-gray-50'
        } ${!call.success ? 'bg-red-50 hover:bg-red-100' : ''}`}
      >
        <span className="text-gray-400 w-16 flex-shrink-0">{formatTime(call.timestamp)}</span>
        <StatusDot statusCode={call.statusCode} success={call.success} />
        <span className="flex-1 truncate text-gray-700">{call.endpoint}</span>
        <span
          className={`w-8 text-right flex-shrink-0 ${
            call.statusCode && call.statusCode >= 400 ? 'text-red-600 font-medium' : 'text-gray-500'
          }`}
        >
          {call.statusCode || 'ERR'}
        </span>
        <span className="w-14 text-right text-gray-400 flex-shrink-0">
          {formatDuration(call.durationMs)}
        </span>
        <span className="text-gray-300 flex-shrink-0">{isExpanded ? '▾' : '▸'}</span>
      </div>

      {isExpanded && (
        <div className="bg-gray-900 text-gray-100 p-3 text-xs font-mono rounded mx-2 mb-1 overflow-hidden">
          {detailLoading ? (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
              Loading...
            </div>
          ) : detail ? (
            <>
              <div className="mb-2 text-gray-500 text-[10px]">{detail.url}</div>
              <div className="mb-3">
                <h4 className="text-gray-400 mb-1 text-[10px] uppercase tracking-wider">
                  Request Body
                </h4>
                <pre className="overflow-x-auto whitespace-pre-wrap text-green-300 max-h-48 overflow-y-auto">
                  {formatJson(detail.requestBody)}
                </pre>
              </div>
              <div>
                <h4 className="text-gray-400 mb-1 text-[10px] uppercase tracking-wider">
                  Response Body
                </h4>
                <pre
                  className={`overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto ${
                    call.success ? 'text-blue-300' : 'text-red-300'
                  }`}
                >
                  {formatJson(detail.responseBody)}
                </pre>
              </div>
              {call.errorMessage && (
                <div className="mt-2 text-red-400 border-t border-gray-700 pt-2">
                  {call.errorMessage}
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-500">Failed to load details</div>
          )}
        </div>
      )}
    </div>
  );
}

export function ApiCallLogs({ logId }: { logId: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [apiCalls, setApiCalls] = useState<ApiCallSummary[]>([]);
  const [groups, setGroups] = useState<ApiCallGroupSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedCallId, setExpandedCallId] = useState<number | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [hasData, setHasData] = useState<boolean | null>(null);

  const fetchApiCalls = useCallback(async (group?: string | null) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ logId });
      if (group) params.set('group', group);
      const res = await fetch(`/api/logs/api-calls?${params}`);
      const data = await res.json();
      if (data.success) {
        setApiCalls(data.apiCalls);
        setTotal(data.total);
        setSuccessCount(data.successCount);
        setFailureCount(data.failureCount);
        setGroups(data.groups);
        setHasData(data.total > 0);
      } else {
        setError(data.error || 'Failed to fetch');
        setHasData(false);
      }
    } catch {
      setError('Failed to fetch API call logs');
      setHasData(false);
    } finally {
      setLoading(false);
    }
  }, [logId]);

  useEffect(() => {
    if (isExpanded && hasData === null) {
      fetchApiCalls();
    }
  }, [isExpanded, hasData, fetchApiCalls]);

  const handleGroupFilter = (group: string | null) => {
    setActiveGroup(group);
    setExpandedCallId(null);
    fetchApiCalls(group);
  };

  const filteredCalls = apiCalls;

  const totalDurationMs = groups.reduce((sum, g) => sum + g.totalDurationMs, 0);

  // Don't render anything if we know there's no data
  if (hasData === false && !isExpanded) return null;

  return (
    <div className="border-t border-gray-200 pt-3 mt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors w-full text-left"
      >
        <span className="text-gray-400">{isExpanded ? '▾' : '▸'}</span>
        <span>API Logs</span>
        {hasData === true && (
          <span className="text-gray-400 font-normal">
            ({total} call{total !== 1 ? 's' : ''})
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="mt-2">
          {loading && apiCalls.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500 py-3">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-500"></div>
              Loading API logs...
            </div>
          )}

          {error && (
            <div className="text-xs text-red-600 py-2">{error}</div>
          )}

          {!loading && apiCalls.length === 0 && !error && (
            <div className="text-xs text-gray-400 py-2">No API calls logged yet.</div>
          )}

          {apiCalls.length > 0 && (
            <>
              {/* Summary bar */}
              <div className="flex items-center gap-3 text-[10px] mb-2 px-1">
                <span className="text-green-600 font-medium">{successCount} succeeded</span>
                {failureCount > 0 && (
                  <span className="text-red-600 font-medium">{failureCount} failed</span>
                )}
                <span className="text-gray-400">{formatDuration(totalDurationMs)} total</span>
              </div>

              {/* Group filter tabs */}
              {groups.length > 1 && (
                <div className="flex gap-1 mb-2 flex-wrap">
                  <button
                    onClick={() => handleGroupFilter(null)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      activeGroup === null
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All ({total})
                  </button>
                  {groups
                    .sort((a, b) => {
                      const order = ['initial', 'setup', 'customers', 'reservations', 'state_transitions', 'tasks', 'bills'];
                      return order.indexOf(a.group) - order.indexOf(b.group);
                    })
                    .map(g => (
                      <button
                        key={g.group}
                        onClick={() => handleGroupFilter(g.group)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                          activeGroup === g.group
                            ? 'bg-gray-800 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {GROUP_LABELS[g.group] || g.group} ({g.count})
                      </button>
                    ))}
                </div>
              )}

              {/* Call list */}
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded bg-white">
                {filteredCalls.map(call => (
                  <ApiCallRow
                    key={call.id}
                    call={call}
                    isExpanded={expandedCallId === call.id}
                    onToggle={() =>
                      setExpandedCallId(expandedCallId === call.id ? null : call.id)
                    }
                  />
                ))}
              </div>

              {loading && apiCalls.length > 0 && (
                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1 px-1">
                  <div className="animate-spin rounded-full h-2 w-2 border-b border-gray-400"></div>
                  Refreshing...
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
