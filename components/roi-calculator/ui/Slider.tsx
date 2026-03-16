'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';

// Pre-defined breakpoints for auto-extending slider max on currency sliders.
// Ensures stable max values that don't jump during normal dragging.
const NICE_BREAKPOINTS = [
  100, 200, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 50_000,
  100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000,
  10_000_000, 20_000_000, 50_000_000, 100_000_000,
];

function niceMax(val: number): number {
  const target = val * 2;
  for (const n of NICE_BREAKPOINTS) {
    if (target <= n) return n;
  }
  return target;
}

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
  color?: 'yellow' | 'orange' | 'purple' | 'pink';
  formatValue?: (value: number) => string;
  tooltip?: string;
}

export default function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit = '',
  color = 'yellow',
  formatValue,
  tooltip,
}: SliderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const [showTooltip, setShowTooltip] = useState(false);

  // Color scheme per slider type
  const colorScheme = {
    yellow: {
      track: '#EDFE77',
      badgeBg: 'rgba(237,254,119,0.10)',
      badgeBorder: 'rgba(237,254,119,0.25)',
      badgeText: '#6B7700',
      editBorder: 'rgba(237,254,119,0.4)',
      editShadow: 'rgba(237,254,119,0.1)',
      hoverBg: 'rgba(237,254,119,0.16)',
    },
    orange: {
      track: '#EA580C',
      badgeBg: 'rgba(234,88,12,0.08)',
      badgeBorder: 'rgba(234,88,12,0.2)',
      badgeText: '#C2410C',
      editBorder: 'rgba(234,88,12,0.4)',
      editShadow: 'rgba(234,88,12,0.1)',
      hoverBg: 'rgba(234,88,12,0.14)',
    },
    purple: {
      track: '#EF89D6',
      badgeBg: 'rgba(239,137,214,0.08)',
      badgeBorder: 'rgba(239,137,214,0.2)',
      badgeText: '#8B3580',
      editBorder: 'rgba(239,137,214,0.4)',
      editShadow: 'rgba(239,137,214,0.1)',
      hoverBg: 'rgba(239,137,214,0.14)',
    },
    pink: {
      track: '#6BA3B0',
      badgeBg: 'rgba(107,163,176,0.08)',
      badgeBorder: 'rgba(107,163,176,0.2)',
      badgeText: '#4d8a96',
      editBorder: 'rgba(107,163,176,0.4)',
      editShadow: 'rgba(107,163,176,0.12)',
      hoverBg: 'rgba(107,163,176,0.14)',
    },
  };
  const cs = colorScheme[color];

  const isCurrency = unit && !['%', 'hrs', 'hours', 'min', 'minutes'].includes(unit);

  // Auto-extend max & step for currency sliders when the value exceeds the
  // hard-coded max (happens for high-nominal currencies like JPY, HUF, CZK).
  let effectiveMax = max;
  let effectiveStep = step;
  if (isCurrency && value > max) {
    effectiveMax = niceMax(value);
    effectiveStep = Math.max(step, Math.round(effectiveMax / 200));
  }

  const displayValue = formatValue
    ? formatValue(value)
    : isCurrency
      ? `${unit} ${value.toFixed(2)}`
      : unit === '%'
        ? `${value}${unit}`
        : unit
          ? `${value.toFixed(step < 1 ? 2 : 0)} ${unit}`
          : value.toFixed(step < 1 ? 2 : 0);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleEditSubmit = () => {
    const numValue = parseFloat(editValue);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(effectiveMax, numValue));
      onChange(clampedValue);
      setEditValue(clampedValue.toString());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setEditValue(value.toString());
      setIsEditing(false);
    }
  };

  const fillPercent = ((value - min) / (effectiveMax - min)) * 100;

  return (
    <div className="space-y-2.5">
      {/* Label + Value badge row */}
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <label className="text-sm font-medium text-gray-700 leading-snug">
            {label}
          </label>
          {tooltip && (
            <div
              className="relative"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <span
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 cursor-help"
                aria-label="More info"
              >
                <Info className="w-3.5 h-3.5" />
              </span>
              {showTooltip && (
                <div
                  className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 px-3 py-2.5 text-xs text-gray-700 bg-white rounded-lg shadow-lg border border-gray-200 leading-relaxed"
                >
                  {tooltip.includes(' | Ask: ') ? (
                    <>
                      <span>{tooltip.split(' | Ask: ')[0]}</span>
                      <span className="block mt-1.5 pt-1.5 border-t border-gray-100 font-semibold text-blue-700">
                        Ask: {tooltip.split(' | Ask: ')[1]}
                      </span>
                    </>
                  ) : tooltip}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                    <div className="w-2 h-2 bg-white border-r border-b border-gray-200 transform rotate-45" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {isEditing ? (
          <input
            type="number"
            value={editValue}
            onChange={handleEditChange}
            onBlur={handleEditSubmit}
            onKeyDown={handleKeyDown}
            autoFocus
            className="px-3 py-1.5 rounded-lg font-semibold text-sm min-w-[80px] text-center border transition-all duration-150 flex-shrink-0"
            style={{
              background: cs.badgeBg,
              borderColor: cs.editBorder,
              color: cs.badgeText,
              outline: 'none',
              boxShadow: `0 0 0 3px ${cs.editShadow}`,
            }}
          />
        ) : (
          <button
            onClick={() => {
              setIsEditing(true);
              setEditValue(value.toString());
            }}
            className="px-3 py-1.5 rounded-lg font-semibold text-sm min-w-[80px] text-center transition-all duration-150 flex-shrink-0 cursor-text"
            style={{
              background: cs.badgeBg,
              border: `1px solid ${cs.badgeBorder}`,
              color: cs.badgeText,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = cs.hoverBg;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = cs.badgeBg;
            }}
          >
            {displayValue}
          </button>
        )}
      </div>

      {/* Range input */}
      <input
        type="range"
        min={min}
        max={effectiveMax}
        step={effectiveStep}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${cs.track} 0%, ${cs.track} ${Math.min(fillPercent, 100)}%, #e5e7eb ${Math.min(fillPercent, 100)}%, #e5e7eb 100%)`,
          height: '6px',
          borderRadius: '99px',
        }}
      />
    </div>
  );
}
