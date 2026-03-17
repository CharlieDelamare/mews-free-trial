'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import SearchableSelect from '@/components/SearchableSelect';
import { useToast } from '@/components/Toast';

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

export default function SaveSandboxPage() {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [environmentsLoading, setEnvironmentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchEnvironments();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (showConfirmDialog) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
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
        const sorted = (data.environments || [])
          .sort((a: Environment, b: Environment) => {
            const nameA = (a.propertyName || a.enterpriseName || '').toLowerCase();
            const nameB = (b.propertyName || b.enterpriseName || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
        setEnvironments(sorted);
      }
    } catch (error) {
      console.error('Failed to fetch environments:', error);
    } finally {
      setEnvironmentsLoading(false);
    }
  };

  const handleSaveClick = () => {
    if (!selectedEnvironment) return;
    setShowConfirmDialog(true);
  };

  const handleSaveConfirm = async () => {
    setShowConfirmDialog(false);
    setSubmitting(true);
    setResult(null);

    try {
      const response = await fetch('/api/save-sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enterpriseId: selectedEnvironment }),
      });

      const data = await response.json();

      if (data.success) {
        const env = environments.find(e => e.enterpriseId === selectedEnvironment);
        const envName = env?.propertyName || env?.enterpriseName || selectedEnvironment;
        showToast(`Successfully saved "${envName}". The sandbox will no longer expire.`, 'success');
      } else {
        showToast(data.error || 'Failed to save sandbox.', 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEnv = environments.find(e => e.enterpriseId === selectedEnvironment);

  return (
    <>
      <main className="min-h-screen bg-mews-linen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Save Sandbox</h1>
            <p className="text-gray-600">Permanently remove the expiration timer from a sandbox</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            {/* Sandbox Dropdown */}
            <div>
              <label htmlFor="selectedEnvironment" className="block text-sm font-medium text-gray-700 mb-1">
                Select Sandbox *
              </label>
              {environmentsLoading ? (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  Loading sandboxes...
                </div>
              ) : (
                <SearchableSelect
                  id="selectedEnvironment"
                  name="selectedEnvironment"
                  value={selectedEnvironment}
                  onChange={(val) => {
                    setSelectedEnvironment(val);
                    setResult(null);
                  }}
                  options={environments.map((env) => ({
                    value: env.enterpriseId,
                    label: `${env.propertyName || env.enterpriseName} (${env.enterpriseId})`,
                  }))}
                  placeholder="-- Select a sandbox --"
                />
              )}
              {!environmentsLoading && environments.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No sandboxes found.
                </p>
              )}
            </div>

            {/* Warning */}
            <div className="bg-warning-50 border border-warning-100 rounded-lg p-4 text-sm text-warning-700">
              <strong>Note:</strong> This will permanently cancel the expiration timer. The sandbox will remain active indefinitely and will not be automatically deleted.
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveClick}
              disabled={!selectedEnvironment || submitting}
              aria-busy={submitting}
              className={`w-full py-3 px-4 font-semibold rounded-lg transition-colors ${
                !selectedEnvironment || submitting
                  ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {submitting ? 'Saving...' : 'Save Sandbox'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              This will cancel the automatic deletion of the selected sandbox
            </p>
          </div>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <dialog
        ref={dialogRef}
        onClose={handleDialogClose}
        aria-labelledby="save-dialog-title"
        className="rounded-xl shadow-xl max-w-md w-full p-6 backdrop:bg-gray-900/50"
      >
        <h2 id="save-dialog-title" className="text-xl font-semibold text-gray-900 mb-4">
          Confirm Save Sandbox
        </h2>
        <p className="text-gray-700 mb-4">
          Are you sure you want to permanently remove the expiration from{' '}
          <strong>{selectedEnv?.propertyName || selectedEnv?.enterpriseName || 'this sandbox'}</strong>?
        </p>
        <p className="text-sm text-gray-500 mb-6">
          This sandbox will no longer be automatically deleted and will remain active indefinitely.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirmDialog(false)}
            className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveConfirm}
            className="flex-1 py-2 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            Yes, Save Sandbox
          </button>
        </div>
      </dialog>
    </>
  );
}
