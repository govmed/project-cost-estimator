/**
 * CarveOutForm - inputs for Carve-out mode.
 *
 * Wireframe (06-ma-mode.md):
 *  - Stand-up multiplier (typical 1.3-1.6 for tech)
 *  - Annual dis-synergy % (typical 2-5)
 *  - One-time separation cost lines (deferred to a follow-up; for M4d we use
 *    other-cost line items in the planner with includeInRunRate=false to
 *    capture these. The user can list them on the Other Costs screen.)
 */

import { useState } from 'react';
import type { MAModeData } from '@/types/scenario';

export interface CarveOutFormProps {
  maData: MAModeData;
  onChange: (next: MAModeData) => void;
}

export function CarveOutForm({ maData, onChange }: CarveOutFormProps) {
  const [multiplier, setMultiplier] = useState(
    String(maData.separationOneTimeCostMultiplier ?? 1.4),
  );
  const [dissynergies, setDissynergies] = useState(
    String(maData.dissynergiesAnnualPct ?? 3),
  );

  function commit() {
    const m = Math.max(1, Number(multiplier) || 1);
    const d = Math.max(0, Number(dissynergies) || 0);
    onChange({
      ...maData,
      mode: 'CarveOut',
      separationOneTimeCostMultiplier: m,
      dissynergiesAnnualPct: d,
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-fg">
          Separation Costs
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Stand-up multiplier"
            hint="One-time setup factor applied to the in-build resource cost. Industry typical: 1.3-1.6 for tech carve-outs."
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                step="0.05"
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="w-24 rounded border border-border bg-background px-2 py-1 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <span className="text-sm text-muted-fg">× (e.g. 1.4 = +40%)</span>
            </div>
          </Field>
          <Field
            label="Annual dis-synergies"
            hint="% of base monthly run-rate. Loss of shared-services efficiency post-separation."
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.1"
                value={dissynergies}
                onChange={(e) => setDissynergies(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="w-24 rounded border border-border bg-background px-2 py-1 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <span className="text-sm text-muted-fg">% / year</span>
            </div>
          </Field>
        </div>
      </div>

      <div className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-muted-fg">
        <span className="font-medium text-foreground">How this is modeled:</span>{' '}
        The stand-up multiplier adds <em>(multiplier − 1) × in-build resource cost</em>
        {' '}as a one-time charge in month 0. Dis-synergies are computed as
        <em> (annual % × monthly run-rate × 12) / 12</em>, spread across 12 months
        post-Day-1. Explicit one-time separation cost lines (TSA exit fee, brand
        reset, etc.) belong on the <span className="font-mono">Other Costs</span>
        {' '}screen as separate line items; they appear in the base totals already.
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
