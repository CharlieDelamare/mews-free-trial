'use client';

import { useState, useEffect, useRef } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/components/Toast';
import type { ScenarioType } from '@/types/control-centre';

interface Props {
  enterpriseId: string;
}

interface ScenarioCard {
  type: ScenarioType;
  label: string;
  description: string;
  guestCount: number;
}

const SCENARIOS: ScenarioCard[] = [
  { type: 'individual', label: 'Individual Travellers', description: 'Solo and couple bookings', guestCount: 20 },
  { type: 'groups', label: 'Group Bookings', description: 'Multi-room group blocks', guestCount: 40 },
  { type: 'hostel', label: 'Hostel / Dorm', description: 'High-volume dorm stays', guestCount: 50 },
  { type: 'long_stay', label: 'Long Stay', description: 'Extended stays of 7+ nights', guestCount: 10 },
  { type: 'packages', label: 'Packages', description: 'Room + extras bundles', guestCount: 15 },
  { type: 'multi_service', label: 'Multi-Service', description: 'Multiple bookable services', guestCount: 25 },
];

type ScenarioStatus = 'idle' | 'provisioning' | 'completed' | 'failed';

export default function ScenariosTab({ enterpriseId }: Props) {
  const { showToast } = useToast();
  const [statuses, setStatuses] = useState<Record<ScenarioType, ScenarioStatus>>({
    individual: 'idle',
    groups: 'idle',
    hostel: 'idle',
    long_stay: 'idle',
    packages: 'idle',
    multi_service: 'idle',
  });
  const [logIds, setLogIds] = useState<Record<ScenarioType, string | null>>({
    individual: null, groups: null, hostel: null, long_stay: null, packages: null, multi_service: null,
  });
  const pollingRef = useRef<Record<ScenarioType, NodeJS.Timeout | null>>({
    individual: null, groups: null, hostel: null, long_stay: null, packages: null, multi_service: null,
  });

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(pollingRef.current).forEach(t => t && clearInterval(t));
    };
  }, []);

  const pollStatus = (scenarioType: ScenarioType, logId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/control-centre/scenario-status?logId=${logId}`);
        const data = await res.json();
        if (data.status === 'completed') {
          clearInterval(interval);
          pollingRef.current[scenarioType] = null;
          setStatuses(prev => ({ ...prev, [scenarioType]: 'completed' }));
          showToast('Scenario provisioned!', 'success');
        } else if (data.status === 'failed') {
          clearInterval(interval);
          pollingRef.current[scenarioType] = null;
          setStatuses(prev => ({ ...prev, [scenarioType]: 'failed' }));
          showToast('Scenario provisioning failed', 'error');
        }
      } catch {
        // keep polling on transient errors
      }
    }, 5000);
    pollingRef.current[scenarioType] = interval;
  };

  const handleProvision = async (scenarioType: ScenarioType) => {
    setStatuses(prev => ({ ...prev, [scenarioType]: 'provisioning' }));

    try {
      const res = await fetch('/api/control-centre/scenario-provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enterpriseId, scenarioType }),
      });
      const data = await res.json();

      if (!data.success || !data.logId) {
        setStatuses(prev => ({ ...prev, [scenarioType]: 'failed' }));
        showToast(data.error || 'Failed to start scenario', 'error');
        return;
      }

      setLogIds(prev => ({ ...prev, [scenarioType]: data.logId }));
      pollStatus(scenarioType, data.logId);
    } catch {
      setStatuses(prev => ({ ...prev, [scenarioType]: 'failed' }));
      showToast('Network error', 'error');
    }
  };

  const statusToLabel = (s: ScenarioStatus) => {
    if (s === 'provisioning') return 'processing';
    if (s === 'completed') return 'completed';
    if (s === 'failed') return 'failed';
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {SCENARIOS.map(scenario => {
        const status = statuses[scenario.type];
        const badgeLabel = statusToLabel(status);

        return (
          <div key={scenario.type} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{scenario.label}</h3>
                <p className="text-sm text-gray-500">{scenario.description}</p>
                <p className="text-xs text-gray-400 mt-1">{scenario.guestCount} reservations</p>
              </div>
              {badgeLabel && <StatusBadge status={badgeLabel} />}
            </div>

            <button
              onClick={() => handleProvision(scenario.type)}
              disabled={status === 'provisioning'}
              className={`mt-3 w-full py-2 px-4 text-sm font-semibold rounded-lg transition-colors ${
                status === 'provisioning'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : status === 'completed'
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {status === 'provisioning' ? 'Provisioning...' : status === 'completed' ? 'Re-provision' : 'Provision'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
