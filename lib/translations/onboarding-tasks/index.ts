/**
 * Onboarding task translation lookup
 *
 * Returns translated task arrays by language code.
 * Falls back to undefined (caller uses English default).
 */

import type { OnboardingTask } from '../../onboarding-tasks';
import type { SupportedLanguage } from '../language-utils';
import { tasks as esTasks } from './es';
import { tasks as frTasks } from './fr';
import { tasks as nlTasks } from './nl';
import { tasks as deTasks } from './de';

const translations: Record<string, OnboardingTask[]> = {
  es: esTasks,
  fr: frTasks,
  nl: nlTasks,
  de: deTasks,
};

export function getTranslatedOnboardingTasks(language: SupportedLanguage): OnboardingTask[] | undefined {
  if (language === 'en') return undefined;
  return translations[language];
}
