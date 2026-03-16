'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchableSelect from '@/components/SearchableSelect';
import DashboardTab from '@/components/control-centre/DashboardTab';
import OperationsTab from '@/components/control-centre/OperationsTab';
import ScenariosTab from '@/components/control-centre/ScenariosTab';
import IbeTab from '@/components/control-centre/IbeTab';
import OtaTab from '@/components/control-centre/OtaTab';
import DoorsTab from '@/components/control-centre/DoorsTab';
import ImportTab from '@/components/control-centre/ImportTab';
import type { DashboardMetrics } from '@/types/control-centre';

interface Environment {
  enterpriseId: string;
  enterpriseName: string;
  propertyName?: string;
}

type Tab = 'dashboard' | 'operations' | 'scenarios' | 'ibe' | 'ota' | 'doors' | 'import';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'operations', label: 'Operations' },
  { key: 'scenarios', label: 'Scenarios' },
  { key: 'ibe', label: 'IBE' },
  { key: 'ota', label: 'OTA' },
  { key: 'doors', label: 'Doors' },
  { key: 'import', label: 'Import' },
];

function ControlCentreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [environmentsLoading, setEnvironmentsLoading] = useState(false);
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'dashboard');

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [manualAddLoading, setManualAddLoading] = useState(false);
  const [manualAddMessage, setManualAddMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchEnvironments();
  }, []);

  const fetchEnvironments = async () => {
    setEnvironmentsLoading(true);
    try {
      const res = await fetch('/api/environments/list');
      const data = await res.json();
      if (data.success) {
        const sorted = (data.environments || []).sort((a: Environment, b: Environment) => {
          const nameA = (a.propertyName || a.enterpriseName || '').toLowerCase();
          const nameB = (b.propertyName || b.enterpriseName || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setEnvironments(sorted);
      }
    } catch (e) {
      console.error('Failed to fetch environments:', e);
    } finally {
      setEnvironmentsLoading(false);
    }
  };

  const fetchMetrics = async (enterpriseId: string) => {
    if (!enterpriseId) return;
    setMetricsLoading(true);
    try {
      const res = await fetch('/api/control-centre/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enterpriseId }),
      });
      const data = await res.json();
      if (data.success) setMetrics(data.metrics);
    } catch (e) {
      console.error('Failed to fetch metrics:', e);
    } finally {
      setMetricsLoading(false);
    }
  };

  // Dashboard auto-refresh
  useEffect(() => {
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);

    if (activeTab === 'dashboard' && selectedEnterpriseId) {
      fetchMetrics(selectedEnterpriseId);
      refreshIntervalRef.current = setInterval(() => fetchMetrics(selectedEnterpriseId), 30000);
    }

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [activeTab, selectedEnterpriseId]);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    router.push(`/control-centre?tab=${tab}`, { scroll: false });
  };

  const handleManualAdd = async () => {
    if (!manualToken.trim()) return;
    setManualAddLoading(true);
    setManualAddMessage(null);
    try {
      const res = await fetch('/api/store-environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: manualToken.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setManualAddMessage({ type: 'success', text: `Added: ${data.data.enterpriseName}` });
        setManualToken('');
        await fetchEnvironments();
      } else {
        setManualAddMessage({ type: 'error', text: data.error || 'Failed to add environment' });
      }
    } catch {
      setManualAddMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setManualAddLoading(false);
    }
  };

  const isDoorsEnabled = selectedEnterpriseId === (process.env.NEXT_PUBLIC_VOSTIO_ENTERPRISE_ID || '');

  return (
    <main className="min-h-screen bg-mews-linen py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control Centre</h1>
          <p className="text-gray-500 text-sm mt-1">Operational tools for managing sandbox properties</p>
        </div>

        {/* Property Selector */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Select Property</label>
            <button
              type="button"
              onClick={() => { setManualToken(''); setManualAddMessage(null); setShowManualAdd(true); }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Add environment manually"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
            </button>
          </div>
          {environmentsLoading ? (
            <div className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
              Loading properties...
            </div>
          ) : (
            <SearchableSelect
              id="selectedEnvironment"
              name="selectedEnvironment"
              value={selectedEnterpriseId}
              onChange={val => {
                setSelectedEnterpriseId(val);
                setMetrics(null);
              }}
              options={environments.map(env => ({
                value: env.enterpriseId,
                label: `${env.propertyName || env.enterpriseName} (${env.enterpriseId})`,
              }))}
              placeholder="-- Select a property --"
              className="w-full px-4 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          )}
        </div>

        {/* Tab Bar */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex overflow-x-auto border-b border-gray-200">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => switchTab(tab.key)}
                disabled={!selectedEnterpriseId}
                className={`flex-shrink-0 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                } ${!selectedEnterpriseId ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {!selectedEnterpriseId ? (
              <p className="text-sm text-gray-400 text-center py-8">Select a property above to get started.</p>
            ) : (
              <>
                {activeTab === 'dashboard' && <DashboardTab metrics={metrics} loading={metricsLoading} />}
                {activeTab === 'operations' && <OperationsTab enterpriseId={selectedEnterpriseId} />}
                {activeTab === 'scenarios' && <ScenariosTab enterpriseId={selectedEnterpriseId} />}
                {activeTab === 'ibe' && <IbeTab enterpriseId={selectedEnterpriseId} />}
                {activeTab === 'ota' && <OtaTab enterpriseId={selectedEnterpriseId} />}
                {activeTab === 'doors' && <DoorsTab enterpriseId={selectedEnterpriseId} isEnabled={isDoorsEnabled} />}
                {activeTab === 'import' && <ImportTab enterpriseId={selectedEnterpriseId} />}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Manual Add Modal */}
      {showManualAdd && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50" onClick={() => setShowManualAdd(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Add existing environment</h2>
            <p className="text-sm text-gray-500 mb-5">Paste an access token to add an environment without waiting for the webhook.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                <input
                  type="text"
                  value={manualToken}
                  onChange={e => setManualToken(e.target.value)}
                  placeholder="Paste access token here"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              {manualAddMessage && (
                <p className={`text-sm ${manualAddMessage.type === 'success' ? 'text-success-600' : 'text-error-600'}`}>
                  {manualAddMessage.text}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowManualAdd(false)}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  {manualAddMessage?.type === 'success' ? 'Done' : 'Cancel'}
                </button>
                {manualAddMessage?.type !== 'success' && (
                  <button
                    type="button"
                    onClick={handleManualAdd}
                    disabled={!manualToken.trim() || manualAddLoading}
                    className={`flex-1 py-2 px-4 font-semibold rounded-lg transition-colors ${
                      !manualToken.trim() || manualAddLoading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-700 text-white hover:bg-gray-800'
                    }`}
                  >
                    {manualAddLoading ? 'Storing...' : 'Store'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ControlCentrePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-mews-linen" />}>
      <ControlCentreContent />
    </Suspense>
  );
}
