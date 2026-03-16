/**
 * CSV Parser for reservation import
 * Pure functions — no Node.js-specific imports (works in browser and server)
 * Semicolon-delimited format
 */

import type { ParsedCsvRow, CsvParseResult } from '@/types/control-centre';

const REQUIRED_COLUMNS = ['GuestFirstName', 'GuestLastName', 'CheckIn', 'CheckOut', 'GuestCount'];
// eslint-disable-next-line no-unused-vars
const OPTIONAL_COLUMNS = ['PricePerNight', 'RoomCategory', 'RateName'];

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function parseCsvText(text: string): CsvParseResult {
  const rows: ParsedCsvRow[] = [];
  const errors: string[] = [];

  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { rows: [], errors: ['CSV must have a header row and at least one data row'] };
  }

  const headers = lines[0].split(';').map(h => h.trim());

  // Check required columns
  for (const col of REQUIRED_COLUMNS) {
    if (!headers.includes(col)) {
      errors.push(`Missing required column: ${col}`);
    }
  }
  if (errors.length > 0) return { rows: [], errors };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(';').map(v => v.trim());
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      raw[h] = values[idx] ?? '';
    });

    const rowErrors = validateCsvRow(raw, i + 1);
    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      continue;
    }

    rows.push({
      GuestFirstName: raw.GuestFirstName,
      GuestLastName: raw.GuestLastName,
      CheckIn: raw.CheckIn,
      CheckOut: raw.CheckOut,
      GuestCount: parseInt(raw.GuestCount, 10),
      ...(raw.PricePerNight ? { PricePerNight: parseFloat(raw.PricePerNight) } : {}),
    });
  }

  return { rows, errors };
}

export function validateCsvRow(raw: Record<string, string>, rowNum: number): string[] {
  const errors: string[] = [];

  if (!raw.GuestFirstName?.trim()) errors.push(`Row ${rowNum}: GuestFirstName is required`);
  if (!raw.GuestLastName?.trim()) errors.push(`Row ${rowNum}: GuestLastName is required`);

  if (!raw.CheckIn || !DATE_REGEX.test(raw.CheckIn)) {
    errors.push(`Row ${rowNum}: CheckIn must be in YYYY-MM-DD format`);
  }
  if (!raw.CheckOut || !DATE_REGEX.test(raw.CheckOut)) {
    errors.push(`Row ${rowNum}: CheckOut must be in YYYY-MM-DD format`);
  }

  if (raw.CheckIn && raw.CheckOut && raw.CheckIn >= raw.CheckOut) {
    errors.push(`Row ${rowNum}: CheckOut must be after CheckIn`);
  }

  const guestCount = parseInt(raw.GuestCount, 10);
  if (isNaN(guestCount) || guestCount < 1) {
    errors.push(`Row ${rowNum}: GuestCount must be a positive integer`);
  }

  if (raw.PricePerNight) {
    const price = parseFloat(raw.PricePerNight);
    if (isNaN(price) || price < 0) {
      errors.push(`Row ${rowNum}: PricePerNight must be a non-negative number`);
    }
  }

  return errors;
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
