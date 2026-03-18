import { describe, it, expect } from 'vitest';
import { getPriorityInputs } from '@/lib/roi-calculator/utils/priorityInputs';
import type { EnabledModules } from '@/lib/roi-calculator/types/calculator';

const ALL: EnabledModules = { guestExperience: true, payment: true, rms: true };

describe('getPriorityInputs', () => {
  it('returns all inputs when enabledModules is not provided (backward-compat)', () => {
    const inputs = getPriorityInputs('£', 'United Kingdom', 'City Hotel');
    const groups = new Set(inputs.map((i) => i.group));
    expect(groups).toContain('property');
    expect(groups).toContain('operations');
    expect(groups).toContain('revenue');
    expect(groups).toContain('payments');
    expect(groups).toContain('rms');
  });

  it('returns all inputs when all modules enabled', () => {
    const inputs = getPriorityInputs('£', 'United Kingdom', 'City Hotel', ALL);
    const groups = new Set(inputs.map((i) => i.group));
    expect(groups).toContain('property');
    expect(groups).toContain('operations');
    expect(groups).toContain('revenue');
    expect(groups).toContain('payments');
    expect(groups).toContain('rms');
  });

  it('excludes operations and revenue groups when guestExperience is disabled', () => {
    const inputs = getPriorityInputs('£', 'United Kingdom', 'City Hotel', {
      ...ALL,
      guestExperience: false,
    });
    const groups = inputs.map((i) => i.group);
    expect(groups).not.toContain('operations');
    expect(groups).not.toContain('revenue');
    expect(groups).toContain('property');
    expect(groups).toContain('payments');
    expect(groups).toContain('rms');
  });

  it('excludes payments group when payment is disabled', () => {
    const inputs = getPriorityInputs('£', 'United Kingdom', 'City Hotel', {
      ...ALL,
      payment: false,
    });
    const groups = inputs.map((i) => i.group);
    expect(groups).not.toContain('payments');
    expect(groups).toContain('property');
    expect(groups).toContain('operations');
    expect(groups).toContain('rms');
  });

  it('excludes rms group when rms is disabled', () => {
    const inputs = getPriorityInputs('£', 'United Kingdom', 'City Hotel', {
      ...ALL,
      rms: false,
    });
    const groups = inputs.map((i) => i.group);
    expect(groups).not.toContain('rms');
    expect(groups).toContain('property');
    expect(groups).toContain('operations');
    expect(groups).toContain('payments');
  });

  it('returns only property group when all modules disabled', () => {
    const inputs = getPriorityInputs('£', 'United Kingdom', 'City Hotel', {
      guestExperience: false,
      payment: false,
      rms: false,
    });
    const groups = new Set(inputs.map((i) => i.group));
    expect(groups).toEqual(new Set(['property']));
  });
});
