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
  score: ConfidenceScore;
}

const GROUP_META: Record<string, { label: string; icon: typeof Building2; color: string }> = {
  property:   { label: 'Property Basics',     icon: Building2,  color: 'var(--mews-night-black)' },
  operations: { label: 'Operations',          icon: Clock,      color: 'var(--mews-night-black)' },
  payments:   { label: 'Payments & Billing',  icon: CreditCard, color: 'var(--mews-night-black)' },
  revenue:    { label: 'Revenue',             icon: TrendingUp, color: 'var(--mews-night-black)' },
  rms:        { label: 'Revenue Management',  icon: BarChart3,  color: 'var(--mews-night-black)' },
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

function getImprovementLabel(
  current: number,
  mewsValue: number,
  displayMode: 'target' | 'additive' | 'uplift' | 'growth',
  unit?: string,
): { text: string; color: string } {
  if (displayMode === 'additive') {
    return { text: `+${mewsValue}${unit === '%' ? '%' : ''}`, color: 'text-emerald-600' };
  }
  if (displayMode === 'uplift') {
    return { text: `+${mewsValue}%`, color: 'text-emerald-600' };
  }
  if (displayMode === 'growth') {
    if (current <= 0) return { text: '--', color: 'text-gray-400' };
    const pct = Math.round(((mewsValue - current) / current) * 100);
    return { text: `+${pct}%`, color: 'text-emerald-600' };
  }
  const saved = current - mewsValue;
  if (Math.abs(saved) < 0.01) return { text: '--', color: 'text-gray-400' };
  const pct = current !== 0 ? Math.round((saved / current) * 100) : 0;
  return {
    text: `${pct}% less`,
    color: saved > 0 ? 'text-emerald-600' : 'text-orange-600',
  };
}

function statusBadge(status: ConfidenceStatus) {
  switch (status) {
    case 'confirmed':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3" /> Confirmed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
          <AlertCircle className="w-3 h-3" /> Benchmark
        </span>
      );
  }
}

