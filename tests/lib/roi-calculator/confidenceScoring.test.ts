import { describe, it, expect } from 'vitest';
import { computeConfidenceScore } from '@/lib/roi-calculator/utils/confidenceScoring';
import type { ConfidenceMap } from '@/lib/roi-calculator/types/confidence';

describe('computeConfidenceScore', () => {
  it('returns directional score when map is empty', () => {
    const result = computeConfidenceScore({} as ConfidenceMap);
    expect(result.level).toBe('directional');
    expect(result.percentage).toBeGreaterThanOrEqual(0);
  });

  it('returns non-negative percentage', () => {
    const result = computeConfidenceScore({} as ConfidenceMap);
    expect(result.percentage).toBeGreaterThanOrEqual(0);
    expect(result.percentage).toBeLessThanOrEqual(100);
  });
});
