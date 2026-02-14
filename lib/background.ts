import { waitUntil } from '@vercel/functions';

/**
 * Runs a promise in the background using Vercel's waitUntil().
 * This keeps the serverless function alive after the response is sent,
 * up to the function's maxDuration limit.
 */
export function runInBackground(promise: Promise<unknown>): void {
  waitUntil(promise);
}
