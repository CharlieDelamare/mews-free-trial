'use client';

import { useState, useEffect } from 'react';
import SearchableSelect from '@/components/SearchableSelect';

interface Environment {
  enterpriseId: string;
  enterpriseName: string;
  propertyName?: string;
  loginUrl?: string;
  type: 'trial' | 'manual';
  status?: string;
  customerEmail?: string;
  createdAt: Date;
  accessTokenId: number;
}

const BI_ADD_ON_URL = (enterpriseId: string) =>
  `https://app.mews-demo.com/Commander/${enterpriseId}/EnterpriseIntegration/Marketplace?OwnerId=${enterpriseId}&ApplicationId=4a3b8e4c-4245-4274-9142-b21b0115f375`;

const BI_CONNECTOR_URL = (enterpriseId: string) =>
  `https://app.mews-demo.com/Commander/${enterpriseId}/EnterpriseIntegration/Marketplace?OwnerId=${enterpriseId}&CategoryId=subscriptions&ApplicationId=MewsBiIntegration`;

export default function AddBiPage() {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/environments/list')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const sorted = (data.environments as Environment[]).sort((a, b) => {
            const nameA = (a.propertyName || a.enterpriseName).toLowerCase();
            const nameB = (b.propertyName || b.enterpriseName).toLowerCase();
            return nameA.localeCompare(nameB);
          });
          setEnvironments(sorted);
        }
      })
      .catch(err => console.error('Failed to fetch environments:', err))
      .finally(() => setLoading(false));
  }, []);

  const env = environments.find(e => e.enterpriseId === selectedId);
  const name = env?.propertyName || env?.enterpriseName || selectedId;

  return (
    <main className="min-h-screen bg-mews-linen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-mews-night-black mb-2">Add Mews BI</h1>
          <p className="text-neutral-600">
            Enable BI reporting for a demo sandbox. Select a sandbox to get your pre-populated setup links.
          </p>
        </div>

        {/* Sandbox selector */}
        <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-8 mb-6">
          <label htmlFor="selectedEnvironment" className="block text-sm font-medium text-neutral-700 mb-1">
            Select Sandbox *
          </label>
          {loading ? (
            <div className="w-full px-4 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-500 text-sm">
              Loading sandboxes...
            </div>
          ) : (
            <SearchableSelect
              id="selectedEnvironment"
              name="selectedEnvironment"
              value={selectedId}
              onChange={setSelectedId}
              options={environments.map(e => ({
                value: e.enterpriseId,
                label: `${e.propertyName || e.enterpriseName} (${e.enterpriseId})`,
              }))}
              placeholder="-- Select a sandbox --"
            />
          )}
        </div>

        {/* Empty state */}
        {!selectedId && (
          <div className="bg-white rounded-xl border border-dashed border-neutral-200 p-12 text-center">
            <div className="text-4xl mb-3">🔗</div>
            <p className="text-sm text-neutral-400">Select a sandbox above to see your pre-populated BI setup links</p>
          </div>
        )}

        {/* Steps card */}
        {selectedId && env && (
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-8">
            <h2 className="text-base font-bold text-mews-night-black mb-6">Setup Steps</h2>

            {/* Step 1 */}
            <div className="flex gap-4 pb-6 border-b border-neutral-100 mb-6">
              <div className="bg-mews-primary text-mews-night-black rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-mews-night-black mb-1">Open Demo &amp; become admin</h3>
                <p className="text-sm text-neutral-500 mb-3">
                  Log in and make yourself a property admin for this sandbox
                </p>
                <a
                  href={env.loginUrl ?? 'https://app.mews-demo.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#fdf2ff] border border-mews-primary/30 text-mews-primary rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-[#f5e6ff] transition-colors"
                >
                  ↗ Open {name} in Mews
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 pb-6 border-b border-neutral-100 mb-6">
              <div className="bg-mews-primary text-mews-night-black rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-mews-night-black mb-1">Enable the BI Add-on</h3>
                <p className="text-sm text-neutral-500 mb-3">
                  While in the property, open the Marketplace and enable the Mews BI Connector add-on
                </p>
                <a
                  href={BI_ADD_ON_URL(env.enterpriseId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-mews-primary text-mews-night-black rounded-lg px-3 py-1.5 text-sm font-bold hover:bg-mews-primary-hover transition-colors mb-3"
                >
                  ↗ Enable BI Add-on for {name}
                </a>
                <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5 text-sm text-orange-800 flex gap-2 items-start">
                  <span className="flex-shrink-0 mt-0.5">⏱</span>
                  <span>
                    After enabling, initial data ingestion takes <strong>2–3 hours</strong>. Come back once
                    that&apos;s done before proceeding to Step 3.
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="bg-mews-primary text-mews-night-black rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-mews-night-black mb-1">Connect BI &amp; select users</h3>
                <p className="text-sm text-neutral-500 mb-3">
                  Open the BI Connector page, enable the integration, and select which users to onboard
                </p>
                <a
                  href={BI_CONNECTOR_URL(env.enterpriseId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-mews-primary text-mews-night-black rounded-lg px-3 py-1.5 text-sm font-bold hover:bg-mews-primary-hover transition-colors"
                >
                  ↗ Connect Mews BI for {name}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