export default function DataComparisonSection({
  priorityInputs,
  currencySymbol,
  getValue,
  getBenchmarkValue,
  getFieldStatus,
  onValueChange,
  onConfirmField,
  score,
}: DataComparisonSectionProps) {
  // Track which groups are expanded; start all collapsed
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editingMewsField, setEditingMewsField] = useState<string | null>(null);
  const [editMewsValue, setEditMewsValue] = useState<string>('');

  const groupedInputs = useMemo(() => {
    const groups: Record<string, PriorityInput[]> = {};
    for (const input of priorityInputs) {
      if (!groups[input.group]) groups[input.group] = [];
      groups[input.group].push(input);
    }
    return groups;
  }, [priorityInputs]);

  const toggleGroup = (key: string) =>
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const startEdit = (input: PriorityInput) => {
    setEditingField(input.key);
    setEditValue(String(getValue(input.slice, input.field)));
  };

  const commitEdit = (input: PriorityInput) => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed >= input.min && parsed <= input.max) {
      onValueChange(input.slice, input.field, parsed);
      onConfirmField(input.key);
    }
    setEditingField(null);
  };

  const startMewsEdit = (input: PriorityInput) => {
    if (!input.mewsMapping) return;
    setEditingMewsField(input.key);
    setEditMewsValue(String(getValue(input.mewsMapping.slice, input.mewsMapping.field)));
  };

  const commitMewsEdit = (input: PriorityInput) => {
    if (!input.mewsMapping) return;
    const parsed = parseFloat(editMewsValue);
    if (!isNaN(parsed) && parsed >= input.mewsMapping.min && parsed <= input.mewsMapping.max) {
      onValueChange(input.mewsMapping.slice, input.mewsMapping.field, parsed);
    }
    setEditingMewsField(null);
  };

  return (
    <div className="mt-8 space-y-2">
      {/* Section heading */}
      <div className="flex items-center justify-between px-1 mb-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Input Settings
        </h3>
        <span
          className="text-sm font-bold"
          style={{ color: 'var(--mews-primary)' }}
        >
          {score.overall}% confidence
        </span>
      </div>

      {GROUP_ORDER.map((groupKey) => {
        const inputs = groupedInputs[groupKey];
        if (!inputs) return null;

        const meta = GROUP_META[groupKey];
        const GroupIcon = meta.icon;
        const isExpanded = !!expandedGroups[groupKey];
        const groupHasMews = inputs.some((i) => !!i.mewsMapping || !!i.mewsLabel);

        // Per-group status summary for the header pill
        const confirmed = inputs.filter((i) => getFieldStatus(i.key) === 'confirmed').length;
        const benchmarks = inputs.filter((i) => getFieldStatus(i.key) === 'benchmark').length;

        return (
          <div
            key={groupKey}
            className="rounded-xl border border-gray-200 bg-white overflow-hidden"
          >
            {/* Group header — click to expand/collapse */}
            <button
              type="button"
              onClick={() => toggleGroup(groupKey)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: meta.color + '18' }}
                >
                  <GroupIcon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                </div>
                <span className="text-sm font-semibold text-gray-800">{meta.label}</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Status summary */}
                {confirmed > 0 && (
                  <span className="text-xs text-[#15803d] font-medium">
                    {confirmed} confirmed
                  </span>
                )}
                {confirmed > 0 && benchmarks > 0 && (
                  <span className="text-xs text-gray-300">·</span>
                )}
                {benchmarks > 0 && (
                  <span className="text-xs font-medium" style={{ color: 'var(--mews-orange)' }}>
                    {benchmarks} benchmark{benchmarks !== 1 ? 's' : ''}
                  </span>
                )}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 ml-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
                )}
              </div>
            </button>

            {/* Expanded body */}
            {isExpanded && (
              <div className="border-t border-gray-100">
                {/* Column headers — only for groups with Mews values */}
                {groupHasMews && (
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                    <div className="col-span-4">Input</div>
                    <div className="col-span-2 text-right">Current</div>
                    <div className="col-span-1" />
                    <div className="col-span-2 text-right">With Mews</div>
                    <div className="col-span-1 text-center">Change</div>
                    <div className="col-span-2 text-right">Status</div>
                  </div>
                )}

                <div className="divide-y divide-gray-50">
                  {inputs.map((input) => {
                    const currentValue = getValue(input.slice, input.field);
                    const status = getFieldStatus(input.key);
                    const isEditing = editingField === input.key;
                    const hasMews = !!input.mewsMapping;
                    const isEditingMews = editingMewsField === input.key;

                    const mewsValue = hasMews
                      ? getValue(input.mewsMapping!.slice, input.mewsMapping!.field)
                      : undefined;
                    const mewsUnit = input.mewsMapping?.unit ?? input.unit;

                    const improvement =
                      hasMews && mewsValue !== undefined
                        ? getImprovementLabel(
                            currentValue,
                            mewsValue,
                            input.mewsMapping!.displayMode,
                            mewsUnit,
                          )
                        : null;

                    /* ── Simple layout for groups with no Mews column ── */
                    if (!groupHasMews) {
                      return (
                        <div
                          key={input.key}
                          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group"
                        >
                          <div className="min-w-0 flex-1 pr-4">
                            <div className="text-sm font-medium text-gray-800">{input.label}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{input.benchmarkLabel}</div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            {/* Value */}
                            {input.readOnly ? (
                              <span className="text-sm font-mono font-bold text-gray-400" title="Auto-calculated">
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
                                className="w-28 text-right text-sm font-mono font-bold text-gray-900 border border-blue-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-200 outline-none"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEdit(input)}
                                className="inline-flex items-center gap-1 text-sm font-mono font-bold text-gray-900 hover:text-blue-600 transition-colors"
                                title="Click to edit"
                              >
                                {formatFieldValue(currentValue, input.unit, currencySymbol)}
                                <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                              </button>
                            )}

                            {/* Status */}
                            <div className="flex items-center gap-1">
                              {!input.readOnly && statusBadge(status)}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    /* ── Full layout for groups with Mews comparison ── */
                    return (
                      <div
                        key={input.key}
                        className="grid grid-cols-12 gap-2 items-center px-4 py-3 hover:bg-gray-50 transition-colors group"
                      >
                        {/* Label */}
                        <div className="col-span-4">
                          <div className="text-sm font-medium text-gray-800">{input.label}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{input.benchmarkLabel}</div>
                        </div>

                        {/* Current Value */}
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
                              type="button"
                              onClick={() => startEdit(input)}
                              className="inline-flex items-center gap-1 text-sm font-mono font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Click to edit"
                            >
                              {formatFieldValue(currentValue, input.unit, currencySymbol)}
                              <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                            </button>
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="col-span-1 flex justify-center">
                          {hasMews || input.mewsLabel ? (
                            <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                          ) : (
                            <span className="text-gray-200 text-xs">--</span>
                          )}
                        </div>

                        {/* With Mews */}
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
                                type="button"
                                onClick={() => startMewsEdit(input)}
                                className="inline-flex items-center gap-1 text-sm font-mono font-bold text-emerald-700 hover:text-emerald-500 transition-colors cursor-pointer"
                                title={`Click to adjust ${input.mewsMapping.label}`}
                              >
                                <Zap className="w-3 h-3 text-emerald-500 opacity-70" />
                                {input.mewsMapping.displayMode === 'additive' ? (
                                  <span>
                                    {formatFieldValue(mewsValue!, mewsUnit, currencySymbol)}
                                    <span className="text-xs text-emerald-500 ml-1 font-normal">
                                      {input.mewsMapping.label}
                                    </span>
                                  </span>
                                ) : input.mewsMapping.displayMode === 'uplift' ? (
                                  formatFieldValue(
                                    Math.round(currentValue * (1 + mewsValue! / 100) * 10) / 10,
                                    input.unit,
                                    currencySymbol,
                                  )
                                ) : input.mewsMapping.displayMode === 'growth' ? (
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
                        <div className="col-span-1 text-center">
                          {improvement ? (
                            <span className={`text-xs font-medium ${improvement.color}`}>
                              {improvement.text}
                            </span>
                          ) : input.mewsLabel ? (
                            <span className="text-xs font-medium text-emerald-600">Auto</span>
                          ) : (
                            <span className="text-xs text-gray-300">--</span>
                          )}
                        </div>

                        {/* Status */}
                        <div className="col-span-2 flex items-center justify-end gap-1.5">
                          {!input.readOnly && statusBadge(status)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
