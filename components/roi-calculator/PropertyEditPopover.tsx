'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Globe, Building2, Search, ChevronDown } from 'lucide-react';
import type { SharedVariables } from '@/lib/roi-calculator/types/calculator';

interface PropertyEditPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  country: string;
  setCountry: (value: string) => void;
  hotelType: string;
  setHotelType: (value: string) => void;
  countries: Array<{ name: string; currency: string; currencySymbol: string }>;
  hotelTypes: string[];
  sharedVariables: SharedVariables;
  onSharedVariableChange: <K extends keyof SharedVariables>(field: K, value: SharedVariables[K]) => void;
  currencySymbol: string;
}

function InlineNumberInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  min = 0,
  max = 99999,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(String(value));
      inputRef.current?.select();
    }
  }, [editing, value]);

  const commit = () => {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          min={min}
          max={max}
          step={step}
          className="w-24 px-2 py-1.5 text-sm font-semibold text-gray-900 bg-white rounded-lg border-2 outline-none tabular-nums"
          style={{ borderColor: 'var(--mews-indigo)' }}
          autoFocus
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="px-2 py-1.5 text-sm font-semibold text-gray-900 bg-white/80 hover:bg-white rounded-lg border border-gray-200 transition-colors text-left tabular-nums cursor-text"
          style={{ ['--hover-border' as string]: 'var(--mews-indigo)' }}
        >
          {prefix}{value.toLocaleString()}{suffix}
        </button>
      )}
    </div>
  );
}

function CompactCountryCombobox({
  country,
  setCountry,
  countries,
}: {
  country: string;
  setCountry: (v: string) => void;
  countries: Array<{ name: string; currency: string; currencySymbol: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = countries.find((c) => c.name === country);
  const filtered = query.trim() === ''
    ? countries
    : countries.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        <Globe className="w-3 h-3 inline mr-1" />Country
      </span>
      <div
        className="relative flex items-center rounded-lg overflow-hidden cursor-text"
        style={{
          background: 'white',
          boxShadow: open ? '0 0 0 2px var(--mews-indigo)' : 'none',
          border: '1px solid color-mix(in srgb, var(--mews-black) 10%, transparent)',
        }}
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        <Search className="absolute left-2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={open ? query : (selected ? `${selected.name} (${selected.currencySymbol})` : '')}
          onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => { setOpen(true); setQuery(''); }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setOpen(false); setQuery(''); }
            else if (e.key === 'Enter' && filtered.length > 0) { setCountry(filtered[0].name); setOpen(false); setQuery(''); }
          }}
          placeholder="Search..."
          className="w-full pl-7 pr-6 py-1.5 text-sm font-semibold text-gray-900 bg-transparent outline-none placeholder:text-gray-400"
          autoComplete="off"
        />
        <ChevronDown className="absolute right-2 w-3.5 h-3.5 text-gray-400 pointer-events-none" style={{ transform: open ? 'rotate(180deg)' : '' }} />
      </div>
      {open && (
        <div
          className="absolute top-full left-0 z-50 w-full mt-1 rounded-lg overflow-hidden"
          style={{
            background: 'var(--mews-white)',
            boxShadow: '0 8px 32px color-mix(in srgb, var(--mews-night-black) 18%, transparent)',
            border: '1px solid color-mix(in srgb, var(--mews-night-black) 8%, transparent)',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">No results</div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.name}
                onMouseDown={(e) => { e.preventDefault(); setCountry(c.name); setOpen(false); setQuery(''); }}
                className="w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors"
                style={{ background: c.name === country ? 'color-mix(in srgb, var(--mews-indigo) 10%, transparent)' : undefined, fontWeight: c.name === country ? 600 : 400 }}
              >
                <span>{c.name}</span>
                <span className="text-xs text-gray-400">{c.currencySymbol}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function PropertyEditPopover({
  isOpen,
  onClose,
  country,
  setCountry,
  hotelType,
  setHotelType,
  countries,
  hotelTypes,
  sharedVariables,
  onSharedVariableChange,
  currencySymbol,
}: PropertyEditPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid catching the click that opened the popover
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-40 w-[90vw] max-w-lg rounded-2xl animate-scale-in"
      style={{
        background: 'color-mix(in srgb, var(--mews-white) 97%, transparent)',
        backdropFilter: 'blur(16px)',
        border: '1px solid color-mix(in srgb, var(--mews-night-black) 8%, transparent)',
        boxShadow: '0 16px 48px color-mix(in srgb, var(--mews-night-black) 15%, transparent), 0 4px 16px color-mix(in srgb, var(--mews-black) 8%, transparent)',
      }}
    >
      <div className="flex items-center justify-between p-4 pb-3" style={{ borderBottom: '1px solid color-mix(in srgb, var(--mews-night-black) 6%, transparent)' }}>
        <span className="text-sm font-bold text-gray-700">Property Configuration</span>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Row 1: Country + Type */}
        <div className="flex flex-wrap items-end gap-4">
          <CompactCountryCombobox country={country} setCountry={setCountry} countries={countries} />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              <Building2 className="w-3 h-3 inline mr-1" />Type
            </span>
            <div className="relative">
              <select
                value={hotelType}
                onChange={(e) => setHotelType(e.target.value)}
                className="appearance-none pl-2 pr-7 py-1.5 text-sm font-semibold text-gray-900 bg-white rounded-lg border border-gray-200 focus:outline-none transition-colors cursor-pointer"
              >
                {hotelTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Row 2: Core numbers */}
        <div className="flex flex-wrap items-end gap-4">
          <InlineNumberInput label="Rooms" value={sharedVariables.numberOfRooms} onChange={(v) => onSharedVariableChange('numberOfRooms', v)} min={1} max={2000} />
          <InlineNumberInput label="ADR" value={sharedVariables.averageDailyRate} onChange={(v) => onSharedVariableChange('averageDailyRate', v)} prefix={currencySymbol} min={1} max={5000} />
          <InlineNumberInput label="Occupancy" value={sharedVariables.occupancyRate} onChange={(v) => onSharedVariableChange('occupancyRate', v)} suffix="%" min={1} max={100} />
          <InlineNumberInput label="Avg Stay" value={sharedVariables.avgLengthOfStay} onChange={(v) => onSharedVariableChange('avgLengthOfStay', v)} suffix=" nights" min={0.5} max={30} step={0.1} />
        </div>

        {/* Row 3: Derived */}
        <div className="flex flex-wrap items-end gap-4 pt-2" style={{ borderTop: '1px solid color-mix(in srgb, var(--mews-night-black) 6%, transparent)' }}>
          <InlineNumberInput label="Staff Wage/hr" value={sharedVariables.staffHourlyWage} onChange={(v) => onSharedVariableChange('staffHourlyWage', v)} prefix={currencySymbol} min={1} max={100} />
          <InlineNumberInput label="Reservations/mo" value={sharedVariables.reservationsPerMonth} onChange={(v) => onSharedVariableChange('reservationsPerMonth', v)} min={1} max={50000} />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Monthly Revenue</span>
            <span className="px-2 py-1.5 text-sm font-semibold text-gray-500 tabular-nums">
              {currencySymbol}{sharedVariables.monthlyRevenue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
