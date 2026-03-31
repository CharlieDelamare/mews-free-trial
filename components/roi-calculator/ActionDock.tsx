'use client';

import { Presentation, FileDown, Compass, Languages, Info, Check, Loader2 } from 'lucide-react';
import type { LanguageCode } from '@/lib/roi-calculator/types/translations';
import { SUPPORTED_LANGUAGES } from '@/lib/roi-calculator/types/translations';
interface ActionDockProps {
  onPresentationMode: () => void;
  onExport: () => void;
  onDiscovery: () => void;
  presentationLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  saveStatus?: 'idle' | 'saving' | 'saved';
}

export default function ActionDock({
  onPresentationMode,
  onExport,
  onDiscovery,
  presentationLanguage,
  onLanguageChange,
  saveStatus,
}: ActionDockProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30"
      style={{
        background: 'color-mix(in srgb, var(--mews-white) 85%, transparent)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid color-mix(in srgb, var(--mews-night-black) 8%, transparent)',
        boxShadow: '0 -4px 24px color-mix(in srgb, var(--mews-night-black) 6%, transparent)',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Left: Language + Presentation Mode */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 relative group/lang">
            <Languages className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={presentationLanguage}
              onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
              className="px-2 py-2 rounded-lg text-sm font-medium text-gray-700 bg-transparent border border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-mews-primary focus:border-mews-primary outline-none transition-all cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
            <span className="relative group">
              <Info className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 cursor-help transition-colors" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 text-[11px] font-medium text-white bg-gray-800 rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-lg">
                Applies to Presentation Mode and PDF Export only
              </span>
            </span>
          </div>

          <button
            onClick={onPresentationMode}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: 'var(--mews-orange)',
              color: 'var(--mews-white)',
              boxShadow: '0 2px 12px color-mix(in srgb, var(--mews-orange) 40%, transparent)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px color-mix(in srgb, var(--mews-orange) 55%, transparent)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px color-mix(in srgb, var(--mews-orange) 40%, transparent)';
            }}
          >
            <Presentation className="w-4 h-4" />
            Presentation Mode
          </button>
        </div>

        {/* Centre: save status */}
        {saveStatus && saveStatus !== 'idle' && (
          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
            {saveStatus === 'saving' ? (
              <><Loader2 className="w-3 h-3 animate-spin" />Saving…</>
            ) : (
              <><Check className="w-3 h-3 text-green-500" />Saved</>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Discovery button hidden for now — kept for future reuse */}
          {false && (
          <button
            onClick={onDiscovery}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 transition-all duration-200"
            style={{
              background: 'color-mix(in srgb, var(--mews-night-black) 4%, transparent)',
              border: '1px solid color-mix(in srgb, var(--mews-night-black) 8%, transparent)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-night-black) 8%, transparent)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-night-black) 4%, transparent)';
            }}
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Discovery</span>
          </button>
          )}

          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 transition-all duration-200"
            style={{
              background: 'color-mix(in srgb, var(--mews-night-black) 4%, transparent)',
              border: '1px solid color-mix(in srgb, var(--mews-night-black) 8%, transparent)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-night-black) 8%, transparent)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-night-black) 4%, transparent)';
            }}
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}
