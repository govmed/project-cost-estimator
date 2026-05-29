/**
 * TSAForm - inputs for TSA mode.
 *
 * Wireframe (06-ma-mode.md):
 *  - Duration (months)
 *  - Exit ramp (% per quarter)
 *  - Optional: service tower list (deferred to a follow-up)
 *
 * Each input commits to the store on blur / Enter via the standard
 * EditableField from the planner.
 */

import { useState } from 'react';
import type { MAModeData } from '@/types/scenario';

export interface TSAFormProps {
  maData: MAModeData;
  onChange: (next: MAModeData) => void;
}

export function TSAForm({ maData, onChange }: TSAFormProps) {
  const [duration, setDuration] = useState(String(maData.tsaDurationMonths ?? 12));
  const [exitRamp, setExitRamp] = useState(String(maData.tsaExitRampPct ?? 0));

  function commit() {
    const d = Math.max(0, Math.round(Number(duration) || 0));
    const e = Math.max(0, Math.min(100, Number(exitRamp) || 0));
    onChange({
      ...maData,
      mode: 'TSA',
      tsaDurationMonths: d,
      tsaExitRampPct: e,
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-fg">
          TSA Overview
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Duration (months)">
            <input
              type="number"
              min="0"
              step="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="w-32 rounded border border-border bg-background px-2 py-1 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </Field>
          <Field
            label="Exit ramp"
            hint="% reduction per quarter (compounds)"
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={exitRamp}
                onChange={(e) => setExitRamp(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="w-24 rounded border border-border bg-background px-2 py-1 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <span className="text-sm text-muted-fg">% per quarter</span>
            </div>
          </Field>
        </div>
      </div>

      <div className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-muted-fg">
        <span className="font-medium text-foreground">How this is modeled:</span>{' '}
        Month 1 of TSA cost is the base scenario's <span className="font-mono">runRateMonthly</span>
        {' '}(i.e., the steady-state run-rate after the build is complete). Each subsequent
        quarter applies the exit-ramp reduction (compounding), so e.g. 8% / quarter gives a
        ~50% reduction by month 18. Service-tower breakdown (Infrastructure / Apps / Data /
        Security) is a follow-up; today we model TSA as one rolled-up monthly cost.
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
