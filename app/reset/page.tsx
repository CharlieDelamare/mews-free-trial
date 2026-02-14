'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Environment {
  enterpriseId: string;
  enterpriseName: string;
  propertyName?: string;
  type: 'trial' | 'manual';
  status?: string;
  customerEmail?: string;
  createdAt: Date;
  accessTokenId: number;
}

export default function ResetSandboxPage() {
  const router = useRouter();
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [environmentsLoading, setEnvironmentsLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [manualAddLoading, setManualAddLoading] = useState(false);
  const [manualAddMessage, setManualAddMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const CHEVRON_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E")`;
  const selectStyle = { backgroundImage: CHEVRON_SVG } as const;
  const selectClasses = "w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-no-repeat bg-[length:16px_16px] bg-[position:right_12px_center]";

  useEffect(() => {
    fetchEnvironments();
  }, []);

  const fetchEnvironments = async () => {
    setEnvironmentsLoading(true);
    try {
      const response = await fetch('/api/environments/list');
      const data = await response.json();
      if (data.success) {
        const sortedEnvironments = (data.environments || []).sort((a: any, b: any) => {
          const nameA = (a.propertyName || a.enterpriseName || '').toLowerCase();
          const nameB = (b.propertyName || b.enterpriseName || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setEnvironments(sortedEnvironments);
      }
    } catch (error) {
      console.error('Failed to fetch environments:', error);
    } finally {
      setEnvironmentsLoading(false);
    }
  };

  const openManualAddModal = () => {
    setManualToken('');
    setManualAddMessage(null);
    setShowManualAdd(true);
  };

  const closeManualAddModal = () => {
    setShowManualAdd(false);
    setManualToken('');
    setManualAddMessage(null);
  };

  const handleManualAdd = async () => {
    if (!manualToken.trim()) return;
    setManualAddLoading(true);
    setManualAddMessage(null);
    try {
      const response = await fetch('/api/store-environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: manualToken.trim() })
      });
      const data = await response.json();
      if (data.success) {
        setManualAddMessage({ type: 'success', text: `Added: ${data.data.enterpriseName}` });
        setManualToken('');
        await fetchEnvironments();
      } else {
        setManualAddMessage({ type: 'error', text: data.error || 'Failed to add environment' });
      }
    } catch (error) {
      setManualAddMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setManualAddLoading(false);
    }
  };

  const handleResetClick = () => {
    if (!selectedEnvironment) return;
    setShowConfirmDialog(true);
  };

  const handleResetConfirm = async () => {
    setShowConfirmDialog(false);
    setResetting(true);

    try {
      await fetch('/api/reset-environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enterpriseId: selectedEnvironment })
      });

      // Redirect to logs page regardless of response
      router.push('/logs');
    } catch (error) {
      // Still redirect to logs even on network error
      router.push('/logs');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Sandbox</h1>
          <p className="text-gray-600">Reset an existing sandbox</p>
          <button
            type="button"
            onClick={openManualAddModal}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Add environment manually
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          {/* Sandbox Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Sandbox *
            </label>
            {environmentsLoading ? (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Loading sandboxes...
              </div>
            ) : (
              <select
                name="selectedEnvironment"
                value={selectedEnvironment}
                onChange={(e) => setSelectedEnvironment(e.target.value)}
                className={selectClasses}
                style={selectStyle}
              >
                <option value="">-- Select a sandbox --</option>
                {environments.map((env) => (
                  <option key={env.enterpriseId} value={env.enterpriseId}>
                    {env.propertyName || env.enterpriseName} ({env.enterpriseId})
                  </option>
                ))}
              </select>
            )}
            {!environmentsLoading && environments.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No sandboxes found. Create a sandbox or add one manually.
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              If your property isn't available in the dropdown, please add the "Mews Sandbox Manager" integration in the Marketplace within Mews.
            </p>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleResetClick}
            disabled={!selectedEnvironment || resetting}
            className={`w-full py-3 px-4 font-semibold rounded-lg transition-colors ${
              !selectedEnvironment || resetting
                ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {resetting ? 'Resetting Sandbox...' : 'Reset Sandbox'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Resetting will cancel reservations, close bills, and create fresh sample data for the next 7 days
          </p>
        </div>

      </div>

      {/* Manual Add Environment Modal */}
      {showManualAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Add existing environment
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Paste an access token to add an environment without waiting for the webhook.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Token
                </label>
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Paste access token here"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {manualAddMessage && (
                <p className={`text-sm ${manualAddMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {manualAddMessage.text}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeManualAddModal}
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

      {/* Reset Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Confirm Sandbox Reset
            </h2>
            <p className="text-gray-700 mb-4">
              This will perform the following actions:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
              <li>Cancel all confirmed and optional reservations</li>
              <li>Close all open bills (with automatic payments)</li>
              <li>Create fresh sample reservations for the next 7 days</li>
            </ul>
            <p className="text-sm text-red-600 mb-6">
              <strong>Note:</strong> Checked-in guests (Started reservations) will NOT be affected.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                className="flex-1 py-2 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Reset Sandbox
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
