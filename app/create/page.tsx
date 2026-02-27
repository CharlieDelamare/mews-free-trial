'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { languageOptions, countryOptions } from '@/lib/codes';
import { useToast } from '@/components/Toast';
import { isAdminEmail } from '@/lib/admin';

export default function SandboxCreationPage() {
  const router = useRouter();
  const { showToast } = useToast();
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

  /* Chevron color matches --neutral-500 (#74757D) from design system */
  const CHEVRON_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2374757D'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E")`;
  const selectStyle = { backgroundImage: CHEVRON_SVG } as const;
  const selectClasses = "w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-no-repeat bg-[length:16px_16px] bg-[position:right_12px_center]";

  // Check if requestor is an admin (gets auto-populated test data and special treatment for duration and Salesforce ID)
  const isAdmin = isAdminEmail(formData.requestorEmail);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'durationDays' ? Number(value) : value;

    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: processedValue
      };

      // Auto-set duration to 1 day and populate test data for admin emails
      if (name === 'requestorEmail' && isAdminEmail(value)) {
        updated.durationDays = 1;
        // Auto-populate test data from email address
        const emailName = value.split('@')[0];
        const parts = emailName.split('.');
        updated.firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Admin';
        updated.lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'User';
        updated.customerEmail = 'charlie@charlie.com';
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Only validate Salesforce Account ID for non-admin users
    if (!isAdmin && !formData.salesforceAccountId.startsWith('001')) {
      showToast('The Salesforce Account ID is incorrect', 'error');
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
    <main className="min-h-screen bg-mews-linen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mews Sandbox Manager</h1>
          <p className="text-gray-600">Create a demo sandbox environment</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            {/* Requestor Email */}
            <div>
              <label htmlFor="requestorEmail" className="block text-sm font-medium text-gray-700 mb-1">Your Email (Requestor) *</label>
              <input
                type="email"
                id="requestorEmail"
                name="requestorEmail"
                value={formData.requestorEmail}
                onChange={handleChange}
                required
                placeholder="your.email@company.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Customer First Name *
                  {isAdmin && <span className="text-xs text-gray-500 ml-2">(Auto-populated for admin)</span>}
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Last Name *
                  {isAdmin && <span className="text-xs text-gray-500 ml-2">(Auto-populated for admin)</span>}
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Customer Email */}
            <div>
              <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Email (for login) *
                {isAdmin && <span className="text-xs text-gray-500 ml-2">(Auto-populated for admin)</span>}
              </label>
              <input
                type="email"
                id="customerEmail"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                required
                placeholder="customer@hotel.com"
                data-1p-ignore
                autoComplete="off"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Preferred Language */}
            <div>
              <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-700 mb-1">Preferred Language *</label>
              <select
                id="preferredLanguage"
                name="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={handleChange}
                required
                className={selectClasses}
                style={selectStyle}
              >
                {languageOptions.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Property Name */}
            <div>
              <label htmlFor="propertyName" className="block text-sm font-medium text-gray-700 mb-1">Property Name *</label>
              <input
                type="text"
                id="propertyName"
                name="propertyName"
                value={formData.propertyName}
                onChange={handleChange}
                required
                placeholder="Hotel Grand Example"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Property Country */}
            <div>
              <label htmlFor="propertyCountry" className="block text-sm font-medium text-gray-700 mb-1">Property Country *</label>
              <select
                id="propertyCountry"
                name="propertyCountry"
                value={formData.propertyCountry}
                onChange={handleChange}
                required
                className={selectClasses}
                style={selectStyle}
              >
                {countryOptions.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            {/* Property Type */}
            <div>
              <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">Property Type *</label>
              <select
                id="propertyType"
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                required
                className={selectClasses}
                style={selectStyle}
              >
                <option value="hotel">Hotel</option>
                <option value="hostel">Hostel</option>
                <option value="apartments">Apartments</option>
              </select>
            </div>

            {/* Sandbox Duration */}
            <div>
              <label htmlFor="durationDays" className="block text-sm font-medium text-gray-700 mb-1">
                Sandbox Duration *
                {isAdmin && <span className="text-xs text-gray-500 ml-2">(Fixed at 1 day for admin)</span>}
              </label>
              <select
                id="durationDays"
                name="durationDays"
                value={formData.durationDays}
                onChange={handleChange}
                required
                disabled={isAdmin}
                className={`${selectClasses} disabled:bg-gray-100 disabled:cursor-not-allowed`}
                style={selectStyle}
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days (recommended)</option>
                <option value={60}>60 days</option>
              </select>
            </div>

            {/* Salesforce Account ID */}
            <div>
              <label htmlFor="salesforceAccountId" className="block text-sm font-medium text-gray-700 mb-1">
                Salesforce Account ID {!isAdmin && '*'}
              </label>
              <input
                type="text"
                id="salesforceAccountId"
                name="salesforceAccountId"
                value={formData.salesforceAccountId}
                onChange={handleChange}
                required={!isAdmin}
                placeholder="001..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating Sandbox... (this may take a few minutes)' : 'Create Sandbox'}
            </button>

          </form>
      </div>
    </main>
  );
}
