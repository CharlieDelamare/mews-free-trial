'use client';

import { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Building2,
  Clock,
  CreditCard,
  TrendingUp,
  Edit3,
  RotateCcw,
  Zap,
  BarChart3,
} from 'lucide-react';
import type { PriorityInput } from '@/lib/roi-calculator/types/confidence';
import type { ConfidenceStatus, ConfidenceScore } from '@/lib/roi-calculator/types/confidence';

interface DataComparisonSectionProps {
  priorityInputs: PriorityInput[];
  currencySymbol: string;
  getValue: (slice: string, field: string) => number;
  getBenchmarkValue: (key: string) => number | undefined;
  getFieldStatus: (key: string) => ConfidenceStatus;
  onValueChange: (slice: string, field: string, value: number) => void;
  onConfirmField: (key: string) => void;
  onAdjustField: (key: string) => void;
  score: ConfidenceScore;
}

const GROUP_META: Record<string, { label: string; icon: typeof Building2; color: string }> = {
  property: { label: 'Property Basics', icon: Building2, color: '#6366f1' },
  operations: { label: 'Operations', icon: Clock, color: '#f59e0b' },
  payments: { label: 'Payments', icon: CreditCard, color: '#3b82f6' },
  revenue: { label: 'Revenue', icon: TrendingUp, color: '#10b981' },
  rms: { label: 'Revenue Management', icon: BarChart3, color: '#8b5cf6' },
};

const GROUP_ORDER = ['property', 'operations', 'payments', 'revenue', 'rms'];

