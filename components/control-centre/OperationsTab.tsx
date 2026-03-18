'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

interface Props {
  enterpriseId: string;
}

interface Operation {
  key: string;
  label: string;
  description: string;
  isLongRunning: boolean;
  confirmText: string;
  endpoint: string;
  buttonColor: string;
}

const OPERATIONS: Operation[] = [
  {
    key: 'inspect',
    label: 'Inspect All Rooms',
    description: 'Mark all dirty/clean rooms as Inspected',
    isLongRunning: false,
    confirmText: 'Mark all dirty and clean rooms as Inspected?',
    endpoint: '/api/control-centre/inspect',
    buttonColor: 'bg-[#E3FFFD] hover:bg-[#CCFAF7] text-mews-night-black',
  },
  {
    key: 'close_overdue_tasks',
    label: 'Close Overdue Tasks',
    description: 'Close all tasks past their deadline',
    isLongRunning: false,
    confirmText: 'Close all overdue tasks?',
    endpoint: '/api/control-centre/close-overdue-tasks',
    buttonColor: 'bg-[#FF5303] hover:bg-[#E64A00] text-white',
  },
  {
    key: 'morning_prep',
    label: 'Morning Prep',
    description: 'Fix check-in/out times + inspect rooms',
    isLongRunning: true,
    confirmText: 'Run morning prep? This will fix reservation times and inspect all rooms.',
    endpoint: '/api/control-centre/morning-prep',
    buttonColor: 'bg-[#EFFD91] hover:bg-[#E8F57A] text-mews-night-black',
  },
  {
    key: 'auto_checkout',
    label: 'Auto Checkout',
    description: "Process all today's departures",
    isLongRunning: true,
    confirmText: "Check out all of today's departures?",
    endpoint: '/api/control-centre/auto-checkout',
    buttonColor: 'bg-[#D1F9D6] hover:bg-[#B8F4BF] text-mews-night-black',
  },
];

export default function OperationsTab({ enterpriseId }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleConfirm = async (op: Operation) => {
    setLoading(op.key);
    setConfirming(null);

    try {
      const res = await fetch(op.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enterpriseId }),
      });
      const data = await res.json();

      if (!data.success) {
        showToast(data.error || 'Operation failed', 'error');
        return;
      }

      if (op.isLongRunning) {
        router.push('/logs');
      } else {
        const result = data.result;
        showToast(
          `Done: ${result?.successCount ?? 0} succeeded, ${result?.failureCount ?? 0} failed`,
          result?.failureCount > 0 ? 'error' : 'success'
        );
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {OPERATIONS.map(op => (
        <div key={op.key} className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold text-mews-night-black mb-1">{op.label}</h3>
          <p className="text-sm text-neutral-500 mb-4">{op.description}</p>

          {confirming === op.key ? (
            <div className="space-y-3">
              <p className="text-sm text-neutral-700 bg-neutral-50 rounded-lg p-3">{op.confirmText}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(null)}
                  className="flex-1 py-2 px-3 bg-neutral-100 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirm(op)}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${op.buttonColor}`}
                >
                  Confirm
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(op.key)}
              disabled={loading === op.key}
              className={`w-full py-2 px-4 text-sm font-semibold rounded-lg transition-colors ${
                loading === op.key ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed' : op.buttonColor
              }`}
            >
              {loading === op.key ? 'Running...' : op.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
