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

export default function SandboxFillerPage() {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [environmentsLoading, setEnvironmentsLoading] = useState(false);

  // Helper function to format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTodayDate = (): string => formatDate(new Date());

  const getTodayPlusThreeDays = (): string => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return formatDate(date);
  };

  const [sandboxFillerData, setDemoFillerData] = useState({
    selectedEnvironment: '',
    startDate: getTodayDate(),
    endDate: getTodayPlusThreeDays(),
    reservationCount: 20
  });
  const [sandboxFillerLoading, setDemoFillerLoading] = useState(false);
  const [sandboxFillerResult, setDemoFillerResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);

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

  const handleSandboxFillerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoFillerLoading(true);
    setDemoFillerResult(null);

    try {
      const response = await fetch('/api/demo-filler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enterpriseId: sandboxFillerData.selectedEnvironment,
          startDate: sandboxFillerData.startDate,
          endDate: sandboxFillerData.endDate,
          reservationCount: sandboxFillerData.reservationCount
        })
      });

      const data = await response.json();
      setDemoFillerResult(data);
    } catch (error) {
      setDemoFillerResult({
        success: false,
        error: 'Network error: Could not connect to server'
      });
    } finally {
      setDemoFillerLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sandbox Filler</h1>
          <p className="text-gray-600">Add reservations to an existing sandbox</p>
        </div>

        <form onSubmit={handleSandboxFillerSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
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
                value={sandboxFillerData.selectedEnvironment}
                onChange={(e) => setDemoFillerData(prev => ({ ...prev, selectedEnvironment: e.target.value }))}
                required
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

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              name="startDate"
              value={sandboxFillerData.startDate}
              onChange={(e) => setDemoFillerData(prev => ({ ...prev, startDate: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              type="date"
              name="endDate"
              value={sandboxFillerData.endDate}
              onChange={(e) => setDemoFillerData(prev => ({ ...prev, endDate: e.target.value }))}
              min={sandboxFillerData.startDate || new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Reservation Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Reservations *
            </label>
            <input
              type="number"
              name="reservationCount"
              value={sandboxFillerData.reservationCount}
              onChange={(e) => setDemoFillerData(prev => ({ ...prev, reservationCount: parseInt(e.target.value) || 0 }))}
              required
              min="1"
              max="500"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter a number between 1 and 500
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!sandboxFillerData.selectedEnvironment || sandboxFillerLoading}
            className={`w-full py-3 px-4 font-semibold rounded-lg transition-colors ${
              !sandboxFillerData.selectedEnvironment || sandboxFillerLoading
                ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {sandboxFillerLoading ? 'Creating Reservations...' : 'Create Reservations'}
          </button>

          {/* Success Message */}
          {sandboxFillerResult?.success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
              <p className="font-semibold">✅ Reservation creation started!</p>
              <p className="text-sm mt-1">{sandboxFillerResult.message}</p>
              <p className="text-sm mt-1">
                Check the{' '}
                <Link href="/logs" className="underline font-semibold">
                  Sandbox Logs
                </Link>{' '}
                for progress.
              </p>
            </div>
          )}

          {/* Error Message */}
          {sandboxFillerResult?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <p className="font-semibold">❌ Creation failed</p>
              <p className="text-sm mt-1">{sandboxFillerResult.error}</p>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center">
            All reservations will be created in Confirmed state with random check-in dates and stay lengths (1-4 nights)
          </p>
        </form>
      </div>
    </main>
  );
}
