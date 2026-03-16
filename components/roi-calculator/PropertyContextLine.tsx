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
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(28,29,36,0.08)',
      }}
    >
      <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      <span className="text-sm font-medium text-gray-600">{contextString}</span>
    </div>
  );
}
