import { describe, it, expect } from 'vitest';
import {
  generateDynamicCustomer,
  generateDynamicCustomers,
  pickWeightedNationality,
  pickClassifications,
  type SampleCustomer,
} from './customer-generator';
import {
  firstNamesByNationality,
  lastNamesByNationality,
  emailDomains,
  phonePrefixesByNationality,
  nationalityWeights,
  classificationConfigs,
  personalNoteTemplates,
  businessNoteTemplates,
} from './customer-data-pools';

// All valid note templates (combined)
const allNoteTemplates = [...personalNoteTemplates, ...businessNoteTemplates];

// All valid classification names
const validClassifications = classificationConfigs.map(c => c.name);

// All nationality codes that have data pools
const nationalityCodes = nationalityWeights.map(n => n.code);

describe('customer-generator', () => {
  describe('generateDynamicCustomer', () => {
    it('returns an object with all required fields', () => {
      const customer = generateDynamicCustomer(0);

      expect(customer.FirstName).toBeDefined();
      expect(typeof customer.FirstName).toBe('string');
      expect(customer.FirstName.length).toBeGreaterThan(0);

      expect(customer.LastName).toBeDefined();
      expect(typeof customer.LastName).toBe('string');
      expect(customer.LastName.length).toBeGreaterThan(0);

      expect(customer.Email).toBeDefined();
      expect(typeof customer.Email).toBe('string');
      expect(customer.Email).toContain('@');
    });

    it('populates optional fields correctly', () => {
      // Generate many customers to ensure we see populated optional fields
      const customers = generateDynamicCustomers(100);

      // Every customer should have Phone, BirthDate, Sex, Title, NationalityCode, PreferredLanguageCode
      for (const c of customers) {
        expect(c.Phone).toBeDefined();
        expect(c.BirthDate).toBeDefined();
        expect(c.Sex).toBeDefined();
        expect(c.Title).toBeDefined();
        expect(c.NationalityCode).toBeDefined();
        expect(c.PreferredLanguageCode).toBeDefined();
      }
    });

    it('generates valid Sex values', () => {
      const customers = generateDynamicCustomers(200);
      const sexValues = Array.from(new Set(customers.map(c => c.Sex)));
      expect(sexValues.length).toBeLessThanOrEqual(2);
      for (const val of sexValues) {
        expect(['Male', 'Female']).toContain(val);
      }
    });

    it('generates valid Title values consistent with Sex', () => {
      const customers = generateDynamicCustomers(200);
      for (const c of customers) {
        if (c.Sex === 'Male') {
          expect(c.Title).toBe('Mister');
        } else {
          expect(['Miss', 'Misses']).toContain(c.Title);
        }
      }
    });

    it('generates valid ISO 8601 birth dates in a reasonable range', () => {
      const customers = generateDynamicCustomers(100);
      for (const c of customers) {
        // Matches YYYY-MM-DD
        expect(c.BirthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

        const year = parseInt(c.BirthDate!.split('-')[0]);
        expect(year).toBeGreaterThanOrEqual(1961);
        expect(year).toBeLessThanOrEqual(2004);
      }
    });

    it('generates emails with +index suffix for uniqueness', () => {
      const c0 = generateDynamicCustomer(0);
      const c42 = generateDynamicCustomer(42);

      expect(c0.Email).toContain('+0@');
      expect(c42.Email).toContain('+42@');
    });

    it('generates emails with known domains', () => {
      const customers = generateDynamicCustomers(100);
      for (const c of customers) {
        const domain = c.Email.split('@')[1];
        expect(emailDomains).toContain(domain);
      }
    });

    it('generates emails that are ASCII-safe (no diacritics)', () => {
      const customers = generateDynamicCustomers(500);
      for (const c of customers) {
        const localPart = c.Email.split('@')[0];
        // Should only contain a-z, 0-9, dots, plus
        expect(localPart).toMatch(/^[a-z0-9.+]+$/);
      }
    });

    it('generates classifications from valid set', () => {
      const customers = generateDynamicCustomers(500);
      for (const c of customers) {
        if (c.Classifications) {
          for (const cls of c.Classifications) {
            expect(validClassifications).toContain(cls);
          }
          // Max 3 classifications
          expect(c.Classifications.length).toBeLessThanOrEqual(3);
        }
      }
    });

    it('generates notes from template pools when present', () => {
      const customers = generateDynamicCustomers(500);
      for (const c of customers) {
        if (c.Notes) {
          expect(allNoteTemplates).toContain(c.Notes);
        }
      }
    });

    it('generates nationality codes from the configured set', () => {
      const customers = generateDynamicCustomers(200);
      for (const c of customers) {
        expect(nationalityCodes).toContain(c.NationalityCode);
      }
    });

    it('uses nationality-coherent first names', () => {
      const customers = generateDynamicCustomers(500);
      for (const c of customers) {
        const natCode = c.NationalityCode!;
        const namePool = firstNamesByNationality[natCode] || firstNamesByNationality.default;
        const allNames = [...namePool.male, ...namePool.female];
        expect(allNames).toContain(c.FirstName);
      }
    });

    it('uses nationality-coherent last names', () => {
      const customers = generateDynamicCustomers(500);
      for (const c of customers) {
        const natCode = c.NationalityCode!;
        const lastNamePool = lastNamesByNationality[natCode] || lastNamesByNationality.default;
        expect(lastNamePool).toContain(c.LastName);
      }
    });
  });

  describe('generateDynamicCustomers', () => {
    it('returns the requested number of customers', () => {
      expect(generateDynamicCustomers(10)).toHaveLength(10);
      expect(generateDynamicCustomers(100)).toHaveLength(100);
      expect(generateDynamicCustomers(300)).toHaveLength(300);
    });

    it('generates unique emails across a batch', () => {
      const customers = generateDynamicCustomers(500);
      const emails = customers.map(c => c.Email);
      const uniqueEmails = new Set(emails);
      expect(uniqueEmails.size).toBe(500);
    });

    it('generates diverse customers (not all the same)', () => {
      const customers = generateDynamicCustomers(50);
      const firstNames = new Set(customers.map(c => c.FirstName));
      const lastNames = new Set(customers.map(c => c.LastName));
      const nationalities = new Set(customers.map(c => c.NationalityCode));

      // With 50 customers we should see diversity
      expect(firstNames.size).toBeGreaterThan(5);
      expect(lastNames.size).toBeGreaterThan(5);
      expect(nationalities.size).toBeGreaterThan(3);
    });

    it('produces different customers on successive calls', () => {
      const batch1 = generateDynamicCustomers(10);
      const batch2 = generateDynamicCustomers(10);

      // The two batches should not be identical
      // (vanishingly small probability of being the same with random generation)
      const emails1 = batch1.map(c => c.Email).sort();
      const emails2 = batch2.map(c => c.Email).sort();
      const allSame = emails1.every((e, i) => e === emails2[i]);
      expect(allSame).toBe(false);
    });
  });

  describe('pickWeightedNationality', () => {
    it('returns a valid nationality config', () => {
      for (let i = 0; i < 100; i++) {
        const nat = pickWeightedNationality();
        expect(nat.code).toBeDefined();
        expect(nat.languageCode).toBeDefined();
        expect(nat.weight).toBeGreaterThan(0);
        expect(nationalityCodes).toContain(nat.code);
      }
    });

    it('favors higher-weight nationalities (statistical)', () => {
      const counts: Record<string, number> = {};
      const N = 10000;
      for (let i = 0; i < N; i++) {
        const nat = pickWeightedNationality();
        counts[nat.code] = (counts[nat.code] || 0) + 1;
      }

      // GB has weight 15, JP has weight 1 — GB should appear much more often
      expect(counts['GB'] || 0).toBeGreaterThan(counts['JP'] || 0);
      // GB should be roughly 15% of total (with tolerance)
      const gbPct = (counts['GB'] || 0) / N;
      expect(gbPct).toBeGreaterThan(0.08); // at least 8%
      expect(gbPct).toBeLessThan(0.25);    // at most 25%
    });
  });

  describe('pickClassifications', () => {
    it('returns an array of strings', () => {
      for (let i = 0; i < 100; i++) {
        const cls = pickClassifications(false);
        expect(Array.isArray(cls)).toBe(true);
        for (const c of cls) {
          expect(typeof c).toBe('string');
        }
      }
    });

    it('returns at most 3 classifications', () => {
      for (let i = 0; i < 500; i++) {
        const cls = pickClassifications(Math.random() < 0.5);
        expect(cls.length).toBeLessThanOrEqual(3);
      }
    });

    it('only returns valid classification names', () => {
      for (let i = 0; i < 500; i++) {
        const cls = pickClassifications(Math.random() < 0.5);
        for (const c of cls) {
          expect(validClassifications).toContain(c);
        }
      }
    });

    it('does not return personal-only classifications for business travelers', () => {
      const personalOnly = classificationConfigs
        .filter(c => c.personal && !c.business)
        .map(c => c.name);

      for (let i = 0; i < 500; i++) {
        const cls = pickClassifications(true); // isBusiness = true
        for (const c of cls) {
          expect(personalOnly).not.toContain(c);
        }
      }
    });
  });

  describe('data pool integrity', () => {
    it('every nationality in weights has first names', () => {
      for (const nat of nationalityWeights) {
        const pool = firstNamesByNationality[nat.code];
        expect(pool).toBeDefined();
        expect(pool.male.length).toBeGreaterThan(0);
        expect(pool.female.length).toBeGreaterThan(0);
      }
    });

    it('every nationality in weights has last names', () => {
      for (const nat of nationalityWeights) {
        const pool = lastNamesByNationality[nat.code];
        expect(pool).toBeDefined();
        expect(pool.length).toBeGreaterThan(0);
      }
    });

    it('every nationality in weights has phone prefixes', () => {
      for (const nat of nationalityWeights) {
        const pool = phonePrefixesByNationality[nat.code];
        expect(pool).toBeDefined();
        expect(pool.length).toBeGreaterThan(0);
      }
    });
  });
});
