/**
 * Sample customer profiles for Mews trial environments
 *
 * This module dynamically generates unique customer profiles each time
 * by randomly combining first names, last names, email addresses, notes,
 * and classifications from curated data pools.
 *
 * The SampleCustomer interface and getSampleCustomers() function are
 * re-exported here for backward compatibility with existing callers.
 */

// Re-export the canonical interface from the generator
export type { SampleCustomer } from './customer-generator';

import { generateDynamicCustomers } from './customer-generator';

/**
 * Get dynamically generated sample customers.
 *
 * Each call produces a fresh set of unique customer profiles by randomly
 * picking from pools of names, nationalities, notes, and classifications.
 *
 * @param count - Number of customers to generate (default: 300)
 * @returns Array of dynamically generated customer profiles
 */
export function getSampleCustomers(count: number = 300): import('./customer-generator').SampleCustomer[] {
  return generateDynamicCustomers(count);
}
