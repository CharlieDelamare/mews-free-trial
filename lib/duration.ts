/**
 * Trial duration utilities for environment creation
 */

export type TrialDuration = 7 | 30 | 60;

/**
 * Available trial duration options for the UI
 */
export const DURATION_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days (recommended)' },
  { value: 60, label: '60 days' },
] as const;

/**
 * Converts a duration in days to ISO 8601 duration format
 * @param days - Number of days (7, 30, or 60)
 * @returns ISO 8601 duration string (e.g., "P0Y0M30DT0H0M0S" for 30 days)
 */
export function convertDaysToISO8601(days: number): string {
  return `P0Y0M${days}DT0H0M0S`;
}

/**
 * Validates if a duration value is allowed
 * @param days - Number to validate
 * @returns true if the duration is 7, 30, or 60 days
 */
export function isValidDuration(days: number): days is TrialDuration {
  return days === 7 || days === 30 || days === 60;
}
