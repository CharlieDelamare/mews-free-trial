'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import type { DoorAssignment } from '@/types/control-centre';

interface Props {
  enterpriseId: string;
  isEnabled: boolean;
}

export default function DoorsTab({ enterpriseId, isEnabled }: Props) {
  const { showToast } = useToast();
  const [assignments, setAssignments] = useState<DoorAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (isEnabled && enterpriseId) {
      fetchAssignments();
    }
  }, [isEnabled, enterpriseId]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/control-centre/doors?enterpriseId=${enterpriseId}`);
      const data = await res.json();
      if (data.success) setAssignments(data.result?.assignments || []);
    } catch {
      showToast('Failed to fetch door assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProvision = async () => {
    setProvisioning(true);
    try {
      const res = await fetch('/api/control-centre/doors/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enterpriseId, reservationIds: assignments.map(a => a.reservationId) }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Door provisioning started', 'success');
      } else {
        showToast(data.error || 'Provisioning failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setProvisioning(false);
    }
  };

  const handleRecoverSplit = async () => {
    setRecovering(true);
    try {
      const res = await fetch('/api/control-centre/doors/recover-split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enterpriseId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Recovered ${data.result?.successCount ?? 0} split doors`, 'success');
        fetchAssignments();
      } else {
        showToast(data.error || 'Recovery failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setRecovering(false);
    }
  };

  if (!isEnabled) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm text-center">
        <p className="text-neutral-500 text-sm">
          Door management is only available for the TradeShow property.
          Select the correct property to enable this feature.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={handleProvision}
          disabled={provisioning}
          className={`py-2 px-4 text-white text-sm font-semibold rounded-lg transition-colors ${
            provisioning ? 'bg-gray-400 cursor-not-allowed' : 'bg-mews-primary text-mews-night-black hover:bg-mews-primary-hover'
          }`}
        >
          {provisioning ? 'Provisioning...' : 'Provision Doors'}
        </button>
        <button
          onClick={handleRecoverSplit}
          disabled={recovering}
          className={`py-2 px-4 text-white text-sm font-semibold rounded-lg transition-colors ${
            recovering ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'
          }`}
        >
          {recovering ? 'Recovering...' : 'Recover Split Doors'}
        </button>
        <button
          onClick={fetchAssignments}
          disabled={loading}
          className="py-2 px-4 text-neutral-700 text-sm font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading assignments...</p>
      ) : assignments.length === 0 ? (
        <p className="text-sm text-neutral-500">No door assignments found.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Reservation</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Room</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Token</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Valid From</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Valid To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {assignments.map(a => (
                <tr key={a.tokenId || a.reservationId}>
                  <td className="px-4 py-3 text-xs text-neutral-600 font-mono">{a.reservationId.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{a.roomName || '—'}</td>
                  <td className="px-4 py-3 text-xs font-mono text-neutral-500">{a.tokenValue || '—'}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500">{a.validFrom ? new Date(a.validFrom).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500">{a.validTo ? new Date(a.validTo).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
