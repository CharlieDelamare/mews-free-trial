'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

export default function SandboxFillerPage() {
  const router = useRouter();
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [environmentsLoading, setEnvironmentsLoading] = useState(false);
  const submittingRef = useRef(false);

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

  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [manualAddLoading, setManualAddLoading] = useState(false);
  const [manualAddMessage, setManualAddMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [services, setServices] = useState<Array<{ id: string; name: string; ordering: number }>>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');

  const [sandboxFillerData, setDemoFillerData] = useState({
    selectedEnvironment: '',
    startDate: getTodayDate(),
    endDate: getTodayPlusThreeDays(),
    reservationCount: 20 as number | string
  });
  const [sandboxFillerLoading, setDemoFillerLoading] = useState(false);

  const CHEVRON_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2374757D'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E")`;
  const selectStyle = { backgroundImage: CHEVRON_SVG } as const;
  const selectClasses = "w-full h-9 md:h-auto px-3 md:px-4 py-1 md:py-2 pr-10 text-sm md:text-base leading-tight border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-no-repeat bg-[length:16px_16px] bg-[position:right_12px_center]";

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

  const fetchServicesForEnvironment = async (enterpriseId: string) => {
    setServicesLoading(true);
    setServices([]);
    setSelectedServiceId('');
    try {
      const response = await fetch('/api/services/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enterpriseId })
      });
      const data = await response.json();
      if (data.success && data.services) {
        setServices(data.services);
        if (data.services.length === 1) {
          setSelectedServiceId(data.services[0].id);
        }
      } else {
        console.error('Failed to fetch services:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setServicesLoading(false);
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

  const handleSandboxFillerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (submittingRef.current) {
      console.log('[SANDBOX-FILLER] Duplicate submission prevented');
      return;
    }

    submittingRef.current = true;
    setDemoFillerLoading(true);

    try {
      await fetch('/api/demo-filler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enterpriseId: sandboxFillerData.selectedEnvironment,
          serviceId: selectedServiceId,
          startDate: sandboxFillerData.startDate,
          endDate: sandboxFillerData.endDate,
          reservationCount: Number(sandboxFillerData.reservationCount) || 20
        })
      });

      // Redirect to logs page regardless of response
      router.push('/logs');
    } catch (error) {
      // Still redirect to logs even on network error
      router.push('/logs');
    } finally {
      // Reset the ref in case user navigates back
      submittingRef.current = false;
    }
  };

  return (
    <main className="min-h-screen bg-mews-linen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Demo Filler</h1>
          <p className="text-gray-600">Add reservations to an existing sandbox</p>
        </div>

        <form onSubmit={handleSandboxFillerSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          {/* Sandbox Dropdown */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">
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
              <div className="w-full h-9 md:h-auto px-3 md:px-4 py-1 md:py-2 text-sm md:text-base leading-tight border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Loading sandboxes...
              </div>
            ) : (
              <SearchableSelect
                id="selectedEnvironment"
                name="selectedEnvironment"
                value={sandboxFillerData.selectedEnvironment}
                onChange={(val) => {
                  setDemoFillerData(prev => ({ ...prev, selectedEnvironment: val }));
                  setServices([]);
                  setSelectedServiceId('');
                  if (val) {
                    fetchServicesForEnvironment(val);
                  }
                }}
                options={environments.map((env) => ({
                  value: env.enterpriseId,
                  label: `${env.propertyName || env.enterpriseName} (${env.enterpriseId})`
                }))}
                placeholder="-- Select a sandbox --"
                required
                className="w-full h-9 md:h-auto px-3 md:px-4 py-1 md:py-2 pr-10 text-sm md:text-base leading-tight border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

          {/* Service Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Service *
            </label>
            {servicesLoading ? (
              <div className="w-full h-9 md:h-auto px-3 md:px-4 py-1 md:py-2 text-sm md:text-base leading-tight border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Loading services...
              </div>
            ) : !sandboxFillerData.selectedEnvironment ? (
              <select
                disabled
                className={`${selectClasses} bg-gray-100 text-gray-400 cursor-not-allowed`}
                style={selectStyle}
              >
                <option>-- Select a sandbox first --</option>
              </select>
            ) : (
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                required
                className={selectClasses}
                style={selectStyle}
              >
                <option value="">-- Select a service --</option>
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name}
                  </option>
                ))}
              </select>
            )}
            {!servicesLoading && sandboxFillerData.selectedEnvironment && services.length === 0 && (
              <p className="text-sm text-error-500 mt-2">
                No bookable services found for this sandbox.
              </p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={sandboxFillerData.startDate}
              onChange={(e) => setDemoFillerData(prev => ({ ...prev, startDate: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full h-9 md:h-auto px-3 md:px-4 py-1 md:py-2 text-sm md:text-base leading-tight border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
            />
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={sandboxFillerData.endDate}
              onChange={(e) => setDemoFillerData(prev => ({ ...prev, endDate: e.target.value }))}
              min={sandboxFillerData.startDate || new Date().toISOString().split('T')[0]}
              required
              className="w-full h-9 md:h-auto px-3 md:px-4 py-1 md:py-2 text-sm md:text-base leading-tight border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
            />
          </div>

          {/* Reservation Count */}
          <div>
            <label htmlFor="reservationCount" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Reservations *
            </label>
            <input
              type="number"
              id="reservationCount"
              name="reservationCount"
              value={sandboxFillerData.reservationCount}
              onChange={(e) => setDemoFillerData(prev => ({ ...prev, reservationCount: e.target.value === '' ? '' : parseInt(e.target.value) || 0 }))}
              required
              min="1"
              max="500"
              className="w-full h-9 md:h-auto px-3 md:px-4 py-1 md:py-2 text-sm md:text-base leading-tight border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter a number between 1 and 500
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!sandboxFillerData.selectedEnvironment || !selectedServiceId || sandboxFillerLoading}
            className={`w-full py-3 px-4 font-semibold rounded-lg transition-colors ${
              !sandboxFillerData.selectedEnvironment || !selectedServiceId || sandboxFillerLoading
                ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {sandboxFillerLoading ? 'Creating Reservations...' : 'Create Reservations'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            All reservations will be created in Confirmed state with random check-in dates and stay lengths (1-4 nights)
          </p>
        </form>

      </div>

      {/* Manual Add Environment Modal */}
      {showManualAdd && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={closeManualAddModal}>
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
    </main>
  );
}
