import { describe, test, expect } from 'vitest';
import { parseCsvText, validateCsvRow, chunkArray } from './csv-parser';

describe('parseCsvText', () => {
  const VALID_HEADER = 'GuestFirstName;GuestLastName;CheckIn;CheckOut;GuestCount';

  test('valid CSV returns correct row count', () => {
    const csv = [
      VALID_HEADER,
      'Alice;Smith;2026-06-01;2026-06-05;2',
      'Bob;Jones;2026-07-10;2026-07-12;1',
    ].join('\n');

    const result = parseCsvText(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].GuestFirstName).toBe('Alice');
    expect(result.rows[1].GuestFirstName).toBe('Bob');
  });

  test('missing required column returns error', () => {
    // Missing GuestCount column
    const csv = [
      'GuestFirstName;GuestLastName;CheckIn;CheckOut',
      'Alice;Smith;2026-06-01;2026-06-05',
    ].join('\n');

    const result = parseCsvText(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors.some(e => e.includes('GuestCount'))).toBe(true);
  });

  test('malformed row is flagged, valid rows still parsed', () => {
    const csv = [
      VALID_HEADER,
      'Alice;Smith;2026-06-01;2026-06-05;2',
      'Bob;Jones;not-a-date;2026-07-12;1', // bad CheckIn
      'Carol;Brown;2026-08-01;2026-08-03;1',
    ].join('\n');

    const result = parseCsvText(csv);
    // Two valid rows, one invalid
    expect(result.rows).toHaveLength(2);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.rows[0].GuestFirstName).toBe('Alice');
    expect(result.rows[1].GuestFirstName).toBe('Carol');
  });

  test('optional PricePerNight can be omitted', () => {
    const csv = [
      VALID_HEADER,
      'Alice;Smith;2026-06-01;2026-06-05;2',
    ].join('\n');

    const result = parseCsvText(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].PricePerNight).toBeUndefined();
  });

  test('optional PricePerNight is parsed when present', () => {
    const csv = [
      `${VALID_HEADER};PricePerNight`,
      'Alice;Smith;2026-06-01;2026-06-05;2;150.50',
    ].join('\n');

    const result = parseCsvText(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].PricePerNight).toBe(150.5);
  });

  test('RoomCategory and RateName columns are silently ignored', () => {
    const csv = [
      `${VALID_HEADER};RoomCategory;RateName`,
      'Alice;Smith;2026-06-01;2026-06-05;2;Superior;BAR',
    ].join('\n');

    const result = parseCsvText(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(1);
    // These fields should not appear on the parsed row type
    expect((result.rows[0] as Record<string, unknown>).RoomCategory).toBeUndefined();
    expect((result.rows[0] as Record<string, unknown>).RateName).toBeUndefined();
  });

  test('empty lines are skipped', () => {
    const csv = [
      VALID_HEADER,
      'Alice;Smith;2026-06-01;2026-06-05;2',
      '',
      '   ',
      'Bob;Jones;2026-07-10;2026-07-12;1',
    ].join('\n');

    const result = parseCsvText(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(2);
  });

  test('returns error when CSV has only a header and no data rows', () => {
    const result = parseCsvText(VALID_HEADER);
    expect(result.rows).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('validateCsvRow', () => {
  const validRow = {
    GuestFirstName: 'Alice',
    GuestLastName: 'Smith',
    CheckIn: '2026-06-01',
    CheckOut: '2026-06-05',
    GuestCount: '2',
  };

  test('valid row returns no errors', () => {
    const errors = validateCsvRow(validRow, 2);
    expect(errors).toHaveLength(0);
  });

  test('invalid date format returns error', () => {
    const errors = validateCsvRow({ ...validRow, CheckIn: '01-06-2026' }, 2);
    expect(errors.some(e => e.includes('CheckIn'))).toBe(true);
    expect(errors.some(e => e.includes('YYYY-MM-DD'))).toBe(true);
  });

  test('partial date string returns error', () => {
    const errors = validateCsvRow({ ...validRow, CheckOut: '2026-06' }, 3);
    expect(errors.some(e => e.includes('CheckOut'))).toBe(true);
  });

  test('CheckOut before CheckIn returns error', () => {
    const errors = validateCsvRow(
      { ...validRow, CheckIn: '2026-06-10', CheckOut: '2026-06-05' },
      4
    );
    expect(errors.some(e => e.toLowerCase().includes('checkout') || e.includes('CheckOut'))).toBe(true);
  });

  test('CheckOut equal to CheckIn returns error', () => {
    const errors = validateCsvRow(
      { ...validRow, CheckIn: '2026-06-05', CheckOut: '2026-06-05' },
      5
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  test('invalid GuestCount (zero) returns error', () => {
    const errors = validateCsvRow({ ...validRow, GuestCount: '0' }, 6);
    expect(errors.some(e => e.includes('GuestCount'))).toBe(true);
  });

  test('invalid GuestCount (non-numeric) returns error', () => {
    const errors = validateCsvRow({ ...validRow, GuestCount: 'abc' }, 7);
    expect(errors.some(e => e.includes('GuestCount'))).toBe(true);
  });

  test('negative GuestCount returns error', () => {
    const errors = validateCsvRow({ ...validRow, GuestCount: '-1' }, 8);
    expect(errors.some(e => e.includes('GuestCount'))).toBe(true);
  });

  test('missing GuestFirstName returns error', () => {
    const errors = validateCsvRow({ ...validRow, GuestFirstName: '' }, 9);
    expect(errors.some(e => e.includes('GuestFirstName'))).toBe(true);
  });

  test('error messages include the row number', () => {
    const errors = validateCsvRow({ ...validRow, GuestFirstName: '' }, 42);
    expect(errors.some(e => e.includes('42'))).toBe(true);
  });
});

describe('chunkArray', () => {
  test('splits at correct boundary: 7 items with size 3 produces 3 chunks', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7];
    const chunks = chunkArray(arr, 3);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toEqual([1, 2, 3]);
    expect(chunks[1]).toEqual([4, 5, 6]);
    expect(chunks[2]).toEqual([7]);
  });

  test('handles empty array', () => {
    const chunks = chunkArray([], 10);
    expect(chunks).toHaveLength(0);
    expect(chunks).toEqual([]);
  });

  test('chunk size exactly 166 on 500 items produces 4 chunks (3×166 + 1×2)', () => {
    const arr = Array.from({ length: 500 }, (_, i) => i);
    const chunks = chunkArray(arr, 166);
    expect(chunks).toHaveLength(4);
    expect(chunks[0]).toHaveLength(166);
    expect(chunks[1]).toHaveLength(166);
    expect(chunks[2]).toHaveLength(166);
    expect(chunks[3]).toHaveLength(2);
  });

  test('chunk size larger than array returns single chunk', () => {
    const chunks = chunkArray([1, 2, 3], 100);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual([1, 2, 3]);
  });

  test('chunk size of 1 produces one chunk per element', () => {
    const chunks = chunkArray(['a', 'b', 'c'], 1);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toEqual(['a']);
    expect(chunks[1]).toEqual(['b']);
    expect(chunks[2]).toEqual(['c']);
  });
});
