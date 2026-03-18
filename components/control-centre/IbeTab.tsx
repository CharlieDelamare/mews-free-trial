'use client';

import { useRouter } from 'next/navigation';
import type { IbeTheme } from '@/types/control-centre';

interface Props {
  enterpriseId: string;
}

const IBE_THEMES: Array<{ theme: IbeTheme; label: string; description: string; color: string }> = [
  { theme: 'luxury', label: 'Luxury Retreat', description: 'Premium experiences for discerning travellers', color: 'var(--mews-night-black)' },
  { theme: 'city', label: 'City Break', description: 'Urban escapes in the heart of the city', color: 'var(--mews-deep-blue)' },
  { theme: 'resort', label: 'Resort & Spa', description: 'Relaxation and wellness in a resort setting', color: 'var(--mews-olive-green)' },
  { theme: 'conference', label: 'Conference & Events', description: 'Professional venues for meetings and events', color: '#2D3748' },
  { theme: 'budget', label: 'Budget Smart', description: 'Great value stays without compromising quality', color: '#2C5282' },
];

export default function IbeTab({ enterpriseId }: Props) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {IBE_THEMES.map(({ theme, label, description, color }) => (
        <button
          key={theme}
          onClick={() => router.push(`/control-centre/ibe/${theme}?enterpriseId=${enterpriseId}`)}
          className="bg-white rounded-xl p-5 shadow-sm text-left hover:shadow-md transition-shadow group"
        >
          <div
            className="w-10 h-10 rounded-lg mb-3 flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: color }}
          >
            {label[0]}
          </div>
          <h3 className="text-base font-semibold text-mews-night-black group-hover:text-mews-primary transition-colors mb-1">
            {label}
          </h3>
          <p className="text-sm text-neutral-500">{description}</p>
          <p className="text-xs text-mews-primary mt-2 font-medium">Open IBE →</p>
        </button>
      ))}
    </div>
  );
}
