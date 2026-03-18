'use client';

interface ExplanationProps {
  title: string;
  description: string;
}

export default function Explanation({ title, description }: ExplanationProps) {
  return (
    <div
      className="mt-6 rounded-xl p-5"
      style={{
        background: 'color-mix(in srgb, var(--mews-charcoal) 3%, transparent)',
        border: '1px solid color-mix(in srgb, var(--mews-charcoal) 7%, transparent)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-1 h-4 rounded-full flex-shrink-0"
          style={{ background: 'linear-gradient(to bottom, var(--mews-indigo), var(--mews-indigo))' }}
        />
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          {title}
        </h4>
      </div>
      <p className="text-gray-500 text-sm leading-relaxed pl-3">{description}</p>
    </div>
  );
}
