'use client';

import { Shield, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { ConfidenceScore } from '@/lib/roi-calculator/types/confidence';
import { CONFIDENCE_LABELS } from '@/lib/roi-calculator/utils/confidenceScoring';

const LEVEL_ICONS: Record<ConfidenceScore['level'], React.ReactNode> = {
  'directional': <AlertTriangle className="w-4 h-4" />,
  'indicative': <Shield className="w-4 h-4" />,
  'validated': <CheckCircle2 className="w-4 h-4" />,
  'high-confidence': <ShieldCheck className="w-4 h-4" />,
};

interface ConfidenceBadgeProps {
  score: ConfidenceScore;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function ConfidenceBadge({ score, onClick, size = 'md' }: ConfidenceBadgeProps) {
  const meta = CONFIDENCE_LABELS[score.level];

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-xs gap-1.5',
    lg: 'px-4 py-2 text-sm gap-2',
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-full font-medium border transition-all hover:shadow-sm ${sizeClasses[size]}`}
      style={{
        color: meta.color,
        backgroundColor: meta.bgColor,
        borderColor: meta.color + '30',
      }}
      title={meta.description}
    >
      {LEVEL_ICONS[score.level]}
      <span>{meta.label}</span>
      <span
        className="font-bold ml-0.5"
        style={{ color: meta.color }}
      >
        {score.overall}%
      </span>
    </button>
  );
}
