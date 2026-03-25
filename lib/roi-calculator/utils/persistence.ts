import type { CalculatorState, EnabledModules } from '@/lib/roi-calculator/types/calculator';
import type { ConfidenceMap } from '@/lib/roi-calculator/types/confidence';
import { calcAll } from '@/lib/roi-calculator/utils/calculations';
import { defaultCalculatorState } from '@/lib/roi-calculator/utils/defaultState';

export type PersistedState = Omit<CalculatorState, 'ui'> & {
  enabledModules?: EnabledModules;
  confidenceMap?: ConfidenceMap;
};

export interface PresentationMetadata {
  country: string;
  hotelType: string;
  numberOfRooms: number;
  totalAnnualSavings: number;
}

/** Strip the ephemeral ui slice before storing in the DB, but preserve enabledModules. */
export function serializeState(state: CalculatorState, confidenceMap?: ConfidenceMap): PersistedState {
  const { ui, ...rest } = state;
  return {
    ...rest,
    enabledModules: ui.enabledModules,
    ...(confidenceMap ? { confidenceMap } : {}),
  };
}

/**
 * Restore a persisted state blob, merging each slice with defaults
 * to handle any new fields added since the state was saved.
 * Returns null for unparseable or non-object input.
 */
export function deserializeState(json: unknown): PersistedState | null {
  try {
    if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
    const stored = json as Record<string, unknown>;
    const d = defaultCalculatorState;
    return {
      config: { ...d.config, ...(stored.config as object ?? {}) },
      sharedVariables: { ...d.sharedVariables, ...(stored.sharedVariables as object ?? {}) },
      guestExperience: { ...d.guestExperience, ...(stored.guestExperience as object ?? {}) },
      payment: { ...d.payment, ...(stored.payment as object ?? {}) },
      rms: { ...d.rms, ...(stored.rms as object ?? {}) },
      housekeeping: { ...d.housekeeping, ...(stored.housekeeping as object ?? {}) },
      enabledModules: { ...d.ui.enabledModules, ...(stored.enabledModules as EnabledModules | undefined ?? {}) },
      ...(stored.confidenceMap ? { confidenceMap: stored.confidenceMap as ConfidenceMap } : {}),
    };
  } catch (err) {
    console.error('[ROI] Failed to deserialize state:', err);
    return null;
  }
}

/** Extract dashboard metadata columns from a persisted state + run calculations. */
export function extractMetadata(state: PersistedState): PresentationMetadata {
  const results = calcAll(
    state.sharedVariables,
    state.guestExperience,
    state.payment,
    state.rms,
    state.housekeeping,
  );
  return {
    country: state.config.country,
    hotelType: state.config.hotelType,
    numberOfRooms: state.sharedVariables.numberOfRooms,
    totalAnnualSavings: results.totalAnnualSavings,
  };
}
