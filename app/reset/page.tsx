'use client';

import { useState, useEffect } from 'react';
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
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [environmentsLoading, setEnvironmentsLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

  const handleResetClick = () => {
    if (!selectedEnvironment) return;
    setShowConfirmDialog(true);
  };

  const handleResetConfirm = async () => {
    setShowConfirmDialog(false);
    setResetting(true);
    setResetResult(null);

    try {
      const response = await fetch('/api/reset-environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enterpriseId: selectedEnvironment })
      });

      const data = await response.json();
      setResetResult(data);
    } catch (error) {
      setResetResult({
        success: false,
        error: 'Network error: Could not connect to server'
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Sandbox</h1>
          <p className="text-gray-600">Reset an existing sandbox</p>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          {/* Success Message */}
          {resetResult?.success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
              <p className="font-semibold">✅ Reset operation started!</p>
              <p className="text-sm mt-1">
                The sandbox is being reset. This may take a few minutes.
                Check the{' '}
                <Link href="/logs" className="underline font-semibold">
                  Sandbox Logs
                </Link>{' '}
                for progress.
              </p>
            </div>
          )}

          {/* Error Message */}
          {resetResult?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <p className="font-semibold">❌ Reset failed</p>
              <p className="text-sm mt-1">{resetResult.error}</p>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center">
            Resetting will cancel reservations, close bills, and create fresh sample data for the next 7 days
          </p>
        </div>
      </div>

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
