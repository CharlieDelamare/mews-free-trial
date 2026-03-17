'use client';

import { useReducer, useMemo, useEffect } from 'react';
import type {
  CalculatorState,
  CalculatorAction,
  CalculatorResults,
  FilteredResults,
  EnabledModules,
  ModuleKey,
  PresetKey,
  LeverDescriptor,
} from '@/lib/roi-calculator/types/calculator';
import {
  calcAll,
  splitGuestExperience,
  splitPayment,
  splitRMS,
} from '@/lib/roi-calculator/utils/calculations';
import { countries, usStates, getSmartDefaults, COUNTRY_DEFAULT_LANGUAGE } from '@/lib/roi-calculator/utils/hotelDefaults';
import {
  getGuestExperienceLevers,
  getPaymentLevers,
  getRMSLevers,
} from '@/lib/roi-calculator/utils/leverDescriptors';

// ── Default state ─────────────────────────────────────────────────────

import { defaultCalculatorState, deriveReservations, deriveMonthlyRevenue } from '@/lib/roi-calculator/utils/defaultState';
export { defaultCalculatorState };

// ── Module presets ────────────────────────────────────────────────────

export const MODULE_PRESETS: Record<Exclude<PresetKey, 'custom'>, EnabledModules> = {
  'full': { guestExperience: true, payment: true, rms: true },
  'guest-experience': { guestExperience: true, payment: false, rms: false },
  'payment': { guestExperience: false, payment: true, rms: false },
  'rms': { guestExperience: false, payment: false, rms: true },
  'operations': { guestExperience: true, payment: true, rms: false },
};

export const MODULE_META: Record<ModuleKey, { label: string; description: string; color: string }> = {
  guestExperience: { label: 'Guest Experience', description: 'Streamline check-in, assignments & upsells', color: '#3b82f6' },
  payment: { label: 'Payment & Billing', description: 'Automate payments, reduce chargebacks & no-shows', color: '#10b981' },
  rms: { label: 'RMS', description: 'Optimize rates & maximize RevPAR', color: '#8b5cf6' },
};

export const MODULE_KEYS: ModuleKey[] = ['guestExperience', 'payment', 'rms'];

// ── Detect which preset matches current enabledModules ────────────────

function detectPreset(enabled: EnabledModules): PresetKey {
  for (const [key, preset] of Object.entries(MODULE_PRESETS) as [Exclude<PresetKey, 'custom'>, EnabledModules][]) {
    if (
      preset.guestExperience === enabled.guestExperience &&
      preset.payment === enabled.payment &&
      preset.rms === enabled.rms
    ) {
      return key;
    }
  }
  return 'custom';
}

// ── Reducer ───────────────────────────────────────────────────────────

