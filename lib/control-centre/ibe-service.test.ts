import { describe, test, expect, vi } from 'vitest';
import { getIbeThemeConfig, applyMarkup, IBE_THEME_CONFIG } from './ibe-service';

// Mock Prisma and external dependencies — only pure functions are tested here
vi.mock('@/lib/prisma', () => ({
  prisma: {
    ibeSession: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/mews-data-service', () => ({
  fetchMewsData: vi.fn(),
}));

describe('getIbeThemeConfig', () => {
  test('luxury theme returns config with markup 0.25', () => {
    const config = getIbeThemeConfig('luxury');
    expect(config.markup).toBe(0.25);
  });

  test('budget theme returns config with markup 0.05', () => {
    const config = getIbeThemeConfig('budget');
    expect(config.markup).toBe(0.05);
  });

  test('city theme returns config with markup 0.10', () => {
    const config = getIbeThemeConfig('city');
    expect(config.markup).toBe(0.10);
  });

  test('resort theme returns config with markup 0.20', () => {
    const config = getIbeThemeConfig('resort');
    expect(config.markup).toBe(0.20);
  });

  test('conference theme returns config with markup 0.15', () => {
    const config = getIbeThemeConfig('conference');
    expect(config.markup).toBe(0.15);
  });

  test('returns config with displayName and description', () => {
    const config = getIbeThemeConfig('luxury');
    expect(config.displayName).toBeTruthy();
    expect(config.description).toBeTruthy();
    expect(typeof config.primaryColor).toBe('string');
  });

  test('returns same object as IBE_THEME_CONFIG lookup', () => {
    expect(getIbeThemeConfig('resort')).toBe(IBE_THEME_CONFIG['resort']);
  });
});

describe('applyMarkup', () => {
  test('applyMarkup(100, luxury) returns 125', () => {
    expect(applyMarkup(100, 'luxury')).toBe(125);
  });

  test('applyMarkup(100, budget) returns 105', () => {
    expect(applyMarkup(100, 'budget')).toBe(105);
  });

  test('applyMarkup(100, city) returns 110', () => {
    expect(applyMarkup(100, 'city')).toBe(110);
  });

  test('applyMarkup(100, resort) returns 120', () => {
    expect(applyMarkup(100, 'resort')).toBe(120);
  });

  test('applyMarkup(100, conference) returns 115', () => {
    expect(applyMarkup(100, 'conference')).toBe(115);
  });

  test('applyMarkup(99.99, city) returns correctly rounded value', () => {
    // 99.99 * 1.10 = 109.989 → rounded to 109.99
    const result = applyMarkup(99.99, 'city');
    expect(result).toBe(109.99);
  });

  test('applyMarkup(0, luxury) returns 0', () => {
    expect(applyMarkup(0, 'luxury')).toBe(0);
  });

  test('result is rounded to at most 2 decimal places', () => {
    const result = applyMarkup(33.33, 'luxury');
    const decimalPart = result.toString().split('.')[1] ?? '';
    expect(decimalPart.length).toBeLessThanOrEqual(2);
  });
});
