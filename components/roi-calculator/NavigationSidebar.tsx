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
          background: 'rgba(248,250,255,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(28,29,36,0.07)',
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
                        color: '#ffffff',
                        boxShadow: '0 2px 8px rgba(28,29,36,0.3)',
                      }
                    : {
                        background: 'rgba(255,255,255,0.85)',
                        color: '#6b7280',
                        border: '1px solid rgba(28,29,36,0.08)',
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
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(28,29,36,0.08)',
            boxShadow: '0 4px 20px rgba(28,29,36,0.08), 0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <h3
            className="text-xs font-bold mb-3 px-2 uppercase tracking-widest"
            style={{ color: 'rgba(28,29,36,0.4)' }}
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
                          background: 'linear-gradient(135deg, rgba(179,178,251,0.12) 0%, rgba(28,29,36,0.06) 100%)',
                          color: 'var(--mews-night-black)',
                          fontWeight: 600,
                        }
                      : {
                          color: '#9ca3af',
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(28,29,36,0.04)';
                      (e.currentTarget as HTMLElement).style.color = '#374151';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = '#9ca3af';
                    }
                  }}
                >
                  <div
                    className="flex-shrink-0 w-1.5 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      background: isActive ? 'var(--mews-indigo)' : 'rgba(28,29,36,0.2)',
                      transform: isActive ? 'scale(1.4)' : 'scale(1)',
                    }}
                  />
                  <span className="flex-1 truncate text-xs">{section.label}</span>
                  {isExpandable && section.isExpanded && (
                    <Check className="w-3 h-3 flex-shrink-0" style={{ color: '#10b981' }} />
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
