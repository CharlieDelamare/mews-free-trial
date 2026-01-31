'use client';

import { useState } from 'react';
import { languageOptions, countryOptions } from '@/lib/codes';

export default function FreeTrialPage() {
  const [formData, setFormData] = useState({
    requestorEmail: '',
    firstName: '',
    lastName: '',
    customerEmail: '',
    preferredLanguage: 'English (UK)',
    propertyName: '',
    propertyCountry: 'United Kingdom',
    propertyType: 'hotel' as 'hotel' | 'hostel' | 'apartments',
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
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Validate Salesforce Account ID
    if (!formData.salesforceAccountId.startsWith('001')) {
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mews Free Trial</h1>
          <p className="text-gray-600">Request a 45-day free trial of Mews</p>
        </div>

        {result?.success ? (
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer First Name *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Last Name *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email (for login) *</label>
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                required
                placeholder="customer@hotel.com"
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

            {/* Salesforce Account ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salesforce Account ID *</label>
              <input
                type="text"
                name="salesforceAccountId"
                value={formData.salesforceAccountId}
                onChange={handleChange}
                required
                placeholder="001..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {result?.error && (
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
              Trial properties are valid for 45 days. Login details will be sent to the customer email.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
