import { describe, test, expect } from 'vitest';
import { isValidEmail, isValidString, isValidSalesforceId, sanitizeString } from './validation';

describe('isValidEmail', () => {
  test('accepts standard email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('first.last@company.co.uk')).toBe(true);
    expect(isValidEmail('user+tag@domain.org')).toBe(true);
    expect(isValidEmail('name@sub.domain.com')).toBe(true);
  });

  test('rejects empty and non-string inputs', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail(null as any)).toBe(false);
    expect(isValidEmail(undefined as any)).toBe(false);
    expect(isValidEmail(123 as any)).toBe(false);
  });

  test('rejects emails without @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
    expect(isValidEmail('plaintext')).toBe(false);
  });

  test('rejects emails with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
    expect(isValidEmail('user@ example.com')).toBe(false);
    expect(isValidEmail(' user@example.com')).toBe(false);
  });

  test('rejects emails without domain part', () => {
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('user@.com')).toBe(false);
  });

  test('rejects emails exceeding 254 characters', () => {
    const longLocal = 'a'.repeat(243); // 243 + @ + 10 chars = 254 -> OK
    expect(isValidEmail(`${longLocal}@domain.com`)).toBe(true);

    const tooLongLocal = 'a'.repeat(244); // 244 + @ + 10 chars = 255 -> too long
    expect(isValidEmail(`${tooLongLocal}@domain.com`)).toBe(false);
  });
});

describe('isValidString', () => {
  test('accepts normal strings', () => {
    expect(isValidString('Hello')).toBe(true);
    expect(isValidString('Test Hotel & Spa')).toBe(true);
    expect(isValidString('Ünïcödé text')).toBe(true);
  });

  test('rejects non-string values', () => {
    expect(isValidString(null)).toBe(false);
    expect(isValidString(undefined)).toBe(false);
    expect(isValidString(123)).toBe(false);
    expect(isValidString({})).toBe(false);
    expect(isValidString([])).toBe(false);
  });

  test('rejects empty and whitespace-only strings', () => {
    expect(isValidString('')).toBe(false);
    expect(isValidString('   ')).toBe(false);
    expect(isValidString('\t')).toBe(false);
  });

  test('rejects strings exceeding max length', () => {
    expect(isValidString('a'.repeat(500))).toBe(true);
    expect(isValidString('a'.repeat(501))).toBe(false);
  });

  test('respects custom max length', () => {
    expect(isValidString('hello', 5)).toBe(true);
    expect(isValidString('hello!', 5)).toBe(false);
  });

  test('rejects strings with control characters', () => {
    expect(isValidString('hello\x00world')).toBe(false); // null byte
    expect(isValidString('hello\x01world')).toBe(false); // SOH
    expect(isValidString('hello\x7Fworld')).toBe(false); // DEL
    expect(isValidString('hello\x0Bworld')).toBe(false); // vertical tab
  });

  test('allows newlines and tabs (not control chars in this context)', () => {
    expect(isValidString('hello\nworld')).toBe(true); // newline allowed
    expect(isValidString('hello\tworld')).toBe(true); // tab allowed
  });
});

describe('isValidSalesforceId', () => {
  test('accepts valid 15-char Salesforce IDs', () => {
    expect(isValidSalesforceId('001000000000abc')).toBe(true);
    expect(isValidSalesforceId('001ABCDEFGHIJKL')).toBe(true);
  });

  test('accepts valid 18-char Salesforce IDs', () => {
    expect(isValidSalesforceId('001000000000abcDEF')).toBe(true);
    expect(isValidSalesforceId('001ABCDEFGHIJKLMNO')).toBe(true);
  });

  test('rejects IDs without 001 prefix', () => {
    expect(isValidSalesforceId('002000000000abc')).toBe(false);
    expect(isValidSalesforceId('ABC000000000abc')).toBe(false);
    expect(isValidSalesforceId('100000000000abc')).toBe(false);
  });

  test('rejects IDs with wrong length', () => {
    expect(isValidSalesforceId('001abc')).toBe(false); // too short
    expect(isValidSalesforceId('001' + 'a'.repeat(16))).toBe(false); // 19 chars, too long
  });

  test('rejects empty and non-string inputs', () => {
    expect(isValidSalesforceId('')).toBe(false);
    expect(isValidSalesforceId(null as any)).toBe(false);
    expect(isValidSalesforceId(undefined as any)).toBe(false);
  });

  test('trims whitespace before validation', () => {
    expect(isValidSalesforceId('  001000000000abc  ')).toBe(true);
  });

  test('rejects IDs with special characters', () => {
    expect(isValidSalesforceId('001000000000ab!')).toBe(false);
    expect(isValidSalesforceId('001000000000ab@')).toBe(false);
  });
});

describe('sanitizeString', () => {
  test('trims leading and trailing whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
    expect(sanitizeString('\thello\n')).toBe('hello');
  });

  test('returns empty string when input is only whitespace', () => {
    expect(sanitizeString('   ')).toBe('');
  });

  test('returns unchanged string when no whitespace to trim', () => {
    expect(sanitizeString('hello')).toBe('hello');
  });
});
