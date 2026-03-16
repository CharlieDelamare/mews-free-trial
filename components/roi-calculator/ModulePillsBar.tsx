'use client';

import ModulePill from '@/components/roi-calculator/ui/ModulePill';
import { MODULE_META, MODULE_KEYS } from '@/hooks/useROICalculator';
import type { ModuleKey, EnabledModules, FilteredResults } from '@/lib/roi-calculator/types/calculator';

interface ModulePillsBarProps {
  enabledModules: EnabledModules;
  activeDetailModule: ModuleKey | null;
  filteredResults: FilteredResults;
  currencySymbol: string;
  onToggleModule: (module: ModuleKey) => void;
  onSelectModule: (module: ModuleKey) => void;
}

export default function ModulePillsBar({
  enabledModules,
  activeDetailModule,
  filteredResults,
  currencySymbol,
  onToggleModule,
  onSelectModule,
}: ModulePillsBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
      {MODULE_KEYS.map((key) => {
        const meta = MODULE_META[key];
        const contribution = filteredResults.contributions.find((c) => c.key === key);
        return (
          <ModulePill
            key={key}
            moduleKey={key}
            label={meta.label}
            color={meta.color}
            savings={contribution?.savings ?? 0}
            currencySymbol={currencySymbol}
            enabled={enabledModules[key]}
            isActive={activeDetailModule === key}
            onToggle={() => onToggleModule(key)}
            onSelect={() => onSelectModule(key)}
          />
        );
      })}
    </div>
  );
}
