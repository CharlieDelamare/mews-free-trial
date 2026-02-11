/**
 * Language utilities for multilingual support
 *
 * Maps Mews API DefaultLanguageCode (e.g., "es-ES", "fr-CA") to
 * one of our supported languages for customer notes and onboarding tasks.
 */

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'nl' | 'de';

const SUPPORTED_PREFIXES: Record<string, SupportedLanguage> = {
  en: 'en',
  es: 'es',
  fr: 'fr',
  nl: 'nl',
  de: 'de',
};

/**
 * Resolve a Mews DefaultLanguageCode to a supported language.
 * Extracts the 2-letter prefix and maps to our supported set.
 * Falls back to 'en' for unsupported languages or missing values.
 *
 * Examples:
 *   "es-ES" → "es"
 *   "fr-CA" → "fr"
 *   "de-CH" → "de"
 *   "nl-BE" → "nl"
 *   "ja-JP" → "en" (unsupported, falls back)
 *   undefined → "en"
 */
export function resolveLanguage(defaultLanguageCode?: string): SupportedLanguage {
  if (!defaultLanguageCode) return 'en';
  const prefix = defaultLanguageCode.split('-')[0].toLowerCase();
  return SUPPORTED_PREFIXES[prefix] || 'en';
}