function formatFieldValue(value: number, unit?: string, currencySymbol?: string): string {
  if (unit === '%') return `${value}%`;
  if (unit === 'min') return `${value} min`;
  if (unit === 'hrs') return `${value} hrs`;
  if (unit === 'rooms') return `${value} rooms`;
  if (unit === 'nights') return `${value} nights`;
  if (unit === 'reservations') return `${value.toLocaleString()} res/mo`;
  if (unit === 'plans') return `${value} plans`;
  if (unit === 'channels') return `${value} channels`;
  if (unit === '/week') return `${value}/week`;
  if (unit === currencySymbol) {
    return `${currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  return `${value}`;
}

function getImprovementLabel(current: number, mewsValue: number, displayMode: 'target' | 'additive' | 'uplift' | 'growth', unit?: string): { text: string; color: string } {
  if (displayMode === 'additive') {
    return { text: `+${mewsValue}${unit === '%' ? '%' : ''}`, color: 'text-emerald-600' };
  }
  if (displayMode === 'uplift') {
    // mewsValue is a % improvement factor; show it as the improvement
    return { text: `+${mewsValue}%`, color: 'text-emerald-600' };
  }
  if (displayMode === 'growth') {
    // mewsValue is a higher target; show % increase from current to target
    if (current <= 0) return { text: '--', color: 'text-gray-400' };
    const pct = Math.round(((mewsValue - current) / current) * 100);
    return { text: `+${pct}%`, color: 'text-emerald-600' };
  }
  // target mode: lower is better (time, rates)
  const saved = current - mewsValue;
  if (Math.abs(saved) < 0.01) return { text: '--', color: 'text-gray-400' };
  const pct = current !== 0 ? Math.round((saved / current) * 100) : 0;
  return {
    text: `${pct}% less`,
    color: saved > 0 ? 'text-emerald-600' : 'text-orange-600',
  };
}

export default function DataComparisonSection({
  priorityInputs,
  currencySymbol,
  getValue,
  getBenchmarkValue,
  getFieldStatus,
  onValueChange,
  onConfirmField,
  onAdjustField,
  score,
}: DataComparisonSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editingMewsField, setEditingMewsField] = useState<string | null>(null);
  const [editMewsValue, setEditMewsValue] = useState<string>('');

  // Group inputs by category
  const groupedInputs = useMemo(() => {
    const groups: Record<string, PriorityInput[]> = {};
    for (const input of priorityInputs) {
      if (!groups[input.group]) groups[input.group] = [];
      groups[input.group].push(input);
    }
    return groups;
  }, [priorityInputs]);

  // Count stats
  const comparisonStats = useMemo(() => {
    let matches = 0;
    let mismatches = 0;
    let unvalidated = 0;

    for (const input of priorityInputs) {
      const status = getFieldStatus(input.key);
      const current = getValue(input.slice, input.field);
      const benchmark = getBenchmarkValue(input.key);

      if (status === 'benchmark' || status === 'unknown') {
        unvalidated++;
      } else if (benchmark !== undefined && Math.abs(current - benchmark) > 0.01) {
        mismatches++;
      } else {
        matches++;
      }
    }

    return { matches, mismatches, unvalidated };
  }, [priorityInputs, getFieldStatus, getValue, getBenchmarkValue]);

  const startEdit = (input: PriorityInput) => {
    const current = getValue(input.slice, input.field);
    setEditingField(input.key);
    setEditValue(String(current));
  };

  const commitEdit = (input: PriorityInput) => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed >= input.min && parsed <= input.max) {
      onValueChange(input.slice, input.field, parsed);
      onAdjustField(input.key);
    }
    setEditingField(null);
  };

  const startMewsEdit = (input: PriorityInput) => {
    if (!input.mewsMapping) return;
    const current = getValue(input.mewsMapping.slice, input.mewsMapping.field);
    setEditingMewsField(input.key);
    setEditMewsValue(String(current));
  };

  const commitMewsEdit = (input: PriorityInput) => {
    if (!input.mewsMapping) return;
    const parsed = parseFloat(editMewsValue);
    if (!isNaN(parsed) && parsed >= input.mewsMapping.min && parsed <= input.mewsMapping.max) {
      onValueChange(input.mewsMapping.slice, input.mewsMapping.field, parsed);
    }
    setEditingMewsField(null);
  };

  const resetToBenchmark = (input: PriorityInput) => {
    const benchmark = getBenchmarkValue(input.key);
    if (benchmark !== undefined) {
      onValueChange(input.slice, input.field, benchmark);
      onConfirmField(input.key);
    }
  };

  const statusBadge = (status: ConfidenceStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'adjusted':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
            <Edit3 className="w-3 h-3" /> Adjusted
          </span>
        );
      case 'unknown':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" /> Unknown
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" /> Benchmark
          </span>
        );
    }
  };

  return (
    <div className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-gray-900">Data Validation: Current Performance vs. With Mews</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {comparisonStats.mismatches > 0 && (
                <span className="text-blue-600 font-medium">{comparisonStats.mismatches} adjusted</span>
              )}
              {comparisonStats.mismatches > 0 && comparisonStats.matches > 0 && ' \u00b7 '}
              {comparisonStats.matches > 0 && (
                <span className="text-emerald-600 font-medium">{comparisonStats.matches} confirmed</span>
              )}
              {(comparisonStats.mismatches > 0 || comparisonStats.matches > 0) && comparisonStats.unvalidated > 0 && ' \u00b7 '}
              {comparisonStats.unvalidated > 0 && (
                <span className="text-amber-600 font-medium">{comparisonStats.unvalidated} still using benchmarks</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right mr-2">
            <div className="text-xs text-gray-400">Confidence</div>
            <div className="text-sm font-bold" style={{ color: score.overall >= 70 ? '#10b981' : score.overall >= 45 ? '#3b82f6' : '#f59e0b' }}>
              {score.overall}%
            </div>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {/* Body */}
      {isExpanded && (
        <div className="px-6 pb-6">
          {/* Column Headers */}
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-2">
            <div className="col-span-3">Input</div>
            <div className="col-span-2 text-right">Current Value</div>
            <div className="col-span-1 text-center"></div>
            <div className="col-span-2 text-right">With Mews</div>
            <div className="col-span-2 text-center">Improvement</div>
            <div className="col-span-2 text-right">Status</div>
          </div>

          {GROUP_ORDER.map((groupKey) => {
            const inputs = groupedInputs[groupKey];
            if (!inputs) return null;
            const meta = GROUP_META[groupKey];
            const GroupIcon = meta.icon;

            return (
              <div key={groupKey} className="mb-4 last:mb-0">
                {/* Group Header */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <GroupIcon className="w-4 h-4" style={{ color: meta.color }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                </div>

                {/* Rows */}
                {inputs.map((input) => {
                  const currentValue = getValue(input.slice, input.field);
                  const status = getFieldStatus(input.key);
                  const isEditing = editingField === input.key;
                  const hasMews = !!input.mewsMapping;
                  const isEditingMews = editingMewsField === input.key;

                  // Get Mews value if applicable
                  const mewsValue = hasMews
                    ? getValue(input.mewsMapping!.slice, input.mewsMapping!.field)
                    : undefined;
                  const mewsUnit = input.mewsMapping?.unit ?? input.unit;

                  // Improvement info
                  const improvement = hasMews && mewsValue !== undefined
                    ? getImprovementLabel(currentValue, mewsValue, input.mewsMapping!.displayMode, mewsUnit)
                    : null;

                  return (
                    <div
                      key={input.key}
                      className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      {/* Label */}
                      <div className="col-span-3">
                        <div className="text-sm font-medium text-gray-800">{input.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{input.benchmarkLabel}</div>
                      </div>

                      {/* Current Value (editable unless readOnly) */}
                      <div className="col-span-2 text-right">
                        {input.readOnly ? (
                          <span
                            className="inline-flex items-center gap-1 text-sm font-mono font-bold text-gray-400"
                            title="Auto-calculated"
                          >
                            {formatFieldValue(currentValue, input.unit, currencySymbol)}
                          </span>
                        ) : isEditing ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => commitEdit(input)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitEdit(input);
                              if (e.key === 'Escape') setEditingField(null);
                            }}
                            min={input.min}
                            max={input.max}
                            step={input.step}
                            autoFocus
                            className="w-full text-right text-sm font-mono font-bold text-gray-900 border border-blue-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-200 outline-none"
                          />
                        ) : (
                          <button
                            onClick={() => startEdit(input)}
                            className="inline-flex items-center gap-1 text-sm font-mono font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Click to edit"
                          >
                            {formatFieldValue(currentValue, input.unit, currencySymbol)}
                            <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                          </button>
                        )}
                      </div>

                      {/* Arrow (only for fields with Mews impact) */}
                      <div className="col-span-1 flex justify-center">
                        {hasMews || input.mewsLabel ? (
                          <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                        ) : (
                          <span className="text-gray-200">--</span>
                        )}
                      </div>

                      {/* With Mews (editable, only for fields with Mews mapping) */}
                      <div className="col-span-2 text-right">
                        {hasMews && input.mewsMapping ? (
                          isEditingMews ? (
                            <input
                              type="number"
                              value={editMewsValue}
                              onChange={(e) => setEditMewsValue(e.target.value)}
                              onBlur={() => commitMewsEdit(input)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitMewsEdit(input);
                                if (e.key === 'Escape') setEditingMewsField(null);
                              }}
                              min={input.mewsMapping.min}
                              max={input.mewsMapping.max}
                              step={input.mewsMapping.step}
                              autoFocus
                              className="w-full text-right text-sm font-mono font-bold text-emerald-700 border border-emerald-300 rounded px-2 py-1 focus:ring-2 focus:ring-emerald-200 outline-none"
                            />
                          ) : (
                            <button
                              onClick={() => startMewsEdit(input)}
                              className="inline-flex items-center gap-1 text-sm font-mono font-bold text-emerald-700 hover:text-emerald-500 transition-colors cursor-pointer"
                              title={`Click to adjust ${input.mewsMapping.label}`}
                            >
                              <Zap className="w-3 h-3 text-emerald-500 opacity-70" />
                              {input.mewsMapping.displayMode === 'additive' ? (
                                <span>
                                  {formatFieldValue(mewsValue!, mewsUnit, currencySymbol)}
                                  <span className="text-xs text-emerald-500 ml-1 font-normal">{input.mewsMapping.label}</span>
                                </span>
                              ) : input.mewsMapping.displayMode === 'uplift' ? (
                                // Show computed actual value: current × (1 + mews/100)
                                formatFieldValue(
                                  Math.round(currentValue * (1 + mewsValue! / 100) * 10) / 10,
                                  input.unit,
                                  currencySymbol
                                )
                              ) : input.mewsMapping.displayMode === 'growth' ? (
                                // Show the mews target value formatted like the current field
                                formatFieldValue(mewsValue!, input.unit, currencySymbol)
                              ) : (
                                formatFieldValue(mewsValue!, mewsUnit, currencySymbol)
                              )}
                              <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                            </button>
                          )
                        ) : input.mewsLabel ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 whitespace-nowrap">
                            <Zap className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                            {input.mewsLabel}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">--</span>
                        )}
                      </div>

                      {/* Improvement */}
                      <div className="col-span-2 text-center">
                        {improvement ? (
                          <span className={`text-xs font-medium ${improvement.color}`}>
                            {improvement.text}
                          </span>
                        ) : input.mewsLabel ? (
                          <span className="text-xs font-medium text-emerald-600">Automated</span>
                        ) : (
                          <span className="text-xs text-gray-300">--</span>
                        )}
                      </div>

                      {/* Status + Actions */}
                      <div className="col-span-2 flex items-center justify-end gap-1.5">
                        {!input.readOnly && statusBadge(status)}
                        {status === 'adjusted' && (
                          <button
                            onClick={() => resetToBenchmark(input)}
                            className="p-1 rounded hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                            title="Reset to benchmark"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Footer help text */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Click any value to adjust it. Current values show prospect data or benchmarks. The &quot;With Mews&quot; column shows the expected improvement, which you can edit to be more conservative.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
