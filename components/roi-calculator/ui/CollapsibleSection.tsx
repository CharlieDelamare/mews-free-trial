'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  icon: ReactNode;
  iconColor: string;
  summaryMetrics?: { label: string; value: string }[];
  children: ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
  defaultExpanded?: boolean;
  headerless?: boolean;
}

export default function CollapsibleSection({
  title,
  icon,
  iconColor,
  summaryMetrics,
  children,
  isExpanded: controlledExpanded,
  onToggle,
  defaultExpanded = false,
  headerless = false,
}: CollapsibleSectionProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  // Headerless mode: just render children directly (used inside ModuleDetail)
  if (headerless && isExpanded) {
    return (
      <div className="px-5 md:px-6 pb-6 md:pb-8 pt-5 section-content">
        {children}
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        boxShadow: isExpanded
          ? '0 4px 20px rgba(0,0,0,0.07), 0 12px 40px rgba(45,44,55,0.08)'
          : '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(45,44,55,0.05)',
        border: '1px solid rgba(45,44,55,0.08)',
      }}
    >
      {/* Header / Toggle Button */}
      <button
        onClick={handleToggle}
        className="w-full p-5 md:p-6 flex items-center justify-between transition-colors duration-200"
        style={{
          background: isExpanded
            ? 'linear-gradient(to right, rgba(45,44,55,0.02), transparent)'
            : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            (e.currentTarget as HTMLElement).style.background = 'rgba(45,44,55,0.02)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }
        }}
      >
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`${iconColor} p-2.5 rounded-xl flex-shrink-0`}
            style={{ border: '1px solid rgba(0,0,0,0.06)' }}
          >
            {icon}
          </div>
          <h2 className="text-base md:text-lg font-bold text-gray-900 truncate">{title}</h2>
        </div>

        {/* Right: Summary metrics + chevron */}
        <div className="flex items-center gap-4 ml-4 flex-shrink-0">
          {!isExpanded && summaryMetrics && (
            <div className="hidden sm:flex gap-5 mr-2">
              {summaryMetrics.map((metric, index) => (
                <div key={index} className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">
                    {metric.label}
                  </p>
                  <p
                    className="text-base font-bold tabular-nums"
                    style={{ color: 'var(--mews-indigo)' }}
                  >
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Animated chevron */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0"
            style={{
              background: isExpanded ? 'rgba(107,163,176,0.1)' : 'rgba(45,44,55,0.05)',
              transform: isExpanded ? 'none' : 'none',
            }}
          >
            <ChevronDown
              className="w-4 h-4 text-gray-400 transition-transform duration-300"
              style={{
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                color: isExpanded ? 'var(--mews-indigo)' : undefined,
              }}
            />
          </div>
        </div>
      </button>

      {/* Divider */}
      {isExpanded && (
        <div
          style={{
            height: '1px',
            background: 'linear-gradient(to right, transparent, rgba(45,44,55,0.08) 20%, rgba(45,44,55,0.08) 80%, transparent)',
          }}
        />
      )}

      {/* Content */}
      {isExpanded && (
        <div className="px-5 md:px-6 pb-6 md:pb-8 pt-5 section-content">
          {children}
        </div>
      )}
    </div>
  );
}
