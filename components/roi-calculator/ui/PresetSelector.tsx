'use client';

import type { PresetKey } from '@/lib/roi-calculator/types/calculator';

interface PresetSelectorProps {
  activePreset: PresetKey;
  onSelect: (preset: PresetKey) => void;
}

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'full', label: 'Full Platform' },
  { key: 'guest-experience', label: 'Guest Experience' },
  { key: 'payment', label: 'Payments' },
  { key: 'rms', label: 'Revenue Mgmt' },
  { key: 'operations', label: 'Operations' },
];

export default function PresetSelector({ activePreset, onSelect }: PresetSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map(({ key, label }) => {
        const isActive = activePreset === key;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
            style={
              isActive
                ? {
                    background: 'color-mix(in srgb, var(--mews-indigo) 25%, transparent)',
                    color: 'var(--mews-white)',
                    border: '1.5px solid color-mix(in srgb, var(--mews-indigo) 50%, transparent)',
                    boxShadow: '0 0 12px color-mix(in srgb, var(--mews-indigo) 15%, transparent)',
                  }
                : {
                    background: 'color-mix(in srgb, var(--mews-white) 8%, transparent)',
                    color: 'color-mix(in srgb, var(--mews-white) 55%, transparent)',
                    border: '1.5px solid color-mix(in srgb, var(--mews-white) 10%, transparent)',
                  }
            }
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-white) 14%, transparent)';
                (e.currentTarget as HTMLElement).style.color = 'color-mix(in srgb, var(--mews-white) 80%, transparent)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-white) 8%, transparent)';
                (e.currentTarget as HTMLElement).style.color = 'color-mix(in srgb, var(--mews-white) 55%, transparent)';
              }
            }}
          >
            {label}
          </button>
        );
      })}
      {activePreset === 'custom' && (
        <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: 'color-mix(in srgb, var(--mews-white) 8%, transparent)',
            color: 'color-mix(in srgb, var(--mews-white) 40%, transparent)',
            border: '1.5px dashed color-mix(in srgb, var(--mews-white) 15%, transparent)',
          }}
        >
          Custom
        </span>
      )}
    </div>
  );
}
