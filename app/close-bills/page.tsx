'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SearchableSelect from '@/components/SearchableSelect';

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

export default function CloseBillsPage() {
  const router = useRouter();
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [environmentsLoading, setEnvironmentsLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [manualAddLoading, setManualAddLoading] = useState(false);
  const [manualAddMessage, setManualAddMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    fetchEnvironments();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (showConfirmDialog) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [showConfirmDialog]);

  const handleDialogClose = useCallback(() => {
    setShowConfirmDialog(false);
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

  const handleCloseBillsClick = () => {
    if (!selectedEnvironment) return;
    setShowConfirmDialog(true);
  };

  const handleCloseBillsConfirm = async () => {
    setShowConfirmDialog(false);
    setClosing(true);

    try {
      await fetch('/api/close-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enterpriseId: selectedEnvironment })
      });

      router.push('/logs');
    } catch (error) {
      router.push('/logs');
    }
  };

  return (
    <>
      <main className="min-h-screen bg-mews-linen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Close Bills</h1>
            <p className="text-gray-600">Close all open bills for a sandbox</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            {/* Sandbox Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="selectedEnvironment" className="text-sm font-medium text-gray-700">
                  Select Sandbox *
                </label>
                <button
                  type="button"
                  onClick={openManualAddModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Add environment manually"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                </button>
              </div>
              {environmentsLoading ? (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  Loading sandboxes...
                </div>
              ) : (
                <SearchableSelect
                  id="selectedEnvironment"
                  name="selectedEnvironment"
                  value={selectedEnvironment}
                  onChange={(val) => setSelectedEnvironment(val)}
                  options={environments.map((env) => ({
                    value: env.enterpriseId,
                    label: `${env.propertyName || env.enterpriseName} (${env.enterpriseId})`
                  }))}
                  placeholder="-- Select a sandbox --"
                />
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

            {/* Close Bills Button */}
            <button
              onClick={handleCloseBillsClick}
              disabled={!selectedEnvironment || closing}
              className={`w-full py-3 px-4 font-semibold rounded-lg transition-colors ${
                !selectedEnvironment || closing
                  ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                  : 'bg-warning-600 text-white hover:bg-warning-700'
              }`}
            >
              {closing ? 'Closing Bills...' : 'Close Bills'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              This will post payments and close all open bills in the selected sandbox
            </p>
          </div>
        </div>
      </main>

      {/* Manual Add Environment Modal */}
      {showManualAdd && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50" onClick={closeManualAddModal}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
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

      {/* Close Bills Confirmation Dialog */}
      <dialog
        ref={dialogRef}
        onClose={handleDialogClose}
        aria-labelledby="close-bills-dialog-title"
        className="rounded-xl shadow-xl max-w-md w-full p-6 backdrop:bg-gray-900/50"
      >
        <h2 id="close-bills-dialog-title" className="text-xl font-semibold text-gray-900 mb-4">
          Confirm Close Bills
        </h2>
        <p className="text-gray-700 mb-4">
          This will perform the following actions:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
          <li>Fetch all open bills from the sandbox</li>
          <li>Post an external cash payment for each bill with a non-zero balance</li>
          <li>Close all open bills</li>
        </ul>
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirmDialog(false)}
            className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCloseBillsConfirm}
            className="flex-1 py-2 px-4 bg-warning-600 text-white font-semibold rounded-lg hover:bg-warning-700 transition-colors"
          >
            Yes, Close Bills
          </button>
        </div>
      </dialog>
    </>
  );
}
