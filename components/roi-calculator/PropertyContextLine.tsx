'use client';

import { Building2 } from 'lucide-react';

interface PropertyContextLineProps {
  contextString: string;
}

export default function PropertyContextLine({ contextString }: PropertyContextLineProps) {
  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full mx-auto"
      style={{
        background: 'color-mix(in srgb, var(--mews-white) 70%, transparent)',
        backdropFilter: 'blur(8px)',
        border: '1px solid color-mix(in srgb, var(--mews-night-black) 8%, transparent)',
      }}
    >
      <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      <span className="text-sm font-medium text-gray-600">{contextString}</span>
    </div>
  );
}
