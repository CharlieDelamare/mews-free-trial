'use client';

interface ResultCardProps {
  label: string;
  value: number | string;
  unit?: string;
  large?: boolean;
}

export default function ResultCard({ label, value, unit = '', large = false }: ResultCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-4 transition-all duration-200"
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, var(--roi-slider-teal) 8%, transparent) 0%, color-mix(in srgb, var(--mews-charcoal) 5%, transparent) 100%)`,
        border: `1px solid color-mix(in srgb, var(--roi-slider-teal) 20%, transparent)`,
        boxShadow: `0 1px 4px color-mix(in srgb, var(--roi-slider-teal) 8%, transparent)`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px color-mix(in srgb, var(--roi-slider-teal) 16%, transparent)`;
        (e.currentTarget as HTMLElement).style.borderColor = `color-mix(in srgb, var(--roi-slider-teal) 35%, transparent)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 1px 4px color-mix(in srgb, var(--roi-slider-teal) 8%, transparent)`;
        (e.currentTarget as HTMLElement).style.borderColor = `color-mix(in srgb, var(--roi-slider-teal) 20%, transparent)`;
      }}
    >
      {/* Subtle corner accent */}
      <div
        className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--roi-slider-teal) 12%, transparent) 0%, transparent 70%)`,
        }}
      />

      <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2 leading-snug">
        {label}
      </p>
      <p
        className={`font-bold tabular-nums leading-none ${large ? 'text-2xl' : 'text-xl'}`}
        style={{ color: 'var(--mews-indigo)' }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span className="text-base font-medium ml-1 opacity-70">{unit}</span>}
      </p>
    </div>
  );
}
