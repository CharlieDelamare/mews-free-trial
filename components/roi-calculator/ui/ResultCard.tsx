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
        background: 'linear-gradient(135deg, rgba(107,163,176,0.08) 0%, rgba(45,44,55,0.05) 100%)',
        border: '1px solid rgba(107,163,176,0.2)',
        boxShadow: '0 1px 4px rgba(107,163,176,0.08)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(107,163,176,0.16)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(107,163,176,0.35)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(107,163,176,0.08)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(107,163,176,0.2)';
      }}
    >
      {/* Subtle corner accent */}
      <div
        className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 100% 0%, rgba(107,163,176,0.12) 0%, transparent 70%)',
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
