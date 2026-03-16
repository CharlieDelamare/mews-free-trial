import { describe, it, expect } from 'vitest';
import { computeConfidenceScore } from '@/lib/roi-calculator/utils/confidenceScoring';
import type { ConfidenceMap, PriorityInput } from '@/lib/roi-calculator/types/confidence';

const makePriorityInput = (
  key: string,
  importance: PriorityInput['importance'],
): PriorityInput => ({
  key,
  slice: 'sharedVariables',
  field: key,
  label: key,
  question: `What is ${key}?`,
  benchmarkLabel: `Benchmark for ${key}`,
  min: 1,
  max: 1000,
  step: 1,
  group: 'property',
  importance,
});

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

  it('produces a valid level and populates unvalidatedFields when mixing confirmed and unknown inputs', () => {
    const priorityInputs: PriorityInput[] = [
      makePriorityInput('numberOfRooms', 'critical'),
      makePriorityInput('averageDailyRate', 'critical'),
      makePriorityInput('occupancyRate', 'high'),
      makePriorityInput('checkInTime', 'medium'),
    ];

    const confidenceMap: ConfidenceMap = {
      numberOfRooms: { status: 'confirmed', benchmarkValue: 50 },
      averageDailyRate: { status: 'unknown', benchmarkValue: 150 },
      // occupancyRate and checkInTime not in map — defaults to 'benchmark'
    };

    const result = computeConfidenceScore(confidenceMap, priorityInputs);

    expect(result.percentage).toBeGreaterThanOrEqual(0);
    expect(result.percentage).toBeLessThanOrEqual(100);
    expect(['directional', 'indicative', 'validated', 'high-confidence']).toContain(result.level);
    expect(result.unvalidatedFields.length).toBeGreaterThan(0);
    // The confirmed field should NOT be in unvalidatedFields
    expect(result.unvalidatedFields.map((f) => f.key)).not.toContain('numberOfRooms');
    // The unknown and benchmark fields should appear
    expect(result.unvalidatedFields.map((f) => f.key)).toContain('averageDailyRate');
  });

  it('produces high-confidence level when all inputs are confirmed', () => {
    const priorityInputs: PriorityInput[] = [
      makePriorityInput('numberOfRooms', 'critical'),
      makePriorityInput('averageDailyRate', 'critical'),
      makePriorityInput('occupancyRate', 'high'),
    ];

    const confidenceMap: ConfidenceMap = {
      numberOfRooms: { status: 'confirmed', benchmarkValue: 50 },
      averageDailyRate: { status: 'confirmed', benchmarkValue: 150 },
      occupancyRate: { status: 'confirmed', benchmarkValue: 70 },
    };

    const result = computeConfidenceScore(confidenceMap, priorityInputs);

    expect(result.level).toBe('high-confidence');
    expect(result.percentage).toBe(100);
    expect(result.unvalidatedFields).toHaveLength(0);
    expect(result.confirmedCount).toBe(3);
  });

  it('statusCounts breakdown reflects the passed-in confidence statuses', () => {
    const priorityInputs: PriorityInput[] = [
      makePriorityInput('field1', 'critical'),
      makePriorityInput('field2', 'high'),
      makePriorityInput('field3', 'medium'),
      makePriorityInput('field4', 'medium'),
    ];

    const confidenceMap: ConfidenceMap = {
      field1: { status: 'confirmed', benchmarkValue: 10 },
      field2: { status: 'adjusted', benchmarkValue: 20 },
      field3: { status: 'benchmark', benchmarkValue: 30 },
      field4: { status: 'unknown', benchmarkValue: 40 },
    };

    const result = computeConfidenceScore(confidenceMap, priorityInputs);

    expect(result.confirmedCount).toBe(1);
    expect(result.adjustedCount).toBe(1);
    expect(result.benchmarkCount).toBe(1);
    expect(result.unknownCount).toBe(1);
    expect(result.totalTracked).toBe(4);
  });
});
