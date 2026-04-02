'use client';

import { useReducer, useMemo, useCallback } from 'react';
import type {
  ConfidenceMap,
  ConfidenceAction,
  ConfidenceScore,
  ConfidenceStatus,
  IntakeMode,
} from '@/lib/roi-calculator/types/confidence';
import type { PriorityInput } from '@/lib/roi-calculator/types/confidence';
import { computeConfidenceScore } from '@/lib/roi-calculator/utils/confidenceScoring';

interface ConfidenceState {
  map: ConfidenceMap;
  intakeMode: IntakeMode;
  intakeComplete: boolean;
  intakeStep: number;      // Current step in the intake flow (0-based)
}

function reducer(state: ConfidenceState, action: ConfidenceAction | { type: 'SET_INTAKE_STEP'; step: number } | { type: 'COMPLETE_INTAKE' } | { type: 'RESET_INTAKE' }): ConfidenceState {
  switch (action.type) {
    case 'SET_CONFIDENCE':
      return {
        ...state,
        map: {
          ...state.map,
          [action.key]: {
            ...state.map[action.key],
            status: action.status,
          },
        },
      };
    case 'CONFIRM_FIELD':
      return {
        ...state,
        map: {
          ...state.map,
          [action.key]: {
            ...state.map[action.key],
            status: 'confirmed',
          },
        },
      };
    case 'REVERT_TO_BENCHMARK':
      return {
        ...state,
        map: {
          ...state.map,
          [action.key]: {
            ...state.map[action.key],
            status: 'benchmark',
          },
        },
      };
    case 'INIT_CONFIDENCE':
      return {
        ...state,
        map: action.map,
      };
    case 'SET_INTAKE_MODE':
      return { ...state, intakeMode: action.mode };
    case 'SET_INTAKE_STEP':
      return { ...state, intakeStep: action.step };
    case 'COMPLETE_INTAKE':
      return { ...state, intakeComplete: true };
    case 'RESET_INTAKE':
      return { ...state, intakeComplete: false, intakeStep: 0 };
    default:
      return state;
  }
}

const initialState: ConfidenceState = {
  map: {},
  intakeMode: 'validated',
  intakeComplete: false,
  intakeStep: 0,
};

export function useConfidence(priorityInputs: PriorityInput[]) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Exclude validation-only inputs from confidence scoring so counts
  // match the inputs the user actually sees in the wizard.
  const wizardInputs = useMemo(
    () => priorityInputs.filter((i) => !i.validationOnly),
    [priorityInputs],
  );

  const score: ConfidenceScore = useMemo(
    () => computeConfidenceScore(state.map, wizardInputs),
    [state.map, wizardInputs],
  );

  const getFieldStatus = useCallback(
    (key: string): ConfidenceStatus => state.map[key]?.status ?? 'benchmark',
    [state.map],
  );

  const getBenchmarkValue = useCallback(
    (key: string): number | undefined => state.map[key]?.benchmarkValue,
    [state.map],
  );

  const setFieldConfidence = useCallback(
    (key: string, status: ConfidenceStatus) => {
      dispatch({ type: 'SET_CONFIDENCE', key, status });
    },
    [],
  );

  const confirmField = useCallback(
    (key: string) => dispatch({ type: 'CONFIRM_FIELD', key }),
    [],
  );

  const revertToBenchmark = useCallback(
    (key: string) => dispatch({ type: 'REVERT_TO_BENCHMARK', key }),
    [],
  );

  const initConfidence = useCallback(
    (map: ConfidenceMap) => dispatch({ type: 'INIT_CONFIDENCE', map }),
    [],
  );

  return {
    confidenceState: state,
    confidenceDispatch: dispatch,
    score,
    getFieldStatus,
    getBenchmarkValue,
    setFieldConfidence,
    confirmField,
    revertToBenchmark,
    initConfidence,
  };
}
