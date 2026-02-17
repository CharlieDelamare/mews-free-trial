/**
 * Dynamic Customer Generator
 *
 * Generates unique customer profiles by randomly combining data from pools
 * of first names, last names, email domains, phone prefixes, note templates,
 * and classifications. Each call produces different customers.
 *
 * The SampleCustomer interface is defined here and re-exported by
 * lib/sample-customers.ts for backward compatibility.
 */

import {
  firstNamesByNationality,
  lastNamesByNationality,
  emailDomains,
  phonePrefixesByNationality,
  nationalityWeights,
  classificationConfigs,
  personalNoteTemplates,
  businessNoteTemplates,
  type NationalityConfig,
} from './customer-data-pools';

// ---------------------------------------------------------------------------
// SampleCustomer interface (canonical definition)
// ---------------------------------------------------------------------------

export interface SampleCustomer {
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string;
  BirthDate?: string;            // ISO 8601 format: "1990-05-15"
  Sex?: 'Male' | 'Female';
  Title?: 'Mister' | 'Miss' | 'Misses';
  NationalityCode?: string;      // ISO 3166-1 alpha-2: "GB", "US", "DE"
  PreferredLanguageCode?: string; // e.g. "en-GB", "fr-FR"
  Classifications?: string[];
  Notes?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Precompute the total weight once for weighted random selection. */
const totalWeight = nationalityWeights.reduce((sum, n) => sum + n.weight, 0);

/**
 * Pick a random element from an array.
 */
function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Pick a nationality using weighted random selection.
 */
export function pickWeightedNationality(): NationalityConfig {
  let roll = Math.random() * totalWeight;
  for (const entry of nationalityWeights) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  // Fallback (should never reach here due to floating-point, but just in case)
  return nationalityWeights[0];
}

/**
 * Strip diacritics and non-ASCII characters for email-safe strings.
 * e.g. "Müller" → "muller", "García" → "garcia"
 */
function toEmailSafe(name: string): string {
  return name
    .normalize('NFD')                   // decompose accented characters
    .replace(/[\u0300-\u036f]/g, '')    // strip combining diacritics
    .replace(/[^a-zA-Z0-9]/g, '')       // keep only alphanumeric
    .toLowerCase();
}

/**
 * Pick classifications probabilistically.
 * Each classification is independently evaluated against its probability.
 * At most 3 classifications per customer.
 */
export function pickClassifications(isBusiness: boolean): string[] {
  const selected: string[] = [];
  for (const config of classificationConfigs) {
    if (selected.length >= 3) break;
    const eligible = isBusiness ? config.business : config.personal;
    if (eligible && Math.random() < config.probability) {
      selected.push(config.name);
    }
  }
  return selected;
}

// ---------------------------------------------------------------------------
// Core generation
// ---------------------------------------------------------------------------

/**
 * Generate a single unique dynamic customer profile.
 *
 * @param index — Unique index for this customer, used in the email to guarantee
 *   uniqueness across the batch (e.g. firstname.lastname+42@gmail.com).
 */
export function generateDynamicCustomer(index: number): SampleCustomer {
  // 1. Nationality (weighted)
  const nationality = pickWeightedNationality();

  // 2. Sex (50/50)
  const sex: 'Male' | 'Female' = Math.random() < 0.5 ? 'Male' : 'Female';

  // 3. Title
  const title: 'Mister' | 'Miss' | 'Misses' =
    sex === 'Male' ? 'Mister' : (Math.random() < 0.7 ? 'Miss' : 'Misses');

  // 4. First name (nationality-coherent)
  const namePool = firstNamesByNationality[nationality.code] || firstNamesByNationality.default;
  const firstNames = sex === 'Male' ? namePool.male : namePool.female;
  const firstName = pickRandom(firstNames);

  // 5. Last name (nationality-coherent)
  const lastNamePool = lastNamesByNationality[nationality.code] || lastNamesByNationality.default;
  const lastName = pickRandom(lastNamePool);

  // 6. Personal vs business (70/30)
  const isBusiness = Math.random() < 0.30;

  // 7. Email (unique via index suffix)
  const emailName = `${toEmailSafe(firstName)}.${toEmailSafe(lastName)}`;
  const domain = pickRandom(emailDomains);
  const email = `${emailName}+${index}@${domain}`;

  // 8. Phone
  const prefixes = phonePrefixesByNationality[nationality.code] || phonePrefixesByNationality.default;
  const prefix = pickRandom(prefixes);
  const phoneDigits = String(Math.floor(Math.random() * 9000000) + 1000000);
  const phone = `${prefix} ${phoneDigits.slice(0, 3)} ${phoneDigits.slice(3)}`;

  // 9. Birth date (ages 22-65 relative to 2026)
  const currentYear = 2026;
  const birthYear = currentYear - 65 + Math.floor(Math.random() * 44); // 1961-2004
  const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;

  // 10. Classifications (probabilistic, max 3)
  const classifications = pickClassifications(isBusiness);

  // 11. Notes (50% chance)
  let notes: string | undefined;
  if (Math.random() < 0.50) {
    const notePool = isBusiness ? businessNoteTemplates : personalNoteTemplates;
    notes = pickRandom(notePool);
  }

  return {
    FirstName: firstName,
    LastName: lastName,
    Email: email,
    Phone: phone,
    BirthDate: birthDate,
    Sex: sex,
    Title: title,
    NationalityCode: nationality.code,
    PreferredLanguageCode: nationality.languageCode,
    Classifications: classifications.length > 0 ? classifications : undefined,
    Notes: notes,
  };
}

/**
 * Generate N unique dynamic customer profiles.
 *
 * Every customer is guaranteed a unique email address via the index suffix.
 * Each call produces a different set of customers.
 *
 * @param count — Number of customers to generate (default 300)
 */
export function generateDynamicCustomers(count: number = 300): SampleCustomer[] {
  const customers: SampleCustomer[] = [];
  for (let i = 0; i < count; i++) {
    customers.push(generateDynamicCustomer(i));
  }
  return customers;
}
