import { describe, test, expect } from 'vitest';
import {
  getPreferredLanguage,
  getLegalEnvironmentCode,
  getCurrency,
  getPricingEnvironment,
  preferredLanguage,
  countries,
  languageOptions,
  countryOptions,
} from './codes';

describe('getPreferredLanguage', () => {
  test('returns correct language code for Czech', () => {
    expect(getPreferredLanguage('Czech')).toBe('cs-CZ');
  });

  test('returns correct language code for English (UK)', () => {
    expect(getPreferredLanguage('English (UK)')).toBe('en-GB');
  });

  test('returns correct language code for Japanese', () => {
    expect(getPreferredLanguage('Japanese')).toBe('ja-JP');
  });

  test('returns correct language code for Portuguese (Brazilian)', () => {
    expect(getPreferredLanguage('Portuguese (Brazilian)')).toBe('pt-BR');
  });

  test('returns default "en-GB" for unknown language', () => {
    expect(getPreferredLanguage('Unknown Language')).toBe('en-GB');
  });

  test('returns default "en-GB" for empty string', () => {
    expect(getPreferredLanguage('')).toBe('en-GB');
  });

  test('handles all 23 supported languages correctly', () => {
    const expectedMappings = {
      'Czech': 'cs-CZ',
      'Danish': 'da-DK',
      'German (Swiss)': 'de-CH',
      'German': 'de-DE',
      'Greek': 'el-GR',
      'English (UK)': 'en-GB',
      'Spanish': 'es-ES',
      'Estonian': 'et-EE',
      'Finnish': 'fi-FI',
      'French (Canadian)': 'fr-CA',
      'French': 'fr-FR',
      'Italian': 'it-IT',
      'Japanese': 'ja-JP',
      'Korean': 'ko-KR',
      'Dutch': 'nl-NL',
      'Norwegian': 'nb-NO',
      'Polish': 'pl-PL',
      'Portuguese (Brazilian)': 'pt-BR',
      'Portuguese': 'pt-PT',
      'Russian': 'ru-RU',
      'Slovak': 'sk-SK',
      'Swedish': 'sv-SE',
      'English (USA)': 'en-US',
    };

    Object.entries(expectedMappings).forEach(([language, expectedCode]) => {
      expect(getPreferredLanguage(language)).toBe(expectedCode);
    });
  });
});

describe('getLegalEnvironmentCode', () => {
  test('returns correct LE code for United Kingdom', () => {
    expect(getLegalEnvironmentCode('United Kingdom')).toBe('UK-2022');
  });

  test('returns correct LE code for United States', () => {
    expect(getLegalEnvironmentCode('United States')).toBe('US-NY-NYC');
  });

  test('returns correct LE code for Czech Republic', () => {
    expect(getLegalEnvironmentCode('Czech Republic')).toBe('CZ-2025');
  });

  test('returns correct LE code for Germany', () => {
    expect(getLegalEnvironmentCode('Germany')).toBe('DE-2020-1');
  });

  test('returns correct LE code for Japan', () => {
    expect(getLegalEnvironmentCode('Japan')).toBe('JP-2019');
  });

  test('returns default "UK-2022" for unknown country', () => {
    expect(getLegalEnvironmentCode('Unknown Country')).toBe('UK-2022');
  });

  test('returns default "UK-2022" for empty string', () => {
    expect(getLegalEnvironmentCode('')).toBe('UK-2022');
  });

  test('handles all countries in the countries object', () => {
    Object.keys(countries).forEach((country) => {
      const leCode = getLegalEnvironmentCode(country);
      expect(leCode).toBe(countries[country].LE);
      expect(typeof leCode).toBe('string');
      expect(leCode.length).toBeGreaterThan(0);
    });
  });
});

