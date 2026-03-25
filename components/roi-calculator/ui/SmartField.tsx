'use client';

import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';
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
    borderColor: 'border-[#E8FF5B]',
    bgColor: 'bg-[#E8FF5B]/20',
    dotColor: 'bg-[#b8cc00]',
    label: 'Benchmark estimate',
    labelColor: 'text-[#3f6212]',
  },
  confirmed: {
    borderColor: 'border-[#D1F9D6]',
    bgColor: 'bg-[#D1F9D6]/40',
    dotColor: 'bg-[#4ade80]',
    label: 'Confirmed',
    labelColor: 'text-[#15803d]',
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
      <div className="px-4 py-3">
        {/* Label + value row */}
        <div className="flex items-center justify-between gap-3 mb-2">
          {/* Label + info icon */}
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">
              {showQuestion && question ? question : label}
            </p>
            <div
              className="relative flex-shrink-0"
              onMouseEnter={() => setShowInfoTooltip(true)}
              onMouseLeave={() => setShowInfoTooltip(false)}
            >
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-help"
                aria-label="Benchmark info"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              {showInfoTooltip && (
                <div className="absolute z-50 bottom-full left-0 mb-2 w-64 px-3 py-2.5 text-xs text-gray-700 bg-white rounded-lg shadow-lg border border-gray-200">
                  <p className="font-medium mb-1">{benchmarkLabel}: {formatDisplay(benchmarkValue)}</p>
                  {benchmarkSourceInfo && <p className="text-gray-500">{benchmarkSourceInfo}</p>}
                  <div className="absolute top-full left-4 -mt-px">
                    <div className="w-2 h-2 bg-white border-r border-b border-gray-200 transform rotate-45" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Editable value */}
          {isEditing ? (
            <input
              ref={inputRef}
              type="number"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              className="w-32 px-2 py-0.5 text-lg font-bold text-right rounded-lg border bg-white text-gray-900 outline-none tabular-nums"
              style={{
                borderColor: 'var(--mews-indigo)',
                boxShadow: '0 0 0 3px color-mix(in srgb, var(--mews-indigo) 12%, transparent)',
              }}
            />
          ) : (
            <button
              onClick={startEditing}
              className="text-xl font-bold text-gray-900 tabular-nums border-b border-dashed border-gray-400 hover:border-gray-700 transition-colors leading-tight flex-shrink-0"
              title="Click to edit"
            >
              {formatDisplay(value)}
            </button>
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
          className="w-full cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${status === 'confirmed' ? '#4ade80' : '#E8FF5B'} 0%, ${status === 'confirmed' ? '#4ade80' : '#E8FF5B'} ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`,
            height: '6px',
            borderRadius: '99px',
          }}
        />
      </div>

      {/* Status bar */}
      <div className={`px-4 py-1.5 border-t ${style.borderColor} flex items-center gap-2`}>
        <div className={`w-1.5 h-1.5 rounded-full ${style.dotColor}`} />
        <span className={`text-xs font-medium ${style.labelColor}`}>{style.label}</span>
      </div>
    </div>
  );
}
