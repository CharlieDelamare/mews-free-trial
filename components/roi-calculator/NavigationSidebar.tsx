'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, Check } from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  isExpanded?: boolean;
}

interface NavigationSidebarProps {
  sections: NavigationItem[];
}

export default function NavigationSidebar({ sections }: NavigationSidebarProps) {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 24;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <>
      {/* Mobile: horizontal scrollable nav */}
      <div
        className="lg:hidden sticky top-0 z-20 -mx-4 px-4 py-2.5"
        style={{
          background: 'color-mix(in srgb, var(--mews-light-indigo) 92%, transparent)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid color-mix(in srgb, var(--mews-night-black) 7%, transparent)',
        }}
      >
        <nav className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                style={
                  isActive
                    ? {
                        background: 'linear-gradient(135deg, var(--mews-night-black) 0%, var(--roi-navy-light) 100%)',
                        color: 'var(--roi-white)',
                        boxShadow: '0 2px 8px color-mix(in srgb, var(--mews-night-black) 30%, transparent)',
                      }
                    : {
                        background: 'color-mix(in srgb, var(--mews-white) 85%, transparent)',
                        color: 'var(--roi-gray-500)',
                        border: '1px solid color-mix(in srgb, var(--mews-night-black) 8%, transparent)',
                      }
                }
              >
                {section.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Desktop: sticky sidebar */}
      <div className="hidden lg:block lg:sticky lg:top-6 self-start flex-shrink-0">
        <div
          className="rounded-2xl p-4 w-56"
          style={{
            background: 'color-mix(in srgb, var(--mews-white) 85%, transparent)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid color-mix(in srgb, var(--mews-night-black) 8%, transparent)',
            boxShadow: '0 4px 20px color-mix(in srgb, var(--mews-night-black) 8%, transparent), 0 1px 4px color-mix(in srgb, var(--mews-black) 4%, transparent)',
          }}
        >
          <h3
            className="text-xs font-bold mb-3 px-2 uppercase tracking-widest"
            style={{ color: 'color-mix(in srgb, var(--mews-night-black) 40%, transparent)' }}
          >
            Navigation
          </h3>
          <nav className="space-y-0.5">
            {sections.map((section) => {
              const isActive = activeSection === section.id;
              const isExpandable = section.isExpanded !== undefined;

              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-200"
                  style={
                    isActive
                      ? {
                          background: 'linear-gradient(135deg, color-mix(in srgb, var(--mews-indigo) 12%, transparent) 0%, color-mix(in srgb, var(--mews-night-black) 6%, transparent) 100%)',
                          color: 'var(--mews-night-black)',
                          fontWeight: 600,
                        }
                      : {
                          color: 'var(--roi-gray-400)',
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-night-black) 4%, transparent)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--roi-gray-700)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = 'var(--roi-gray-400)';
                    }
                  }}
                >
                  <div
                    className="flex-shrink-0 w-1.5 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      background: isActive ? 'var(--mews-indigo)' : 'color-mix(in srgb, var(--mews-night-black) 20%, transparent)',
                      transform: isActive ? 'scale(1.4)' : 'scale(1)',
                    }}
                  />
                  <span className="flex-1 truncate text-xs">{section.label}</span>
                  {isExpandable && section.isExpanded && (
                    <Check className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--mews-success)' }} />
                  )}
                  {isExpandable && !section.isExpanded && (
                    <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-30" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