describe('getCurrency', () => {
  test('returns EUR for Germany', () => {
    expect(getCurrency('Germany')).toBe('EUR');
  });

  test('returns USD for United States', () => {
    expect(getCurrency('United States')).toBe('USD');
  });

  test('returns GBP for United Kingdom', () => {
    expect(getCurrency('United Kingdom')).toBe('GBP');
  });

  test('returns JPY for Japan', () => {
    expect(getCurrency('Japan')).toBe('JPY');
  });

  test('returns CZK for Czech Republic', () => {
    expect(getCurrency('Czech Republic')).toBe('CZK');
  });

  test('returns default "GBP" for unknown country', () => {
    expect(getCurrency('Unknown Country')).toBe('GBP');
  });

  test('returns default "GBP" for empty string', () => {
    expect(getCurrency('')).toBe('GBP');
  });

  test('handles all countries in the countries object', () => {
    Object.keys(countries).forEach((country) => {
      const currency = getCurrency(country);
      expect(currency).toBe(countries[country].Currency);
      expect(typeof currency).toBe('string');
      expect(currency.length).toBeGreaterThan(0);
    });
  });
});

describe('getPricingEnvironment', () => {
  test('returns "Gross" for most countries', () => {
    expect(getPricingEnvironment('Germany')).toBe('Gross');
    expect(getPricingEnvironment('France')).toBe('Gross');
    expect(getPricingEnvironment('Spain')).toBe('Gross');
    expect(getPricingEnvironment('Italy')).toBe('Gross');
  });

  test('returns "Net" for Canada', () => {
    expect(getPricingEnvironment('Canada')).toBe('Net');
  });

  test('returns "Net" for United States', () => {
    expect(getPricingEnvironment('United States')).toBe('Net');
  });

  test('returns default "Gross" for unknown country', () => {
    expect(getPricingEnvironment('Unknown Country')).toBe('Gross');
  });

  test('returns default "Gross" for empty string', () => {
    expect(getPricingEnvironment('')).toBe('Gross');
  });

  test('handles all countries in the countries object', () => {
    Object.keys(countries).forEach((country) => {
      const environment = getPricingEnvironment(country);
      expect(environment).toBe(countries[country].Environment);
      expect(['Gross', 'Net']).toContain(environment);
    });
  });

  test('only Canada and United States have Net pricing', () => {
    const netCountries = Object.keys(countries).filter(
      (country) => countries[country].Environment === 'Net'
    );
    expect(netCountries).toEqual(['Canada', 'United States']);
  });
});

describe('Data exports', () => {
  test('preferredLanguage has 23 languages', () => {
    expect(Object.keys(preferredLanguage)).toHaveLength(23);
  });

  test('countries object has 66 countries', () => {
    expect(Object.keys(countries)).toHaveLength(66);
  });

  test('languageOptions exports all language names', () => {
    expect(languageOptions).toEqual(Object.keys(preferredLanguage));
    expect(languageOptions).toHaveLength(23);
  });

  test('countryOptions exports all country names', () => {
    expect(countryOptions).toEqual(Object.keys(countries));
    expect(countryOptions).toHaveLength(66);
  });

  test('all countries have required properties', () => {
    Object.entries(countries).forEach(([countryName, config]) => {
      expect(config).toHaveProperty('LE');
      expect(config).toHaveProperty('Currency');
      expect(config).toHaveProperty('Environment');
      expect(typeof config.LE).toBe('string');
      expect(typeof config.Currency).toBe('string');
      expect(['Gross', 'Net']).toContain(config.Environment);
    });
  });

  test('all language codes follow proper locale format', () => {
    const localeRegex = /^[a-z]{2}-[A-Z]{2}$/;
    Object.values(preferredLanguage).forEach((code) => {
      expect(code).toMatch(localeRegex);
    });
  });

  test('all currency codes are 3 characters', () => {
    Object.values(countries).forEach((config) => {
      expect(config.Currency).toHaveLength(3);
      expect(config.Currency).toMatch(/^[A-Z]{3}$/);
    });
  });
});
