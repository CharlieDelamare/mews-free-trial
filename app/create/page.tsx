'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { languageOptions, countryOptions } from '@/lib/codes';

export default function SandboxCreationPage() {
  const router = useRouter();
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

      // Auto-set duration to 1 day and populate test data for Charlie's emails
      if (name === 'requestorEmail' &&
          (value === 'charlie.delamare@gmail.com' || value === 'charlie.delamare@mews.com')) {
        updated.durationDays = 1;
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

    // Only validate Salesforce Account ID for non-Charlie users
    if (!isCharlie && !formData.salesforceAccountId.startsWith('001')) {
      alert('The Salesforce Account ID is incorrect');
      setLoading(false);
      return;
    }

    try {
      await fetch('/api/create-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      // Redirect to logs page regardless of response
      router.push('/logs');
    } catch {
      // Still redirect to logs even on network error
      router.push('/logs');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mews Sandbox Manager</h1>
          <p className="text-gray-600">Create a demo sandbox environment</p>
        </div>

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

            {/* Sandbox Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sandbox Duration *
                {isCharlie && <span className="text-xs text-gray-500 ml-2">(Fixed at 1 day for internal use)</span>}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating Sandbox... (this may take a few minutes)' : 'Create Sandbox'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Sandbox environments are valid for {formData.durationDays} days. Login details will be sent to the customer email.
            </p>
          </form>
      </div>
    </main>
  );
}
