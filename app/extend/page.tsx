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

export default function ExtendSandboxPage() {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [newExpirationDate, setNewExpirationDate] = useState('');
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

  const handleExtendClick = () => {
    if (!selectedEnvironment || !newExpirationDate) return;
    setShowConfirmDialog(true);
  };

  const handleExtendConfirm = async () => {
    setShowConfirmDialog(false);
    setSubmitting(true);

    try {
      // Convert the date to UTC ISO 8601 format (start of day UTC)
      const expirationUtc = new Date(newExpirationDate + 'T00:00:00Z').toISOString();

      const response = await fetch('/api/extend-sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enterpriseId: selectedEnvironment,
          newExpirationUtc: expirationUtc,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const env = environments.find(e => e.enterpriseId === selectedEnvironment);
        const envName = env?.propertyName || env?.enterpriseName || selectedEnvironment;
        showToast(`Successfully extended "${envName}" expiration to ${newExpirationDate}.`, 'success');
      } else {
        showToast(data.error || 'Failed to extend sandbox expiration.', 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate tomorrow's date for the min attribute
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const selectedEnv = environments.find(e => e.enterpriseId === selectedEnvironment);

  return (
    <>
      <main className="min-h-screen bg-mews-linen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-mews-night-black mb-2">Extend Sandbox</h1>
            <p className="text-neutral-600">Push the expiration date of a sandbox further into the future</p>
          </div>

          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-8 space-y-6">
            {/* Sandbox Dropdown */}
            <div>
              <label htmlFor="selectedEnvironment" className="block text-sm font-medium text-neutral-700 mb-1">
                Select Sandbox *
              </label>
              {environmentsLoading ? (
                <div className="w-full px-4 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-500">
                  Loading sandboxes...
                </div>
              ) : (
                <SearchableSelect
                  id="selectedEnvironment"
                  name="selectedEnvironment"
                  value={selectedEnvironment}
                  onChange={(val) => {
                    setSelectedEnvironment(val);
                  }}
                  options={environments.map((env) => ({
                    value: env.enterpriseId,
                    label: `${env.propertyName || env.enterpriseName} (${env.enterpriseId})`,
                  }))}
                  placeholder="-- Select a sandbox --"
                />
              )}
              {!environmentsLoading && environments.length === 0 && (
                <p className="text-sm text-neutral-500 mt-2">
                  No trial sandboxes found. Only sandboxes created by this app can be extended.
                </p>
              )}
            </div>

            {/* Date Picker */}
            <div>
              <label htmlFor="newExpirationDate" className="block text-sm font-medium text-neutral-700 mb-1">
                New Expiration Date *
              </label>
              <input
                id="newExpirationDate"
                type="date"
                value={newExpirationDate}
                onChange={(e) => {
                  setNewExpirationDate(e.target.value);
                }}
                min={minDate}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-mews-primary focus:border-mews-primary"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Must be a future date. The sandbox will expire at the start of this day (UTC).
              </p>
            </div>

            {/* Extend Button */}
            <button
              onClick={handleExtendClick}
              disabled={!selectedEnvironment || !newExpirationDate || submitting}
              aria-busy={submitting}
              className={`w-full py-3 px-4 font-semibold rounded-lg transition-colors ${
                !selectedEnvironment || !newExpirationDate || submitting
                  ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                  : 'bg-mews-primary text-mews-night-black hover:bg-mews-primary-hover'
              }`}
            >
              {submitting ? 'Extending...' : 'Extend Sandbox'}
            </button>

            <p className="text-xs text-neutral-500 text-center">
              This will change the expiration date of the selected sandbox to the specified date
            </p>
          </div>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <dialog
        ref={dialogRef}
        onClose={handleDialogClose}
        aria-labelledby="extend-dialog-title"
        className="rounded-xl shadow-xl max-w-md w-full p-6 backdrop:bg-gray-900/50"
      >
        <h2 id="extend-dialog-title" className="text-xl font-semibold text-mews-night-black mb-4">
          Confirm Extend Sandbox
        </h2>
        <p className="text-neutral-700 mb-4">
          Are you sure you want to extend the expiration of{' '}
          <strong>{selectedEnv?.propertyName || selectedEnv?.enterpriseName || 'this sandbox'}</strong>{' '}
          to <strong>{newExpirationDate}</strong>?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirmDialog(false)}
            className="flex-1 py-2 px-4 bg-neutral-100 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExtendConfirm}
            className="flex-1 py-2 px-4 bg-mews-primary text-mews-night-black font-semibold rounded-lg hover:bg-mews-primary-hover transition-colors"
          >
            Yes, Extend
          </button>
        </div>
      </dialog>
    </>
  );
}
