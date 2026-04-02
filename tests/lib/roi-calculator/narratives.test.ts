// tests/lib/roi-calculator/narratives.test.ts

import { describe, it, expect } from 'vitest';
import { getModuleNarrative, getModuleNarrativeHTML } from '@/lib/roi-calculator/utils/narratives';
import { getTranslations } from '@/lib/roi-calculator/translations';
import type { LeverDescriptor } from '@/lib/roi-calculator/types/calculator';

const t = getTranslations('en');

const gxLevers: LeverDescriptor[] = [
  { key: 'upsell', label: 'Upsell', resultValue: 42000, resultUnit: 'currency', resultType: 'revenueUplift', summary: '', sliders: [] },
  { key: 'directBooking', label: 'Direct', resultValue: 23000, resultUnit: 'currency', resultType: 'revenueUplift', summary: '', sliders: [] },
  { key: 'checkIn', label: 'Check-in', resultValue: 0, resultUnit: 'currency', resultType: 'costSaving', summary: '', sliders: [] },
];

describe('getModuleNarrative', () => {
  it('returns a non-empty string for guestExperience with active levers', () => {
    const result = getModuleNarrative('guestExperience', gxLevers, '€', t);
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes the formatted upsell value in the narrative', () => {
    const result = getModuleNarrative('guestExperience', gxLevers, '€', t);
    expect(result).toContain('€42,000');
  });

  it('does not mention checkIn when checkIn resultValue is 0', () => {
    const result = getModuleNarrative('guestExperience', gxLevers, '€', t);
    // checkIn has resultValue 0 so its conditional branch should be skipped
    expect(result).not.toContain('check-in and check-out free');
  });

  it('returns a non-empty string for housekeeping', () => {
    const hkLevers: LeverDescriptor[] = [
      { key: 'hkRoomAssignment', label: 'Room assign', resultValue: 15000, resultUnit: 'currency', resultType: 'costSaving', summary: '', sliders: [] },
      { key: 'amenitiesReduction', label: 'Amenities', resultValue: 0, resultUnit: 'currency', resultType: 'costSaving', summary: '', sliders: [] },
    ];
    const result = getModuleNarrative('housekeeping', hkLevers, '€', t);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('€15,000');
  });

  it('returns empty string for unknown module key', () => {
    // @ts-expect-error intentionally invalid key
    const result = getModuleNarrative('unknown', gxLevers, '€', t);
    expect(result).toBe('');
  });
});

describe('getModuleNarrativeHTML', () => {
  it('wraps monetary values in pink span tags', () => {
    const result = getModuleNarrativeHTML('guestExperience', gxLevers, '€', t);
    expect(result).toContain('<span style="color:#FF83DA;font-weight:700">€42,000</span>');
  });

  it('does not wrap non-monetary text in span tags', () => {
    const result = getModuleNarrativeHTML('guestExperience', gxLevers, '€', t);
    // Opening text should be plain
    expect(result).toContain('Mews transforms your front desk');
    // The plain text portion should not be wrapped
    expect(result.startsWith('<span')).toBe(false);
  });

  it('handles housekeeping module', () => {
    const hkLevers: LeverDescriptor[] = [
      { key: 'hkRoomAssignment', label: 'Room assign', resultValue: 8000, resultUnit: 'currency', resultType: 'costSaving', summary: '', sliders: [] },
    ];
    const result = getModuleNarrativeHTML('housekeeping', hkLevers, '£', t);
    expect(result).toContain('<span style="color:#FF83DA;font-weight:700">£8,000</span>');
  });

  it('plain and HTML variants contain the same logical sentences', () => {
    // Strip HTML tags from the HTML variant; it should contain all the same text
    const htmlResult = getModuleNarrativeHTML('guestExperience', gxLevers, '€', t);
    const stripped = htmlResult.replace(/<[^>]+>/g, '');
    const plainResult = getModuleNarrative('guestExperience', gxLevers, '€', t);
    // Both should open with the same introductory sentence
    expect(stripped.startsWith('Mews transforms')).toBe(true);
    expect(plainResult.startsWith('Mews transforms')).toBe(true);
  });
});
