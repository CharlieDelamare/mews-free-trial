'use client';

import { X, FileDown } from 'lucide-react';
import { getTranslations } from '@/lib/roi-calculator/translations';
import type { LanguageCode } from '@/lib/roi-calculator/types/translations';

interface Section {
  id: string;
  label: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
  selectedSections: string[];
  onToggleSection: (sectionId: string) => void;
  onExport: () => void;
  isExporting: boolean;
  presentationLanguage?: LanguageCode;
}

export default function ExportModal({
  isOpen,
  onClose,
  sections,
  selectedSections,
  onToggleSection,
  onExport,
  isExporting,
  presentationLanguage,
}: ExportModalProps) {
  if (!isOpen) return null;

  const t = getTranslations(presentationLanguage ?? 'en');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'color-mix(in srgb, var(--mews-deep-blue) 60%, transparent)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExporting) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-sm w-full overflow-hidden flex flex-col animate-scale-in"
        style={{
          boxShadow: '0 24px 64px color-mix(in srgb, var(--mews-deep-blue) 25%, transparent), 0 8px 24px color-mix(in srgb, var(--mews-black) 15%, transparent)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 pb-4"
          style={{ borderBottom: '1px solid color-mix(in srgb, var(--mews-charcoal) 6%, transparent)' }}
        >
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t.labels.exportRoiReport}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{t.labels.chooseSections}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150"
            style={{ background: 'color-mix(in srgb, var(--mews-charcoal) 5%, transparent)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-charcoal) 10%, transparent)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-charcoal) 5%, transparent)';
            }}
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Section checklist */}
        <div className="p-5 space-y-2">
          {sections.map((section) => {
            const isChecked = selectedSections.includes(section.id);
            return (
              <label
                key={section.id}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 group"
                style={{
                  background: isChecked ? 'color-mix(in srgb, var(--mews-indigo) 7%, transparent)' : 'color-mix(in srgb, var(--mews-charcoal) 2%, transparent)',
                  border: `1px solid ${isChecked ? 'color-mix(in srgb, var(--mews-indigo) 25%, transparent)' : 'color-mix(in srgb, var(--mews-charcoal) 6%, transparent)'}`,
                }}
              >
                {/* Custom checkbox */}
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-150"
                  style={{
                    background: isChecked
                      ? 'var(--mews-indigo)'
                      : 'color-mix(in srgb, var(--mews-charcoal) 6%, transparent)',
                    border: `2px solid ${isChecked ? 'transparent' : 'color-mix(in srgb, var(--mews-charcoal) 15%, transparent)'}`,
                    boxShadow: isChecked ? '0 2px 8px color-mix(in srgb, var(--mews-indigo) 30%, transparent)' : 'none',
                  }}
                >
                  {isChecked && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleSection(section.id)}
                  className="sr-only"
                  disabled={isExporting}
                />
                <span className="text-sm font-medium text-gray-800">{section.label}</span>
              </label>
            );
          })}

          {selectedSections.length === 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-3 border border-amber-200">
              {t.labels.selectAtLeastOne}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-5 pt-4 flex gap-3"
          style={{ borderTop: '1px solid color-mix(in srgb, var(--mews-charcoal) 6%, transparent)' }}
        >
          <button
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
            style={{
              background: 'color-mix(in srgb, var(--mews-charcoal) 5%, transparent)',
              border: '1px solid color-mix(in srgb, var(--mews-charcoal) 8%, transparent)',
              color: 'var(--roi-gray-700)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-charcoal) 10%, transparent)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-charcoal) 5%, transparent)';
            }}
          >
            {t.labels.cancel}
          </button>
          <button
            onClick={onExport}
            disabled={selectedSections.length === 0 || isExporting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-150"
            style={{
              background:
                selectedSections.length === 0 || isExporting
                  ? 'var(--roi-neutral-border)'
                  : 'linear-gradient(135deg, var(--mews-night-black) 0%, var(--mews-deep-blue) 100%)',
              boxShadow:
                selectedSections.length === 0 || isExporting
                  ? 'none'
                  : '0 4px 12px color-mix(in srgb, var(--mews-charcoal) 30%, transparent)',
              cursor: selectedSections.length === 0 || isExporting ? 'not-allowed' : 'pointer',
            }}
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t.labels.generating}
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                {t.labels.exportPdf}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
