'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { parseCsvText } from '@/lib/control-centre/csv-parser';
import type { ParsedCsvRow } from '@/types/control-centre';

interface Props {
  enterpriseId: string;
}

export default function ImportTab({ enterpriseId }: Props) {
  const { showToast } = useToast();
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState<ParsedCsvRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [logId, setLogId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ success: number; failure: number; total: number } | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current); }, []);

  const processFile = (text: string) => {
    setCsvText(text);
    const result = parseCsvText(text);
    setParseErrors(result.errors);
    setPreview(result.rows.slice(0, 10));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => processFile(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => processFile(ev.target?.result as string);
      reader.readAsText(file);
    }
  }, []);

  const pollProgress = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/control-centre/scenario-status?logId=${id}`);
        const data = await res.json();
        if (data.successCount !== undefined || data.failureCount !== undefined) {
          setProgress({ success: data.successCount || 0, failure: data.failureCount || 0, total: data.totalItems || 0 });
        }
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
          pollingRef.current = null;
          setImporting(false);
          showToast(data.status === 'completed' ? 'Import complete!' : 'Import failed', data.status === 'completed' ? 'success' : 'error');
        }
      } catch { /* keep polling */ }
    }, 3000);
    pollingRef.current = interval;
  };

  const handleImport = async () => {
    if (!csvText || parseErrors.length > 0) return;
    setImporting(true);

    try {
      const res = await fetch('/api/control-centre/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enterpriseId, csvText }),
      });
      const data = await res.json();

      if (!data.success) {
        showToast(data.error || 'Import failed', 'error');
        setImporting(false);
        return;
      }

      setLogId(data.logId);
      pollProgress(data.logId);
    } catch {
      showToast('Network error', 'error');
      setImporting(false);
    }
  };

  const progressPct = progress && progress.total > 0
    ? Math.round(((progress.success + progress.failure) / progress.total) * 100)
    : 0;

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Upload area */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 bg-white'
        }`}
      >
        <p className="text-sm text-gray-600 mb-2">Drag & drop a CSV file here, or</p>
        <label className="cursor-pointer text-indigo-600 text-sm font-medium hover:text-indigo-700">
          browse to upload
          <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
        </label>
        <p className="text-xs text-gray-400 mt-2">
          Required columns: GuestFirstName; GuestLastName; CheckIn; CheckOut; GuestCount
        </p>
      </div>

      {/* Validation errors */}
      {parseErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-medium text-red-700 mb-2">Validation errors:</p>
          <ul className="text-sm text-red-600 space-y-1 list-disc pl-4">
            {parseErrors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-700">Preview (first {preview.length} rows)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {['First Name', 'Last Name', 'Check-in', 'Check-out', 'Guests', 'Price/Night'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-gray-700">{row.GuestFirstName}</td>
                    <td className="px-3 py-2 text-gray-700">{row.GuestLastName}</td>
                    <td className="px-3 py-2 text-gray-700">{row.CheckIn}</td>
                    <td className="px-3 py-2 text-gray-700">{row.CheckOut}</td>
                    <td className="px-3 py-2 text-gray-700">{row.GuestCount}</td>
                    <td className="px-3 py-2 text-gray-500">{row.PricePerNight ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {importing && progress && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Importing...</span>
            <span>{progress.success + progress.failure} / {progress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Import button */}
      {preview.length > 0 && parseErrors.length === 0 && (
        <button
          onClick={handleImport}
          disabled={importing}
          className={`py-2 px-6 text-white text-sm font-semibold rounded-lg transition-colors ${
            importing ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {importing ? 'Importing...' : `Import ${preview.length} rows`}
        </button>
      )}
    </div>
  );
}
