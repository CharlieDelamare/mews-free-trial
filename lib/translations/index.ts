/**
 * Translations - Multilingual support for customer notes and onboarding tasks
 *
 * Supported languages: English (en), Spanish (es), French (fr), Dutch (nl), German (de)
 * Language is determined from the property's DefaultLanguageCode via Mews configuration/get API.
 */

export { type SupportedLanguage, resolveLanguage } from './language-utils';
export { translateNote } from './customer-notes';
export { getTranslatedOnboardingTasks } from './onboarding-tasks';
