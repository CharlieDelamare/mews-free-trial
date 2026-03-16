// ── Input Confidence Model ────────────────────────────────────────────
// Every input field in the calculator has an associated confidence status
// that tracks where the value came from and how trustworthy it is.

export type ConfidenceStatus =
  | 'benchmark'      // Prefilled from industry benchmark — not yet validated
  | 'confirmed'      // Prospect confirmed the benchmark value is correct
  | 'adjusted'       // Prospect provided their own specific number
  | 'unknown';       // Prospect doesn't know — benchmark used as fallback

// A single field's confidence metadata
export interface FieldConfidence {
  status: ConfidenceStatus;
  benchmarkValue: number;         // Original benchmark value for comparison
  benchmarkSource?: string;       // e.g. "STR/CoStar 2024", "CBRE 2024"
}

// Confidence map for all trackable fields across all slices.
// Key format: "sliceName.fieldName" e.g. "sharedVariables.numberOfRooms"
export type ConfidenceMap = Record<string, FieldConfidence>;

// ── Priority Input Definition ────────────────────────────────────────
// The minimum viable set of inputs needed for a credible ROI estimate.
// These are the fields we ask the prospect about in the intake flow.

export interface PriorityInput {
  key: string;                           // "sliceName.fieldName"
  slice: string;
  field: string;
  label: string;
  question: string;                      // Conversational question for the prospect
  benchmarkLabel: string;                // e.g. "City Hotels in Belgium average 66%"
  unit?: string;
  min: number;
  max: number;
  step: number;
  group: 'property' | 'operations' | 'revenue' | 'payments' | 'rms';
  importance: 'critical' | 'high' | 'medium';  // How much this input affects the ROI
  skipLabel?: string;                    // Text for the "skip" option
  benchmarkSourceInfo?: string;          // Explanation of where the benchmark data comes from
  mewsMapping?: {
    slice: string;                       // State slice containing the Mews value
    field: string;                       // Field name within that slice
    label: string;                       // Display label, e.g. "With Mews" or "Fee Recovery Rate"
    unit?: string;                       // Unit (defaults to parent's unit if omitted)
    min: number;
    max: number;
    step: number;
    displayMode: 'target' | 'additive' | 'uplift' | 'growth';
    // 'target'   = Mews replaces current value (lower is better, e.g. check-in time)
    // 'additive'  = value IS the Mews impact (e.g. fee recovery rate)
    // 'uplift'    = mews value is a % improvement of current; With Mews = current × (1 + mews/100)
    // 'growth'    = mews value is a higher target (same metric); improvement = % increase
  };
  mewsLabel?: string;  // Static "With Mews" text when there's no numeric comparison (e.g. "Fully Automated")
  validationOnly?: boolean;  // If true, show only in data validation table, not in the prospect intake wizard
  readOnly?: boolean;         // If true, value is auto-calculated and cannot be edited directly
}

// ── Confidence Score ─────────────────────────────────────────────────
// Aggregated confidence metrics for the overall ROI estimate.

export interface ConfidenceScore {
  overall: number;                  // 0-100 percentage
  level: 'directional' | 'indicative' | 'validated' | 'high-confidence';
  confirmedCount: number;
  adjustedCount: number;
  benchmarkCount: number;
  unknownCount: number;
  totalTracked: number;
  // Fields still needing validation (sorted by impact)
  unvalidatedFields: Array<{
    key: string;
    label: string;
    importance: 'critical' | 'high' | 'medium';
  }>;
}

// ── Intake Mode ──────────────────────────────────────────────────────

export type IntakeMode = 'fast' | 'validated';

// ── Reducer Actions ──────────────────────────────────────────────────

export type ConfidenceAction =
  | { type: 'SET_CONFIDENCE'; key: string; status: ConfidenceStatus }
  | { type: 'CONFIRM_FIELD'; key: string }
  | { type: 'MARK_UNKNOWN'; key: string }
  | { type: 'INIT_CONFIDENCE'; map: ConfidenceMap }
  | { type: 'SET_INTAKE_MODE'; mode: IntakeMode };
