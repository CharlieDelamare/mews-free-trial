'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface EnvironmentLog {
  id: string;
  timestamp: string;
  propertyName: string;
  customerName: string;
  customerEmail: string;
  propertyCountry: string;
  propertyType: string;
  loginUrl: string;
  loginEmail: string;
  loginPassword: string;
  status: 'success' | 'failure';
  errorMessage?: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<EnvironmentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/logs');
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs);
      } else {
        setError('Failed to load logs');
      }
    } catch (err) {
      setError('Error fetching logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Environment Logs
          </h1>

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading logs...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!loading && !error && logs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No environments created yet.</p>
              <Link
                href="/"
                className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first trial →
              </Link>
            </div>
          )}

          {!loading && !error && logs.length > 0 && (
            <div className="space-y-4">
              <div className="mb-4 text-sm text-gray-600">
                Total environments: {logs.length}
              </div>

              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`border rounded-lg p-6 ${
                    log.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        {log.propertyName}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(log.timestamp)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        log.status === 'success'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Customer Name</p>
                      <p className="font-medium text-gray-800">{log.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Customer Email</p>
                      <p className="font-medium text-gray-800">{log.customerEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Country</p>
                      <p className="font-medium text-gray-800">{log.propertyCountry}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Property Type</p>
                      <p className="font-medium text-gray-800 capitalize">{log.propertyType}</p>
                    </div>
                  </div>

                  {log.status === 'success' && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h3 className="font-semibold text-gray-800 mb-3">
                        Login Details
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between bg-white rounded px-3 py-2">
                          <div>
                            <p className="text-xs text-gray-600">Login URL</p>
                            <p className="font-mono text-sm text-gray-800">{log.loginUrl}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(log.loginUrl)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-white rounded px-3 py-2">
                          <div>
                            <p className="text-xs text-gray-600">Email</p>
                            <p className="font-mono text-sm text-gray-800">{log.loginEmail}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(log.loginEmail)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-white rounded px-3 py-2">
                          <div>
                            <p className="text-xs text-gray-600">Password</p>
                            <p className="font-mono text-sm text-gray-800">{log.loginPassword}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(log.loginPassword)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {log.status === 'failure' && log.errorMessage && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Error Details</h3>
                      <pre className="bg-white rounded p-3 text-xs overflow-x-auto text-gray-700">
                        {log.errorMessage}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
