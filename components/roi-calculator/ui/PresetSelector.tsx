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
                    background: 'rgba(179,178,251,0.25)',
                    color: 'var(--mews-white)',
                    border: '1.5px solid rgba(179,178,251,0.5)',
                    boxShadow: '0 0 12px rgba(179,178,251,0.15)',
                  }
                : {
                    background: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.55)',
                    border: '1.5px solid rgba(255,255,255,0.1)',
                  }
            }
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)';
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)';
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
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.4)',
            border: '1.5px dashed rgba(255,255,255,0.15)',
          }}
        >
          Custom
        </span>
      )}
    </div>
  );
}
