'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, Pencil, Info } from 'lucide-react';
import type { ConfidenceStatus } from '@/lib/roi-calculator/types/confidence';

interface SmartFieldProps {
  label: string;
  question?: string;
  value: number;
  benchmarkValue: number;
  benchmarkLabel: string;
  status: ConfidenceStatus;
  unit?: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  onConfirm: () => void;
  onRevertToBenchmark: () => void;
  compact?: boolean;           // Inline mode for review screens
  showQuestion?: boolean;      // Show conversational question
  benchmarkSourceInfo?: string; // Explanation of where benchmark data comes from
}

const STATUS_STYLES: Record<ConfidenceStatus, {
  borderColor: string;
  bgColor: string;
  dotColor: string;
  label: string;
  labelColor: string;
}> = {
  benchmark: {
    borderColor: 'border-amber-200',
    bgColor: 'bg-amber-50/50',
    dotColor: 'bg-amber-400',
    label: 'Benchmark estimate',
    labelColor: 'text-amber-600',
  },
  confirmed: {
    borderColor: 'border-emerald-200',
    bgColor: 'bg-emerald-50/40',
    dotColor: 'bg-emerald-500',
    label: 'Confirmed',
    labelColor: 'text-emerald-600',
  },
};

export default function SmartField({
  label,
  question,
  value,
  benchmarkValue,
  benchmarkLabel,
  status,
  unit = '',
  min,
  max,
  step,
  onChange,
  onConfirm,
  onRevertToBenchmark,
  compact = false,
  showQuestion = false,
  benchmarkSourceInfo,
}: SmartFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [editText, setEditText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const style = STATUS_STYLES[status];

  const isCurrency = unit && !['%', 'hrs', 'hours', 'min', 'minutes', 'rooms', 'people', 'sec', 'plans', 'channels', '/week', 'nights', 'reservations'].includes(unit);

  const formatDisplay = (v: number) => {
    if (isCurrency) {
      return v >= 10000
        ? `${unit}${Math.round(v).toLocaleString()}`
        : `${unit}${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
    if (unit === '%') return `${v}%`;
    if (unit === '/week') return `${v}/week`;
    if (unit) return `${v} ${unit}`;
    return String(v);
  };

  const startEditing = () => {
    setEditText(String(value));
    setIsEditing(true);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitEdit = () => {
    const parsed = parseFloat(editText);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped);
      if (clamped !== benchmarkValue) {
        onConfirm();
      } else {
        onRevertToBenchmark();
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setIsEditing(false);
  };

  const handleSliderChange = (newVal: number) => {
    onChange(newVal);
    if (newVal !== benchmarkValue) {
      onConfirm();
    } else {
      onRevertToBenchmark();
    }
  };

  const hasDeviation = Math.abs(value - benchmarkValue) > step * 0.5;
  const deviationPercent = benchmarkValue !== 0
    ? Math.round(((value - benchmarkValue) / benchmarkValue) * 100)
    : 0;

  // ── Compact mode (for review/summary) ───────────────────────────
  if (compact) {
    return (
      <div
        className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border ${style.borderColor} ${style.bgColor} transition-all duration-200`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dotColor}`} />
          <span className="text-sm text-gray-700 truncate">{label}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={startEditing}
            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
          >
            {isEditing ? (
              <input
                ref={inputRef}
                type="number"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                className="w-20 px-1.5 py-0.5 text-right text-sm font-semibold rounded border border-blue-300 bg-white outline-none"
              />
            ) : (
              formatDisplay(value)
            )}
          </button>
          <span className={`text-xs ${style.labelColor}`}>{style.label}</span>
        </div>
      </div>
    );
  }

  // ── Full mode (for intake flow) ─────────────────────────────────
  return (
    <div className={`rounded-xl border ${style.borderColor} ${style.bgColor} transition-all duration-300`}>
      <div className="p-4 sm:p-5">
        {/* Question / Label */}
        {showQuestion && question ? (
          <p className="text-base font-medium text-gray-800 mb-1 leading-snug">{question}</p>
        ) : (
          <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
        )}

        {/* Benchmark reference */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
          <span>
            {benchmarkLabel}: <span className="font-medium text-gray-600">{formatDisplay(benchmarkValue)}</span>
          </span>
          {benchmarkSourceInfo && (
            <div
              className="relative"
              onMouseEnter={() => setShowInfoTooltip(true)}
              onMouseLeave={() => setShowInfoTooltip(false)}
            >
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-help"
                aria-label="Data source info"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              {showInfoTooltip && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 px-3 py-2.5 text-xs text-gray-700 bg-white rounded-lg shadow-lg border border-gray-200">
                  {benchmarkSourceInfo}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                    <div className="w-2 h-2 bg-white border-r border-b border-gray-200 transform rotate-45" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Value display + edit */}
        <div className="flex items-center gap-3 mb-3">
          {isEditing ? (
            <input
              ref={inputRef}
              type="number"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              className="flex-1 px-3 py-2 text-lg font-bold rounded-lg border border-blue-300 bg-white outline-none text-gray-900"
              style={{ boxShadow: '0 0 0 3px color-mix(in srgb, var(--mews-indigo) 12%, transparent)' }}
            />
          ) : (
            <button
              onClick={startEditing}
              className="flex-1 flex items-center gap-2 px-3 py-2 text-left rounded-lg hover:bg-white/60 transition-colors group"
            >
              <span className="text-2xl font-bold text-gray-900 tabular-nums">
                {formatDisplay(value)}
              </span>
              <Pencil className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          {/* Deviation indicator */}
          {hasDeviation && status === 'confirmed' && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`text-xs font-medium ${deviationPercent > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {deviationPercent > 0 ? '+' : ''}{deviationPercent}% vs benchmark
              </span>
            </div>
          )}
        </div>

        {/* Slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
          className="w-full cursor-pointer mb-4"
          style={{
            background: `linear-gradient(to right, ${status === 'confirmed' ? 'var(--mews-success)' : '#f59e0b'} 0%, ${status === 'confirmed' ? 'var(--mews-success)' : '#f59e0b'} ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`,
            height: '6px',
            borderRadius: '99px',
          }}
        />

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {status === 'benchmark' && (
            <button
              onClick={onConfirm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Looks right
            </button>
          )}
          {status === 'confirmed' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              Confirmed
            </span>
          )}
          {!isEditing && (
            <button
              onClick={startEditing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className={`px-4 py-2 border-t ${style.borderColor} flex items-center gap-2`}>
        <div className={`w-2 h-2 rounded-full ${style.dotColor}`} />
        <span className={`text-xs font-medium ${style.labelColor}`}>{style.label}</span>
      </div>
    </div>
  );
}
