'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { languageOptions, countryOptions } from '@/lib/codes';

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

export default function FreeTrialPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'reset'>('create');
  const [formData, setFormData] = useState({
    requestorEmail: '',
    firstName: '',
    lastName: '',
    customerEmail: '',
    preferredLanguage: 'English (UK)',
    propertyName: '',
    propertyCountry: 'United Kingdom',
    propertyType: 'hotel' as 'hotel' | 'hostel' | 'apartments',
    durationDays: 30,
    salesforceAccountId: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    loginUrl?: string;
    loginEmail?: string;
    defaultPassword?: string;
    error?: string;
    status?: string;
    propertyName?: string;
    existingEnvironment?: {
      propertyName: string;
      customerEmail: string;
      status: string;
      createdAt: Date;
      enterpriseId?: string;
    };
    suggestion?: string;
  } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [manualAccessToken, setManualAccessToken] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalResult, setModalResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    data?: {
      enterpriseName?: string;
      enterpriseId?: string;
    };
  } | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [environmentsLoading, setEnvironmentsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'reset') {
      fetchEnvironments();
    }
  }, [activeTab]);

  const fetchEnvironments = async () => {
    setEnvironmentsLoading(true);
    try {
      const response = await fetch('/api/environments/list');
      const data = await response.json();
      if (data.success) {
        setEnvironments(data.environments || []);
      }
    } catch (error) {
      console.error('Failed to fetch environments:', error);
    } finally {
      setEnvironmentsLoading(false);
    }
  };

  // Check if requestor is Charlie (gets auto-populated test data and special treatment for duration and Salesforce ID)
  const isCharlie = formData.requestorEmail === 'charlie.delamare@gmail.com' ||
                    formData.requestorEmail === 'charlie.delamare@mews.com';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'durationDays' ? Number(value) : value;

    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: processedValue
      };

      // Auto-set duration to 7 days and populate test data for Charlie's emails
      if (name === 'requestorEmail' &&
          (value === 'charlie.delamare@gmail.com' || value === 'charlie.delamare@mews.com')) {
        updated.durationDays = 7;
        updated.firstName = 'Charlie';
        updated.lastName = 'Delamare';
        updated.customerEmail = 'charlie@charlie.com';
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Only validate Salesforce Account ID for non-Charlie users
    if (!isCharlie && !formData.salesforceAccountId.startsWith('001')) {
      setResult({ success: false, error: 'The Salesforce Account ID is incorrect' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/create-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      setResult(data);
    } catch {
      setResult({ success: false, error: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalResult(null);

    try {
      const response = await fetch('/api/add-environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: manualAccessToken })
      });

      const data = await response.json();
      setModalResult(data);

      if (data.success) {
        // Refresh environments list if on reset tab
        if (activeTab === 'reset') {
          fetchEnvironments();
        }
        // Close modal after 2 seconds on success
        setTimeout(() => {
          setShowModal(false);
          setManualAccessToken('');
          setModalResult(null);
        }, 2000);
      }
    } catch {
      setModalResult({ success: false, error: 'Network error' });
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'create'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Create Free Trial
          </button>
          <button
            onClick={() => setActiveTab('reset')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'reset'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Reset Demo Environment
          </button>
        </div>

        {/* View Logs Link */}
        <div className="flex justify-end mb-4">
          <Link
            href="/logs"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View Environment Logs →
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {activeTab === 'create' ? 'Mews Free Trial' : 'Reset Demo Environment'}
          </h1>
          <p className="text-gray-600">
            {activeTab === 'create'
              ? 'Request a free trial of Mews'
              : 'Reset an existing demo environment'}
          </p>
        </div>

        {/* Create Trial Tab Content */}
        {activeTab === 'create' && (
          <>
            {result?.success && result?.status === 'building' ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              🏗️ Trial Environment is Being Created!
            </h2>
            <p className="text-blue-700 mb-4">
              Your trial environment for <strong>{result.propertyName}</strong> is being set up.
              This usually takes a few minutes.
            </p>
            <p className="text-blue-600 mb-4">
              You can view the status and login details in the{' '}
              <Link href="/logs" className="underline font-semibold hover:text-blue-800">
                Environment Logs
              </Link>.
            </p>
            <p className="text-sm text-blue-600">
              When the environment is ready, the status will change to "Completed" and you'll be able to view your login credentials.
            </p>
          </div>
        ) : result?.success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-800 mb-4">Trial Created Successfully!</h2>
            <div className="space-y-2 text-green-700">
              <p><strong>Login URL:</strong> <a href={result.loginUrl} className="underline">{result.loginUrl}</a></p>
              <p><strong>Email:</strong> {result.loginEmail}</p>
              <p><strong>Password:</strong> {result.defaultPassword}</p>
            </div>
            <p className="mt-4 text-sm text-green-600">Check your email for additional details.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            {/* Requestor Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Email (Requestor) *</label>
              <input
                type="email"
                name="requestorEmail"
                value={formData.requestorEmail}
                onChange={handleChange}
                required
                placeholder="your.email@company.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer First Name *
                  {isCharlie && <span className="text-xs text-gray-500 ml-2">(Auto-populated for testing)</span>}
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Last Name *
                  {isCharlie && <span className="text-xs text-gray-500 ml-2">(Auto-populated for testing)</span>}
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Customer Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Email (for login) *
                {isCharlie && <span className="text-xs text-gray-500 ml-2">(Auto-populated for testing)</span>}
              </label>
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                required
                placeholder="customer@hotel.com"
                data-1p-ignore
                autoComplete="off"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language *</label>
              <select
                name="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {languageOptions.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Property Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Name *</label>
              <input
                type="text"
                name="propertyName"
                value={formData.propertyName}
                onChange={handleChange}
                required
                placeholder="Hotel Grand Example"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Property Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Country *</label>
              <select
                name="propertyCountry"
                value={formData.propertyCountry}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {countryOptions.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Type *</label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="hotel">Hotel</option>
                <option value="hostel">Hostel</option>
                <option value="apartments">Apartments</option>
              </select>
            </div>

            {/* Trial Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trial Duration *
                {isCharlie && <span className="text-xs text-gray-500 ml-2">(Fixed at 7 days for internal use)</span>}
              </label>
              <select
                name="durationDays"
                value={formData.durationDays}
                onChange={handleChange}
                required
                disabled={isCharlie}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days (recommended)</option>
                <option value={60}>60 days</option>
              </select>
            </div>

            {/* Salesforce Account ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salesforce Account ID {!isCharlie && '*'}
              </label>
              <input
                type="text"
                name="salesforceAccountId"
                value={formData.salesforceAccountId}
                onChange={handleChange}
                required={!isCharlie}
                placeholder="001..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {result?.existingEnvironment && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Environment Already Exists
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p className="mb-2">{result.error}</p>
                      <div className="bg-white rounded border border-yellow-300 p-3 space-y-1">
                        <p><strong>Property:</strong> {result.existingEnvironment.propertyName}</p>
                        <p><strong>Customer Email:</strong> {result.existingEnvironment.customerEmail}</p>
                        <p><strong>Status:</strong> <span className="capitalize">{result.existingEnvironment.status}</span></p>
                        <p><strong>Created:</strong> {new Date(result.existingEnvironment.createdAt).toLocaleString()}</p>
                        {result.existingEnvironment.enterpriseId && (
                          <p><strong>Enterprise ID:</strong> {result.existingEnvironment.enterpriseId}</p>
                        )}
                      </div>
                      <p className="mt-3">{result.suggestion}</p>
                      <a
                        href="/logs"
                        className="inline-block mt-2 text-yellow-800 underline hover:text-yellow-900 font-semibold"
                      >
                        View Environment Logs →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result?.error && !result?.existingEnvironment && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {result.error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating Trial... (this may take a few minutes)' : 'Create Free Trial'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Trial properties are valid for {formData.durationDays} days. Login details will be sent to the customer email.
            </p>
          </form>
        )}
          </>
        )}

        {/* Reset Demo Environment Tab Content */}
        {activeTab === 'reset' && (
          <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            {/* Add Manually Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowModal(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add environment manually
              </button>
            </div>

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
                  value={selectedEnvironment}
                  onChange={(e) => setSelectedEnvironment(e.target.value)}
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
            </div>

            {/* Reset Button (non-functional for now) */}
            <button
              disabled
              className="w-full py-3 px-4 bg-gray-400 text-white font-semibold rounded-lg cursor-not-allowed opacity-60"
              title="Reset functionality coming soon"
            >
              Reset Environment
            </button>

            <p className="text-xs text-gray-500 text-center">
              Resetting will clear all data and restore sample customers (coming soon)
            </p>
          </div>
        )}
      </div>

      {/* Manual Environment Addition Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Add Environment Manually</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setManualAccessToken('');
                  setModalResult(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Token *
                </label>
                <textarea
                  value={manualAccessToken}
                  onChange={(e) => setManualAccessToken(e.target.value)}
                  required
                  rows={4}
                  placeholder="Paste your access token here..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {modalResult?.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {modalResult.error}
                </div>
              )}

              {modalResult?.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
                  <p className="font-semibold">{modalResult.message}</p>
                  {modalResult.data && (
                    <p className="mt-1">
                      Enterprise: {modalResult.data.enterpriseName} (ID: {modalResult.data.enterpriseId})
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setManualAccessToken('');
                    setModalResult(null);
                  }}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {modalLoading ? 'Adding...' : 'Add Environment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
