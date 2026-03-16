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
      style={{ background: 'rgba(0,26,51,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExporting) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-sm w-full overflow-hidden flex flex-col animate-scale-in"
        style={{
          boxShadow: '0 24px 64px rgba(0,26,51,0.25), 0 8px 24px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 pb-4"
          style={{ borderBottom: '1px solid rgba(45,44,55,0.06)' }}
        >
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t.labels.exportRoiReport}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{t.labels.chooseSections}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150"
            style={{ background: 'rgba(45,44,55,0.05)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(45,44,55,0.10)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(45,44,55,0.05)';
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
                  background: isChecked ? 'rgba(179,178,251,0.07)' : 'rgba(45,44,55,0.02)',
                  border: `1px solid ${isChecked ? 'rgba(179,178,251,0.25)' : 'rgba(45,44,55,0.06)'}`,
                }}
              >
                {/* Custom checkbox */}
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-150"
                  style={{
                    background: isChecked
                      ? 'var(--mews-indigo)'
                      : 'rgba(45,44,55,0.06)',
                    border: `2px solid ${isChecked ? 'transparent' : 'rgba(45,44,55,0.15)'}`,
                    boxShadow: isChecked ? '0 2px 8px rgba(179,178,251,0.3)' : 'none',
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
          style={{ borderTop: '1px solid rgba(45,44,55,0.06)' }}
        >
          <button
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
            style={{
              background: 'rgba(45,44,55,0.05)',
              border: '1px solid rgba(45,44,55,0.08)',
              color: '#374151',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(45,44,55,0.10)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(45,44,55,0.05)';
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
                  : 'linear-gradient(135deg, var(--mews-night-black) 0%, #1a4e8c 100%)',
              boxShadow:
                selectedSections.length === 0 || isExporting
                  ? 'none'
                  : '0 4px 12px rgba(45,44,55,0.3)',
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