function reducer(state: CalculatorState, action: CalculatorAction): CalculatorState {
  switch (action.type) {
    case 'SET_FIELD': {
      const slice = state[action.slice];
      const updated = { ...slice, [action.field]: action.value };

      if (action.slice === 'sharedVariables') {
        const DRIVER_FIELDS = ['numberOfRooms', 'averageDailyRate', 'occupancyRate', 'avgLengthOfStay'];
        if (DRIVER_FIELDS.includes(action.field as string)) {
          const sv = updated as typeof state.sharedVariables;
          return {
            ...state,
            sharedVariables: {
              ...sv,
              reservationsPerMonth: deriveReservations(sv.numberOfRooms, sv.occupancyRate, sv.avgLengthOfStay),
              monthlyRevenue: deriveMonthlyRevenue(sv.numberOfRooms, sv.averageDailyRate, sv.occupancyRate),
            },
            rms: {
              ...state.rms,
              hotelRevPAR: Math.round(sv.averageDailyRate * sv.occupancyRate / 100),
            },
          };
        }
      }

      // When hasExistingRMS changes: auto-disable RMS module and cap uplift at 2%
      if (action.slice === 'rms' && action.field === 'hasExistingRMS') {
        const hasExisting = action.value as boolean;
        const rmsUpdated = {
          ...state.rms,
          hasExistingRMS: hasExisting,
          estimatedRevenueUplift: hasExisting ? 2 : state.rms.estimatedRevenueUplift,
        };
        if (hasExisting) {
          const newEnabled = { ...state.ui.enabledModules, rms: false };
          return {
            ...state,
            rms: rmsUpdated,
            ui: {
              ...state.ui,
              enabledModules: newEnabled,
              activePreset: detectPreset(newEnabled),
              activeDetailModule:
                state.ui.activeDetailModule === 'rms' ? null : state.ui.activeDetailModule,
              expandedLever:
                state.ui.expandedLever?.module === 'rms' ? null : state.ui.expandedLever,
              editingLever:
                state.ui.editingLever?.module === 'rms' ? null : state.ui.editingLever,
            },
          };
        }
        return { ...state, rms: rmsUpdated };
      }

      return { ...state, [action.slice]: updated };
    }
    case 'TOGGLE_EXPORT_SECTION': {
      const prev = state.ui.selectedSections;
      const next = prev.includes(action.sectionId)
        ? prev.filter((id) => id !== action.sectionId)
        : [...prev, action.sectionId];
      return { ...state, ui: { ...state.ui, selectedSections: next } };
    }
    case 'APPLY_DEFAULTS':
      return {
        ...state,
        sharedVariables: action.defaults.sharedVariables,
        guestExperience: action.defaults.guestExperience,
        payment: action.defaults.payment,
        rms: action.defaults.rms,
      };
    case 'SET_EXPORTING':
      return { ...state, ui: { ...state.ui, isExporting: action.value } };
    case 'CLOSE_EXPORT':
      return {
        ...state,
        ui: { ...state.ui, isExportModalOpen: false, selectedSections: [] },
      };

    // ── Module actions ──────────────────────────────────────────────
    case 'TOGGLE_MODULE': {
      const newEnabled = {
        ...state.ui.enabledModules,
        [action.module]: !state.ui.enabledModules[action.module],
      };
      return {
        ...state,
        ui: {
          ...state.ui,
          enabledModules: newEnabled,
          activePreset: detectPreset(newEnabled),
          activeDetailModule:
            state.ui.activeDetailModule === action.module && !newEnabled[action.module]
              ? null
              : state.ui.activeDetailModule,
          expandedLever:
            state.ui.expandedLever?.module === action.module && !newEnabled[action.module]
              ? null
              : state.ui.expandedLever,
          editingLever:
            state.ui.editingLever?.module === action.module && !newEnabled[action.module]
              ? null
              : state.ui.editingLever,
        },
      };
    }
    case 'SET_ACTIVE_DETAIL':
      return {
        ...state,
        ui: {
          ...state.ui,
          activeDetailModule:
            state.ui.activeDetailModule === action.module ? null : action.module,
          expandedLever: state.ui.activeDetailModule === action.module ? null : state.ui.expandedLever,
          editingLever: state.ui.activeDetailModule === action.module ? null : state.ui.editingLever,
        },
      };
    case 'APPLY_PRESET': {
      const preset = action.preset;
      if (preset === 'custom') return state;
      const modules = MODULE_PRESETS[preset];
      if (!modules) return state;
      return {
        ...state,
        ui: {
          ...state.ui,
          enabledModules: { ...modules },
          activePreset: preset,
          activeDetailModule:
            state.ui.activeDetailModule && !modules[state.ui.activeDetailModule]
              ? null
              : state.ui.activeDetailModule,
        },
      };
    }

    // ── Presentation mode ──────────────────────────────────────────
    case 'ENTER_CINEMATIC':
      return {
        ...state,
        ui: {
          ...state.ui,
          cinematicMode: true,
          cinematicSlideIndex: 0,
          activeDetailModule: null,
          expandedLever: null,
          editingLever: null,
        },
      };
    case 'EXIT_CINEMATIC':
      return {
        ...state,
        ui: { ...state.ui, cinematicMode: false, cinematicAutoAdvance: false },
      };
    case 'CINEMATIC_NEXT': {
      const enabledCount = MODULE_KEYS.filter((k) => state.ui.enabledModules[k]).length;
      const maxSlide = enabledCount + 1; // title + N modules + summary
      return {
        ...state,
        ui: {
          ...state.ui,
          cinematicSlideIndex: Math.min(state.ui.cinematicSlideIndex + 1, maxSlide),
        },
      };
    }
    case 'CINEMATIC_PREV':
      return {
        ...state,
        ui: {
          ...state.ui,
          cinematicSlideIndex: Math.max(state.ui.cinematicSlideIndex - 1, 0),
        },
      };
    case 'TOGGLE_CINEMATIC_AUTO':
      return {
        ...state,
        ui: { ...state.ui, cinematicAutoAdvance: !state.ui.cinematicAutoAdvance },
      };

    // ── Property edit ───────────────────────────────────────────────
    case 'OPEN_PROPERTY_EDIT':
      return { ...state, ui: { ...state.ui, propertyEditOpen: true } };
    case 'CLOSE_PROPERTY_EDIT':
      return { ...state, ui: { ...state.ui, propertyEditOpen: false } };

    // ── Progressive disclosure ──────────────────────────────────────
    case 'EXPAND_LEVER':
      return {
        ...state,
        ui: {
          ...state.ui,
          expandedLever:
            state.ui.expandedLever?.module === action.module && state.ui.expandedLever?.lever === action.lever
              ? null
              : { module: action.module, lever: action.lever },
          editingLever:
            state.ui.expandedLever?.module === action.module && state.ui.expandedLever?.lever === action.lever
              ? null
              : state.ui.editingLever,
        },
      };
    case 'EDIT_LEVER':
      return {
        ...state,
        ui: {
          ...state.ui,
          expandedLever: { module: action.module, lever: action.lever },
          editingLever:
            state.ui.editingLever?.module === action.module && state.ui.editingLever?.lever === action.lever
              ? null
              : { module: action.module, lever: action.lever },
        },
      };
    case 'COLLAPSE_LEVER':
      return {
        ...state,
        ui: { ...state.ui, expandedLever: null, editingLever: null },
      };

    default:
      return state;
  }
}

