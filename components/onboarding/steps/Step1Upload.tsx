'use client';

import { useCallback, useState } from 'react';
import type { ParseSummary } from '@/lib/onboarding-excel';

interface Step1UploadProps {
  sessionId?: string;
  summary: ParseSummary | null;
  onFileUploaded: (sessionId: string, summary: ParseSummary) => void;
  onStartEmpty: () => void;
  onResetSummary?: () => void;
  createdBy?: string;
}

export function Step1Upload({
  sessionId,
  summary,
  onFileUploaded,
  onStartEmpty,
  onResetSummary,
  createdBy,
}: Step1UploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith('.xlsx')) {
        setError('Please upload an .xlsx file.');
        return;
      }
      setIsUploading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('file', file);
        if (createdBy) formData.append('createdBy', createdBy);

        const res = await fetch('/api/onboarding/sessions', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error ?? 'Upload failed');
        onFileUploaded(data.session.id, data.summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    },
    [createdBy, onFileUploaded],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile],
  );

  // If we already have a summary (file was uploaded), show the summary
  if (summary && sessionId) {
    return (
      <div className="max-w-xl space-y-6">
        <div className="rounded-xl border-2 border-[var(--mews-primary-pink)] bg-pink-50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--mews-primary-pink)] flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--mews-night-black)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--mews-night-black)]">File uploaded successfully</p>
              {summary.propertyName && (
                <p className="text-xs text-gray-500">{summary.propertyName}</p>
              )}
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            <Stat label="Room categories" value={summary.categoryCount} />
            <Stat label="Individual rooms" value={summary.roomCount} />
            <Stat label="Rates" value={summary.rateCount} />
            <Stat label="Products" value={summary.productCount} />
            <Stat label="Services" value={summary.serviceCount} />
          </dl>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Click <strong>Next</strong> to review and edit your property data.
          </p>
          {onResetSummary && (
            <button
              type="button"
              onClick={onResetSummary}
              className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors flex-shrink-0 ml-4"
            >
              Upload a different file
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <p className="text-sm text-gray-600">
        Upload your completed Mews RIA import file (.xlsx) to pre-fill all fields. You&apos;ll be
        able to review and edit every sheet before exporting.
      </p>

      {/* Drop zone */}
      <div
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
          isDragging
            ? 'border-[var(--mews-primary-pink)] bg-pink-50'
            : 'border-gray-300 hover:border-[var(--mews-primary-pink)] hover:bg-pink-50/40'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-700">
              Drop your .xlsx file here, or{' '}
              <label className="text-[var(--mews-primary-pink)] hover:underline cursor-pointer font-semibold">
                browse
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFile(file);
                  }}
                />
              </label>
            </p>
            <p className="text-xs text-gray-400 mt-1">.xlsx files only · Mews RIA import format</p>
          </div>
          {isUploading && (
            <p className="text-sm text-[var(--mews-primary-pink)] animate-pulse font-medium">
              Parsing file…
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      <button
        type="button"
        onClick={onStartEmpty}
        className="w-full py-2.5 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Start without a file
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg px-3 py-2.5 border border-pink-100">
      <p className="text-xl font-bold text-[var(--mews-night-black)]">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
