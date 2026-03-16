import type { LanguageCode, TranslationDictionary } from '../types/translations';
import en from './en';
import fr from './fr';
import es from './es';
import de from './de';
import it from './it';
import nl from './nl';
import pt from './pt';
import cs from './cs';
import da from './da';
import sv from './sv';
import no from './no';
import fi from './fi';

const translations: Record<LanguageCode, TranslationDictionary> = {
  en, fr, es, de, it, nl, pt, cs, da, sv, no, fi,
};

export function getTranslations(lang: LanguageCode): TranslationDictionary {
  return translations[lang] ?? translations.en;
}
