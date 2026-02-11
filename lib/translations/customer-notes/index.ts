/**
 * Customer notes translation lookup
 *
 * Translates English customer note text to the target language.
 * Keys are the exact English note strings from sample-customers.ts.
 * Falls back to the original English text if no translation is found.
 */

import type { SupportedLanguage } from '../language-utils';
import { notes as esNotes } from './es';
import { notes as frNotes } from './fr';
import { notes as nlNotes } from './nl';
import { notes as deNotes } from './de';

const translations: Record<string, Record<string, string>> = {
  es: esNotes,
  fr: frNotes,
  nl: nlNotes,
  de: deNotes,
};

/**
 * Translate a customer note from English to the target language.
 * Returns the original English text if no translation is available.
 */
export function translateNote(englishNote: string, language: SupportedLanguage): string {
  if (language === 'en' || !englishNote) return englishNote;

  const langNotes = translations[language];
  if (!langNotes) return englishNote;

  return langNotes[englishNote] || englishNote;
}
