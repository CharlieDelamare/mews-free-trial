'use client';

import type { ConfidenceScore } from '@/lib/roi-calculator/types/confidence';
import { CONFIDENCE_LABELS } from '@/lib/roi-calculator/utils/confidenceScoring';

interface ConfidenceBarProps {
  score: ConfidenceScore;
  onValidateClick?: () => void;
}

export default function ConfidenceBar({ score, onValidateClick }: ConfidenceBarProps) {
  const meta = CONFIDENCE_LABELS[score.level];
  const total = score.totalTracked || 1;

  // Stacked bar segments
  const confirmedPct = ((score.confirmedCount + score.adjustedCount) / total) * 100;
  const benchmarkPct = (score.benchmarkCount / total) * 100;
  const unknownPct = (score.unknownCount / total) * 100;

  return (
    <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: meta.color }}
          />
          <span className="text-sm font-semibold text-gray-800">
            Input Confidence
          </span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ color: meta.color, backgroundColor: meta.bgColor }}
          >
            {meta.label}
          </span>
        </div>
        {score.unvalidatedFields.length > 0 && onValidateClick && (
          <button
            onClick={onValidateClick}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            Validate {score.unvalidatedFields.length} remaining →
          </button>
        )}
      </div>

      {/* Stacked confidence bar */}
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
        {confirmedPct > 0 && (
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${confirmedPct}%` }}
            title={`${score.confirmedCount + score.adjustedCount} confirmed/adjusted`}
          />
        )}
        {benchmarkPct > 0 && (
          <div
            className="h-full bg-amber-400 transition-all duration-500"
            style={{ width: `${benchmarkPct}%` }}
            title={`${score.benchmarkCount} benchmark estimates`}
          />
        )}
        {unknownPct > 0 && (
          <div
            className="h-full bg-gray-300 transition-all duration-500"
            style={{ width: `${unknownPct}%` }}
            title={`${score.unknownCount} unknown`}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {score.confirmedCount + score.adjustedCount} validated
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          {score.benchmarkCount} estimated
        </span>
        {score.unknownCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            {score.unknownCount} unknown
          </span>
        )}
      </div>
    </div>
  );
}
