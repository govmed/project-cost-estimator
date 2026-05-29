/**
 * IntegrationForm - inputs for Integration mode.
 *
 * Wireframe (06-ma-mode.md):
 *  - Synergy target (annual run-rate)
 *  - Realization months
 *  - One-time integration cost
 *  - Curve shape (M4d ships S-curve only; linear and step are follow-ups)
 */

import { useState } from 'react';
import type { MAModeData } from '@/types/scenario';

export interface IntegrationFormProps {
  maData: MAModeData;
  onChange: (next: MAModeData) => void;
}

export function IntegrationForm({ maData, onChange }: IntegrationFormProps) {
  const [synergyTarget, setSynergyTarget] = useState(
    String(maData.synergyTargetAnnual ?? 0),
  );
  const [realizationMonths, setRealizationMonths] = useState(
    String(maData.synergyRealizationMonths ?? 24),
  );
  const [oneTimeCost, setOneTimeCost] = useState(
    String(maData.oneTimeIntegrationCost ?? 0),
  );

  function commit() {
    const target = Math.max(0, Number(synergyTarget) || 0);
    const months = Math.max(1, Math.round(Number(realizationMonths) || 0));
    const oneTime = Math.max(0, Number(oneTimeCost) || 0);
    onChange({
      ...maData,
      mode: 'Integration',
      synergyTargetAnnual: target,
      synergyRealizationMonths: months,
      oneTimeIntegrationCost: oneTime,
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-fg">
          Synergy Targets
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Annual synergy target"
            hint="Run-rate dollars per year at full realization."
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-fg">$</span>
              <input
                type="number"
                min="0"
                step="100000"
                value={synergyTarget}
                onChange={(e) => setSynergyTarget(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="w-40 rounded border border-border bg-background px-2 py-1 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </Field>
          <Field
            label="Realization timeline"
            hint="Months until synergy reaches full run-rate. S-curve ramp."
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                step="1"
                value={realizationMonths}
                onChange={(e) => setRealizationMonths(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="w-24 rounded border border-border bg-background px-2 py-1 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <span className="text-sm text-muted-fg">months</span>
            </div>
          </Field>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-fg">
          One-time Integration Cost
        </h3>
        <Field
          label="Total one-time cost"
          hint="Lump sum charged to month 0. Use Other Costs screen for itemized breakdown (PMO, data migration, severance, etc.)"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-fg">$</span>
            <input
              type="number"
              min="0"
              step="50000"
              value={oneTimeCost}
              onChange={(e) => setOneTimeCost(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="w-40 rounded border border-border bg-background px-2 py-1 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </Field>
      </div>

      <div className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-muted-fg">
        <span className="font-medium text-foreground">How this is modeled:</span>{' '}
        Synergy realizes via an S-curve (cubic ease) from month 1 to the realization
        month. Beyond realization, synergy stays at the full monthly target. One-time
        integration cost is charged in month 0. The Impact Summary below shows the
        projected breakeven month — the punchline for the CFO conversation.
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wide text-muted-fg">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {hint && <div className="mt-0.5 text-[10px] text-muted-fg/70">{hint}</div>}
    </div>
  );
}
