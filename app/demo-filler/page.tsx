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

export default function DemoFillerPage() {
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

  const [demoFillerData, setDemoFillerData] = useState({
    selectedEnvironment: '',
    startDate: getTodayDate(),
    endDate: getTodayPlusThreeDays(),
    reservationCount: 20
  });
  const [demoFillerLoading, setDemoFillerLoading] = useState(false);
  const [demoFillerResult, setDemoFillerResult] = useState<{
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

  const handleDemoFillerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoFillerLoading(true);
    setDemoFillerResult(null);

    try {
      const response = await fetch('/api/demo-filler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enterpriseId: demoFillerData.selectedEnvironment,
          startDate: demoFillerData.startDate,
          endDate: demoFillerData.endDate,
          reservationCount: demoFillerData.reservationCount
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Demo Filler</h1>
          <p className="text-gray-600">Add reservations to an existing demo environment</p>
        </div>

        <form onSubmit={handleDemoFillerSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          {/* Environment Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Environment *
            </label>
            {environmentsLoading ? (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Loading environments...
              </div>
            ) : (
              <select
                name="selectedEnvironment"
                value={demoFillerData.selectedEnvironment}
                onChange={(e) => setDemoFillerData(prev => ({ ...prev, selectedEnvironment: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Select an environment --</option>
                {environments.map((env) => (
                  <option key={env.enterpriseId} value={env.enterpriseId}>
                    {env.propertyName || env.enterpriseName} ({env.enterpriseId})
                  </option>
                ))}
              </select>
            )}
            {!environmentsLoading && environments.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No environments found. Create a trial or add one manually.
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              If your property isn't available in the dropdown, please add the "Mews Free Trial" integration in the Marketplace within Mews.
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
              value={demoFillerData.startDate}
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
              value={demoFillerData.endDate}
              onChange={(e) => setDemoFillerData(prev => ({ ...prev, endDate: e.target.value }))}
              min={demoFillerData.startDate || new Date().toISOString().split('T')[0]}
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
              value={demoFillerData.reservationCount}
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
            disabled={!demoFillerData.selectedEnvironment || demoFillerLoading}
            className={`w-full py-3 px-4 font-semibold rounded-lg transition-colors ${
              !demoFillerData.selectedEnvironment || demoFillerLoading
                ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {demoFillerLoading ? 'Creating Reservations...' : 'Create Reservations'}
          </button>

          {/* Success Message */}
          {demoFillerResult?.success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
              <p className="font-semibold">✅ Reservation creation started!</p>
              <p className="text-sm mt-1">{demoFillerResult.message}</p>
              <p className="text-sm mt-1">
                Check the{' '}
                <Link href="/logs" className="underline font-semibold">
                  Environment Logs
                </Link>{' '}
                for progress.
              </p>
            </div>
          )}

          {/* Error Message */}
          {demoFillerResult?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <p className="font-semibold">❌ Creation failed</p>
              <p className="text-sm mt-1">{demoFillerResult.error}</p>
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
