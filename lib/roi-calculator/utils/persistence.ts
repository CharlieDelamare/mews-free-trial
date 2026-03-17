import type { CalculatorState } from '@/lib/roi-calculator/types/calculator';
import { calcAll } from '@/lib/roi-calculator/utils/calculations';
import { defaultCalculatorState } from '@/lib/roi-calculator/utils/defaultState';

export type PersistedState = Omit<CalculatorState, 'ui'>;

export interface PresentationMetadata {
  country: string;
  hotelType: string;
  numberOfRooms: number;
  totalAnnualSavings: number;
}

/** Strip the ephemeral ui slice before storing in the DB. */
export function serializeState(state: CalculatorState): PersistedState {
  const { ui: _ui, ...rest } = state;
  return rest;
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
  );
  return {
    country: state.config.country,
    hotelType: state.config.hotelType,
    numberOfRooms: state.sharedVariables.numberOfRooms,
    totalAnnualSavings: results.totalAnnualSavings,
  };
}
