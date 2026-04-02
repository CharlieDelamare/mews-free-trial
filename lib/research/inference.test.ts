import { describe, test, expect } from 'vitest';
import { inferSpaceType, inferBoardType, inferProductCategory } from './inference';

describe('inferSpaceType', () => {
  test('returns Suite for suite names', () => {
    expect(inferSpaceType('Thames Suite')).toBe('Suite');
    expect(inferSpaceType('Penthouse View')).toBe('Suite');
  });

  test('returns Apartment for apartment names', () => {
    expect(inferSpaceType('Studio Apartment')).toBe('Apartment');
    expect(inferSpaceType('River Residence')).toBe('Apartment');
  });

  test('returns Dorm for dorm names', () => {
    expect(inferSpaceType('Mixed Dorm')).toBe('Dorm');
    expect(inferSpaceType('Bunk Room')).toBe('Dorm');
    expect(inferSpaceType('Sleep Pod')).toBe('Dorm');
  });

  test('returns Room for standard room names', () => {
    expect(inferSpaceType('Deluxe Room')).toBe('Room');
    expect(inferSpaceType('Superior King')).toBe('Room');
    expect(inferSpaceType('Classic Double')).toBe('Room');
  });

  test('is case-insensitive', () => {
    expect(inferSpaceType('PRESIDENTIAL SUITE')).toBe('Suite');
    expect(inferSpaceType('studio apartment')).toBe('Apartment');
  });
});

describe('inferBoardType', () => {
  test('returns BB for bed and breakfast', () => {
    expect(inferBoardType('Bed and Breakfast Rate')).toBe('BB');
    expect(inferBoardType('B&B Package')).toBe('BB');
  });

  test('returns RO for room only', () => {
    expect(inferBoardType('Room Only')).toBe('RO');
    expect(inferBoardType('No Meals Included')).toBe('RO');
    expect(inferBoardType('Best Available Rate RO')).toBe('RO');
  });

  test('returns HB for half board', () => {
    expect(inferBoardType('Half Board')).toBe('HB');
  });

  test('returns FB for full board', () => {
    expect(inferBoardType('Full Board Package')).toBe('FB');
  });

  test('returns AI for all inclusive', () => {
    expect(inferBoardType('All Inclusive')).toBe('AI');
    expect(inferBoardType('All-In Rate')).toBe('AI');
  });

  test('returns null when no match', () => {
    expect(inferBoardType('Standard Rate')).toBeNull();
    expect(inferBoardType('Flexible')).toBeNull();
  });

  test('is case-insensitive', () => {
    expect(inferBoardType('BED AND BREAKFAST')).toBe('BB');
    expect(inferBoardType('all inclusive')).toBe('AI');
  });
});

describe('inferProductCategory', () => {
  test('returns Food & Beverage for food items', () => {
    expect(inferProductCategory('Breakfast')).toBe('Food & Beverage');
    expect(inferProductCategory('Dinner Package')).toBe('Food & Beverage');
    expect(inferProductCategory('Restaurant Voucher')).toBe('Food & Beverage');
    expect(inferProductCategory('Mini Bar')).toBe('Food & Beverage');
  });

  test('returns Transport for transport items', () => {
    expect(inferProductCategory('Airport Transfer')).toBe('Transport');
    expect(inferProductCategory('Shuttle Service')).toBe('Transport');
    expect(inferProductCategory('Taxi')).toBe('Transport');
  });

  test('returns Wellness for spa and gym items', () => {
    expect(inferProductCategory('Spa Treatment')).toBe('Wellness');
    expect(inferProductCategory('Gym Access')).toBe('Wellness');
    expect(inferProductCategory('Massage')).toBe('Wellness');
  });

  test('returns Parking for parking items', () => {
    expect(inferProductCategory('Parking')).toBe('Parking');
    expect(inferProductCategory('Valet Parking')).toBe('Parking');
  });

  test('returns Other when no match', () => {
    expect(inferProductCategory('Newspaper')).toBe('Other');
    expect(inferProductCategory('Turndown Service')).toBe('Other');
  });
});