// ── Hook ──────────────────────────────────────────────────────────────

export function useROICalculator(savedState?: Omit<CalculatorState, 'ui'>) {
  const startState: CalculatorState = savedState
    ? {
        ...savedState,
        config: { ...savedState.config, isInitialLoad: true },
        ui: defaultCalculatorState.ui,
      }
    : defaultCalculatorState;

  const [state, dispatch] = useReducer(reducer, startState);

  // Clear usState when country changes away from United States
  useEffect(() => {
    if (state.config.country !== 'United States' && state.config.usState !== '') {
      dispatch({ type: 'SET_FIELD', slice: 'config', field: 'usState', value: '' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.config.country]);

  // Apply smart defaults when country, hotel type, or U.S. state changes
  useEffect(() => {
    const countryConfig = countries.find((c) => c.name === state.config.country);
    if (countryConfig) {
      dispatch({ type: 'SET_FIELD', slice: 'config', field: 'currencySymbol', value: countryConfig.currencySymbol });
    }
    dispatch({ type: 'SET_FIELD', slice: 'config', field: 'presentationLanguage', value: COUNTRY_DEFAULT_LANGUAGE[state.config.country] ?? 'en' });

    if (!state.config.isInitialLoad) {
      const defaults = getSmartDefaults(state.config.country, state.config.hotelType, state.config.usState || undefined);
      dispatch({
        type: 'APPLY_DEFAULTS',
        defaults: {
          sharedVariables: {
            numberOfRooms: defaults.numberOfRooms,
            averageDailyRate: defaults.averageDailyRate,
            occupancyRate: defaults.occupancyRate,
            avgLengthOfStay: defaults.avgLengthOfStay,
            reservationsPerMonth: defaults.reservationsPerMonth,
            monthlyRevenue: defaults.monthlyRevenue,
            staffHourlyWage: defaults.averageStaffWage,
          },
          guestExperience: {
            reservationsPerMonth: defaults.reservationsPerMonth,
            averageStaffWage: defaults.averageStaffWage,
            averageDailyRate: defaults.averageDailyRate,
            checkInTime: defaults.checkInTime,
            checkOutTime: defaults.checkOutTime,
            mewsCheckInTime: defaults.mewsCheckInTime,
            mewsCheckOutTime: defaults.mewsCheckOutTime,
            roomAssignmentTime: defaults.roomAssignmentTime,
            currentCheckInPercentage: defaults.currentCheckInPercentage,
            onlineCheckInPercentage: defaults.onlineCheckInPercentage,
            revenueUplift: defaults.revenueUplift,
            currentDirectBookingPercent: defaults.currentDirectBookingPercent,
            directBookingIncrease: defaults.directBookingIncrease,
            averageCommission: defaults.averageCommission,
          },
          payment: {
            transactionsPerMonth: defaults.transactionsPerMonth,
            secondsPerTransaction: defaults.secondsPerTransaction,
            processingWage: defaults.processingWage,
            chargebackRate: defaults.chargebackRate,
            chargebackVolume: defaults.chargebackVolume,
            chargebackCostPerMonth: defaults.chargebackCostPerMonth,
            reconciliationTimeDaily: defaults.reconciliationTimeDaily,
            mewsReconciliationTimeDaily: defaults.mewsReconciliationTimeDaily,
            reconciliationWage: defaults.reconciliationWage,
            monthlyRevenue: defaults.monthlyRevenue,
            noShowRate: defaults.noShowRate,
            noShowWithoutFee: defaults.noShowWithoutFee,
            foreignCurrencyPercent: defaults.foreignCurrencyPercent,
            multiCurrencyAdoption: defaults.multiCurrencyAdoption,
            revenueShare: defaults.revenueShare,
            mewsChargebackRate: 0.15,
          },
          rms: {
            hotelRevPAR: Math.round(defaults.averageDailyRate * defaults.occupancyRate / 100),
            numberOfRooms: defaults.numberOfRooms,
            numberOfRatePlans: defaults.numberOfRatePlans,
            rateUpdateFrequency: defaults.rateUpdateFrequency,
            rateChangesPerWeek: defaults.rateChangesPerWeek,
            numberOfChannels: defaults.numberOfChannels,
            avgTimeToUpdateRate: defaults.avgTimeToUpdateRate,
            hasRevenueManager: state.rms.hasRevenueManager,
            hasExistingRMS: state.rms.hasExistingRMS,
            estimatedRevenueUplift: state.rms.hasExistingRMS ? 2 : defaults.estimatedRevenueUplift,
          },
        },
      });
    }

    if (state.config.isInitialLoad) {
      dispatch({ type: 'SET_FIELD', slice: 'config', field: 'isInitialLoad', value: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.config.country, state.config.hotelType, state.config.usState]);

  // Derive all calculated values via useMemo
  const results: CalculatorResults = useMemo(
    () => calcAll(state.sharedVariables, state.guestExperience, state.payment, state.rms),
    [state.sharedVariables, state.guestExperience, state.payment, state.rms],
  );

  // Filtered results based on enabled modules
  const filteredResults: FilteredResults = useMemo(() => {
    const { enabledModules } = state.ui;
    let totalTime = 0, totalSavings = 0, costSavings = 0, revenueUplift = 0;
    const contributions = [];

    if (enabledModules.guestExperience) {
      const split = splitGuestExperience(results.guestExperience);
      totalTime += results.guestExperience.totalTime;
      totalSavings += results.guestExperience.totalSavings;
      costSavings += split.costSavings;
      revenueUplift += split.revenueUplift;
      contributions.push({
        key: 'guestExperience' as const,
        label: MODULE_META.guestExperience.label,
        savings: results.guestExperience.totalSavings,
        time: results.guestExperience.totalTime,
        costRevenue: split,
        color: MODULE_META.guestExperience.color,
      });
    }
    if (enabledModules.payment) {
      const split = splitPayment(results.payment);
      totalTime += results.payment.totalTime;
      totalSavings += results.payment.totalSavings;
      costSavings += split.costSavings;
      revenueUplift += split.revenueUplift;
      contributions.push({
        key: 'payment' as const,
        label: MODULE_META.payment.label,
        savings: results.payment.totalSavings,
        time: results.payment.totalTime,
        costRevenue: split,
        color: MODULE_META.payment.color,
      });
    }
    if (enabledModules.rms) {
      const split = splitRMS(results.rms);
      totalTime += results.rms.totalTime;
      totalSavings += results.rms.totalSavings;
      costSavings += split.costSavings;
      revenueUplift += split.revenueUplift;
      contributions.push({
        key: 'rms' as const,
        label: MODULE_META.rms.label,
        savings: results.rms.totalSavings,
        time: results.rms.totalTime,
        costRevenue: split,
        color: MODULE_META.rms.color,
      });
    }

    return { totalTime, totalSavings, costSavings, revenueUplift, contributions };
  }, [results, state.ui.enabledModules]);

  // Lever descriptors for each module
  const leverDescriptors: Record<ModuleKey, LeverDescriptor[]> = useMemo(() => ({
    guestExperience: getGuestExperienceLevers(state.guestExperience, state.sharedVariables, results.guestExperience, state.config.currencySymbol),
    payment: getPaymentLevers(state.payment, state.sharedVariables, results.payment, state.config.currencySymbol),
    rms: getRMSLevers(state.rms, state.sharedVariables, results.rms, state.config.currencySymbol),
  }), [state.guestExperience, state.payment, state.rms, state.sharedVariables, results, state.config.currencySymbol]);

  // Enabled module keys (ordered)
  const enabledModuleKeys: ModuleKey[] = useMemo(
    () => MODULE_KEYS.filter((k) => state.ui.enabledModules[k]),
    [state.ui.enabledModules],
  );

  // Property context string
  const locationLabel = state.config.usState
    ? `${state.config.usState}, ${state.config.country}`
    : state.config.country;
  const propertyContextString = useMemo(
    () => `${state.sharedVariables.numberOfRooms}-room ${state.config.hotelType} in ${locationLabel} · ${state.config.currencySymbol}${state.sharedVariables.averageDailyRate} ADR · ${state.sharedVariables.occupancyRate}% occupancy`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.sharedVariables.numberOfRooms, state.config.hotelType, locationLabel, state.config.currencySymbol, state.sharedVariables.averageDailyRate, state.sharedVariables.occupancyRate],
  );

  return {
    state,
    dispatch,
    results,
    filteredResults,
    leverDescriptors,
    enabledModuleKeys,
    propertyContextString,
  };
}
