import type {
  ConfidenceMap,
  ConfidenceScore,
  ConfidenceStatus,
  FieldConfidence,
  PriorityInput,
} from '@/lib/roi-calculator/types/confidence';

// ── Build initial confidence map from benchmark defaults ─────────────

/**
 * For presentations saved before confidence map persistence was added:
 * reconstruct confidence status by comparing saved values against benchmark values.
 * Fields that differ from their benchmark are marked 'adjusted'; equal ones stay 'benchmark'.
 */
export function inferConfidenceMap(
  priorityInputs: PriorityInput[],
  getBenchmark: (slice: string, field: string) => number,
  getSaved: (slice: string, field: string) => number,
): ConfidenceMap {
  const map: ConfidenceMap = {};
  for (const input of priorityInputs) {
    const benchmarkValue = getBenchmark(input.slice, input.field);
    const savedValue = getSaved(input.slice, input.field);
    map[input.key] = {
      benchmarkValue,
      status: savedValue !== benchmarkValue ? 'confirmed' : 'benchmark',
    };
  }
  return map;
}

export function buildInitialConfidenceMap(
  priorityInputs: PriorityInput[],
  getCurrentValue: (slice: string, field: string) => number,
): ConfidenceMap {
  const map: ConfidenceMap = {};
  for (const input of priorityInputs) {
    map[input.key] = {
      status: 'benchmark',
      benchmarkValue: getCurrentValue(input.slice, input.field),
    };
  }
  return map;
}

// ── Compute aggregate confidence score ───────────────────────────────

const WEIGHT: Record<PriorityInput['importance'], number> = {
  critical: 3,
  high: 2,
  medium: 1,
};

const STATUS_SCORE: Record<ConfidenceStatus, number> = {
  confirmed: 1.0,
  benchmark: 0.3,
};

export function computeConfidenceScore(
  confidenceMap: ConfidenceMap,
  priorityInputs: PriorityInput[] = [],
): ConfidenceScore & { percentage: number } {
  let confirmedCount = 0;
  let benchmarkCount = 0;
  let weightedScore = 0;
  let weightedMax = 0;

  const unvalidated: ConfidenceScore['unvalidatedFields'] = [];

  for (const input of priorityInputs) {
    const conf: FieldConfidence | undefined = confidenceMap[input.key];
    // Treat legacy 'adjusted'/'unknown' statuses gracefully
    const rawStatus = conf?.status ?? 'benchmark';
    const status: ConfidenceStatus = (rawStatus === 'adjusted') ? 'confirmed' : (rawStatus === 'unknown' ? 'benchmark' : rawStatus);
    const weight = WEIGHT[input.importance] ?? 1;

    weightedScore += STATUS_SCORE[status] * weight;
    weightedMax += weight;

    if (status === 'confirmed') {
      confirmedCount++;
    } else {
      benchmarkCount++;
      unvalidated.push({
        key: input.key,
        label: input.label,
        importance: input.importance,
      });
    }
  }

  const overall = weightedMax > 0 ? Math.round((weightedScore / weightedMax) * 100) : 0;
  const totalTracked = priorityInputs.length;

  // Sort unvalidated by importance (critical first)
  const importanceOrder = { critical: 0, high: 1, medium: 2 };
  unvalidated.sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]);

  let level: ConfidenceScore['level'];
  if (overall >= 90) level = 'high-confidence';
  else if (overall >= 70) level = 'validated';
  else if (overall >= 45) level = 'indicative';
  else level = 'directional';

  return {
    overall,
    percentage: overall,
    level,
    confirmedCount,
    benchmarkCount,
    totalTracked,
    unvalidatedFields: unvalidated,
  };
}

// ── Human-readable label for confidence level ────────────────────────

export const CONFIDENCE_LABELS: Record<ConfidenceScore['level'], {
  label: string;
  description: string;
  color: string;
  bgColor: string;
}> = {
  'directional': {
    label: 'Directional Estimate',
    description: 'Based primarily on industry benchmarks. Validate key inputs to increase accuracy.',
    color: 'var(--mews-coral)',
    bgColor: 'rgba(255, 90, 101, 0.1)',
  },
  'indicative': {
    label: 'Indicative Estimate',
    description: 'Some inputs validated. A few key assumptions still need confirmation.',
    color: 'var(--mews-indigo)',
    bgColor: 'rgba(179, 178, 251, 0.15)',
  },
  'validated': {
    label: 'Validated Estimate',
    description: 'Most key inputs confirmed by the prospect. Strong basis for a business case.',
    color: 'var(--mews-success)',
    bgColor: 'rgba(16, 185, 129, 0.08)',
  },
  'high-confidence': {
    label: 'High-Confidence Estimate',
    description: 'All critical inputs confirmed. This ROI is grounded in your actual data.',
    color: 'var(--mews-success-dark)',
    bgColor: 'rgba(5, 150, 105, 0.08)',
  },
};
