// lib/roi-calculator/utils/narratives.ts

import type { LeverDescriptor, ModuleKey } from '@/lib/roi-calculator/types/calculator';
import type { TranslationDictionary } from '@/lib/roi-calculator/types/translations';

function formatVal(value: number, cs: string): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${cs}${(value / 1_000_000).toFixed(1)}M`;
  return `${cs}${Math.round(value).toLocaleString()}`;
}

function buildPlainHelpers(levers: LeverDescriptor[], cs: string) {
  const active = (key: string) => levers.some((l) => l.key === key && l.resultValue > 0);
  const val = (key: string) => {
    const l = levers.find((lv) => lv.key === key);
    if (!l || l.resultValue <= 0) return '';
    return formatVal(l.resultValue, cs);
  };
  return { active, val };
}

/** Plain text — used by CinematicSlide */
export function getModuleNarrative(
  moduleKey: ModuleKey,
  levers: LeverDescriptor[],
  currencySymbol: string,
  t: TranslationDictionary,
): string {
  const { active, val } = buildPlainHelpers(levers, currencySymbol);
  if (moduleKey === 'guestExperience') return t.narratives.guestExperienceNarrative({ active, val });
  if (moduleKey === 'payment') return t.narratives.paymentNarrative({ active, val });
  if (moduleKey === 'rms') return t.narratives.rmsNarrative({ active, val });
  if (moduleKey === 'housekeeping') return t.narratives.housekeepingNarrative({ active, val });
  return '';
}

/**
 * HTML string with pink <span> highlights — used by ExecSummaryPDFTemplate.
 * Generates HTML directly in template literals; does NOT post-process the plain
 * text string. This avoids currency symbol edge cases (£, $, symbol-after-number
 * locales). No user-controlled input enters these strings.
 */
export function getModuleNarrativeHTML(
  moduleKey: ModuleKey,
  levers: LeverDescriptor[],
  currencySymbol: string,
  t: TranslationDictionary,
): string {
  const active = (key: string) => levers.some((l) => l.key === key && l.resultValue > 0);
  const valHTML = (key: string): string => {
    const l = levers.find((lv) => lv.key === key);
    if (!l || l.resultValue <= 0) return '';
    const formatted = formatVal(l.resultValue, currencySymbol);
    return `<span style="color:#FF83DA;font-weight:700">${formatted}</span>`;
  };

  if (moduleKey === 'guestExperience') {
    const parts: string[] = [];
    parts.push('Mews transforms your front desk from a bottleneck into a seamless guest touchpoint.');
    if (active('checkIn')) {
      parts.push('Digital check-in and check-out free your team to focus on hospitality instead of paperwork.');
    }
    if (active('roomAssignment')) {
      parts.push('Automated room assignment eliminates a daily time sink for your front-desk staff.');
    }
    if (active('upsell')) {
      parts.push(`The guest portal creates ${valHTML('upsell')} in new revenue through personalized upsell offers during the booking journey.`);
    }
    if (active('directBooking')) {
      parts.push(`By driving more direct bookings, you reduce OTA dependency and keep ${valHTML('directBooking')} more per year.`);
    }
    return parts.join(' ');
  }

  if (moduleKey === 'payment') {
    const parts: string[] = [];
    parts.push('Mews Payments eliminates manual payment handling — your finance team spends less time on admin and more on strategic decisions.');
    if (active('tokenization')) {
      parts.push('Secure tokenization automates transaction processing, saving your team hours of repetitive work.');
    }
    if (active('reconciliation')) {
      parts.push(`Automated reconciliation replaces manual matching, recovering ${valHTML('reconciliation')} in labor costs.`);
    }
    if (active('chargeback')) {
      parts.push(`Built-in fraud prevention significantly reduces chargebacks, saving ${valHTML('chargeback')} annually.`);
    }
    if (active('noShow')) {
      parts.push(`Automatic card-on-file guarantees capture ${valHTML('noShow')} in no-show fees you'd otherwise write off.`);
    }
    if (active('multiCurrency')) {
      parts.push('Multi-currency support lets international guests pay in their own currency, removing friction and unlocking incremental revenue.');
    }
    return parts.join(' ');
  }

  if (moduleKey === 'rms') {
    const parts: string[] = [];
    if (active('revenueUplift')) {
      parts.push(`Mews RMS replaces guesswork with AI-powered dynamic pricing that responds to market conditions in real time — a 24/7 revenue optimization engine delivering ${valHTML('revenueUplift')} in additional RevPAR.`);
    }
    if (active('rateAutomation')) {
      parts.push(`Automated distribution across all your rate plans and channels eliminates hours of manual updates, saving ${valHTML('rateAutomation')} in labor costs and letting your team focus on strategy instead of spreadsheets.`);
    }
    return parts.join(' ');
  }

  if (moduleKey === 'housekeeping') {
    const parts: string[] = [];
    parts.push('Mews Housekeeping streamlines every aspect of room operations — from assignment to cleaning updates to maintenance coordination.');
    if (active('hkRoomAssignment')) {
      parts.push(`Automated room assignment eliminates the daily briefing bottleneck, saving ${valHTML('hkRoomAssignment')} in housekeeping labor each year.`);
    }
    if (active('cleaningStatusUpdates')) {
      parts.push('Real-time cleaning status updates replace phone calls and paper checklists, keeping the whole team in sync instantly.');
    }
    if (active('maintenanceCommunication')) {
      parts.push('Digital maintenance reporting means repairs are logged and dispatched in seconds, not minutes.');
    }
    if (active('amenitiesReduction')) {
      parts.push(`Smart amenity management reduces unnecessary replenishment, saving ${valHTML('amenitiesReduction')} in supply costs.`);
    }
    if (active('paperElimination')) {
      parts.push('Going fully digital eliminates paper-based processes — better for your team and better for the planet.');
    }
    return parts.join(' ');
  }

  return '';
}
