/**
 * NewProjectWizardPage - M5c.
 *
 * Three-step wizard for creating a new project from scratch:
 *
 *   1. Basics       - name, client, currency, engagement type & context
 *   2. Pricing      - target margin, contingency, management reserve
 *   3. Phases       - pre-filled with the standard six; inline-editable
 *
 * If a project is already loaded in the store, step 4 ("Confirm") shows
 * a warning that creating the new project will replace the current one
 * in this browser session. (The export workflow is the user's escape
 * hatch if they want to keep their seed work.)
 *
 * Visible outside any project context - this page lives at /new, not
 * under /p/:projectId/. Reachable from the "+ New Project" link in the
 * LeftRail.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/data/store';
import { appendAudit } from '@/data/audit-log';
import {
  createProjectFromWizard,
  DEFAULT_PHASES,
  type NewProjectInput,
  type WizardPhase,
} from '@/data/project-factory';
import type {
  EngagementType,
  EngagementContext,
} from '@/types/project';
import type { CurrencyCode } from '@/types/money';

const CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'BRL'];

const ENGAGEMENT_TYPES: { value: EngagementType; label: string }[] = [
  { value: 'FixedFee', label: 'Fixed Fee' },
  { value: 'TimeAndMaterials', label: 'Time & Materials' },
  { value: 'CappedTM', label: 'Capped T&M' },
  { value: 'Milestone', label: 'Milestone-Based' },
  { value: 'OutcomeBased', label: 'Outcome-Based' },
];

const ENGAGEMENT_CONTEXTS: { value: EngagementContext; label: string }[] = [
  { value: 'NewBuild', label: 'New build' },
  { value: 'Migration', label: 'Migration' },
  { value: 'Modernization', label: 'Modernization' },
  { value: 'MAIntegration', label: 'M&A Integration' },
  { value: 'MACarveOut', label: 'M&A Carve-out' },
  { value: 'TSA', label: 'TSA (Transition Services)' },
  { value: 'RunOperate', label: 'Run & Operate' },
];

type Step = 'basics' | 'pricing' | 'phases' | 'confirm';

const STEPS: { id: Step; label: string }[] = [
  { id: 'basics', label: 'Basics' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'phases', label: 'Phases' },
  { id: 'confirm', label: 'Confirm' },
];

export function NewProjectWizardPage() {
  const navigate = useNavigate();
  const setProject = useProjectStore((s) => s.setProject);
  const existingProject = useProjectStore((s) => s.project);

  // Wizard state - one source of truth for all 3 input steps
  const [step, setStep] = useState<Step>('basics');
  const [input, setInput] = useState<NewProjectInput>({
    name: '',
    client: '',
    baseCurrency: 'USD',
    engagementType: 'FixedFee',
    engagementContext: 'Modernization',
    targetMarginPct: 25,
    contingencyPct: 8,
    managementReservePct: 0,
    phases: [...DEFAULT_PHASES],
  });

  const stepIdx = STEPS.findIndex((s) => s.id === step);
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === STEPS.length - 1;

  // Per-step validation
  const validity = useMemo(() => validate(input), [input]);
  const canAdvanceFromBasics = validity.basicsOK;
  const canAdvanceFromPricing = validity.pricingOK;
  const canAdvanceFromPhases = validity.phasesOK;
  const canCreate =
    canAdvanceFromBasics && canAdvanceFromPricing && canAdvanceFromPhases;

  function next() {
    if (step === 'basics' && !canAdvanceFromBasics) return;
    if (step === 'pricing' && !canAdvanceFromPricing) return;
    if (step === 'phases' && !canAdvanceFromPhases) return;
    setStep(STEPS[stepIdx + 1].id);
  }

  function back() {
    if (!isFirst) setStep(STEPS[stepIdx - 1].id);
  }

  function handleCreate() {
    if (!canCreate) return;
    const { project, scenarios } = createProjectFromWizard(input);
    setProject(project, scenarios);
    // M5d-3: write a project.create audit entry against the new project's
    // base scenario. Gives the project a non-empty history from the moment
    // it's created (instead of "first edit shows up out of nowhere").
    appendAudit(project.id, scenarios[0].id, {
      kind: 'project.create',
      name: project.name,
      client: project.client,
      engagementType: project.engagementType,
      engagementContext: project.engagementContext,
    });
    navigate(`/p/${project.id}/setup`);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">New Project</h1>
          <p className="text-sm text-muted-fg">
            Three steps to a new estimate. You can refine everything later on
            the Project Setup screen.
          </p>
        </div>

        {/* Step indicator */}
        <ol className="mb-6 flex items-center gap-1 text-xs">
          {STEPS.map((s, i) => {
            const active = s.id === step;
            const completed = i < stepIdx;
            return (
              <li key={s.id} className="flex items-center gap-1">
                <span
                  className={
                    active
                      ? 'rounded bg-accent px-2 py-1 font-medium text-accent-fg'
                      : completed
                      ? 'rounded bg-status-good/15 px-2 py-1 text-status-good'
                      : 'rounded px-2 py-1 text-muted-fg'
                  }
                >
                  {i + 1}. {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="text-muted-fg/40">›</span>
                )}
              </li>
            );
          })}
        </ol>

        {/* Step body */}
        <div className="rounded-lg border border-border bg-background p-6">
          {step === 'basics' && (
            <BasicsStep input={input} onChange={setInput} />
          )}
          {step === 'pricing' && (
            <PricingStep input={input} onChange={setInput} />
          )}
          {step === 'phases' && (
            <PhasesStep input={input} onChange={setInput} />
          )}
          {step === 'confirm' && (
            <ConfirmStep input={input} hasExisting={Boolean(existingProject)} />
          )}
        </div>

        {/* Nav footer */}
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-muted-fg hover:text-foreground"
          >
            ← Cancel
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={back}
                className="rounded border border-border px-3 py-1.5 text-sm hover:bg-muted"
              >
                Back
              </button>
            )}
            {!isLast ? (
              <button
                type="button"
                onClick={next}
                disabled={
                  (step === 'basics' && !canAdvanceFromBasics) ||
                  (step === 'pricing' && !canAdvanceFromPricing) ||
                  (step === 'phases' && !canAdvanceFromPhases)
                }
                className="rounded bg-accent px-3 py-1.5 text-sm text-accent-fg hover:bg-accent/90 disabled:opacity-50"
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                disabled={!canCreate}
                className="rounded bg-accent px-3 py-1.5 text-sm text-accent-fg hover:bg-accent/90 disabled:opacity-50"
              >
                Create Project
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
// Validation
// -----------------------------------------------------------------

interface Validity {
  basicsOK: boolean;
  pricingOK: boolean;
  phasesOK: boolean;
}

function validate(input: NewProjectInput): Validity {
  const basicsOK =
    input.name.trim().length > 0 && input.client.trim().length > 0;
  const pricingOK =
    Number.isFinite(input.targetMarginPct) &&
    input.targetMarginPct >= 0 &&
    input.targetMarginPct < 100 &&
    Number.isFinite(input.contingencyPct) &&
    input.contingencyPct >= 0 &&
    Number.isFinite(input.managementReservePct) &&
    input.managementReservePct >= 0;
  const phasesOK =
    input.phases.length >= 1 &&
    input.phases.every(
      (p) => p.name.trim().length > 0 && p.durationWeeks >= 1,
    );
  return { basicsOK, pricingOK, phasesOK };
}

// -----------------------------------------------------------------
// Step components
// -----------------------------------------------------------------

interface StepProps {
  input: NewProjectInput;
  onChange: (next: NewProjectInput) => void;
}

function BasicsStep({ input, onChange }: StepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Project Basics</h2>

      <Field label="Project name" required>
        <input
          type="text"
          value={input.name}
          onChange={(e) => onChange({ ...input, name: e.target.value })}
          placeholder="e.g., Acme Modernization 2026"
          autoFocus
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </Field>

      <Field label="Client" required>
        <input
          type="text"
          value={input.client}
          onChange={(e) => onChange({ ...input, client: e.target.value })}
          placeholder="e.g., Acme Inc."
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Base currency">
          <select
            value={input.baseCurrency}
            onChange={(e) =>
              onChange({ ...input, baseCurrency: e.target.value as CurrencyCode })
            }
            className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>

        <Field label="Engagement type">
          <select
            value={input.engagementType}
            onChange={(e) =>
              onChange({ ...input, engagementType: e.target.value as EngagementType })
            }
            className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {ENGAGEMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Context">
          <select
            value={input.engagementContext}
            onChange={(e) =>
              onChange({
                ...input,
                engagementContext: e.target.value as EngagementContext,
              })
            }
            className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {ENGAGEMENT_CONTEXTS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}

function PricingStep({ input, onChange }: StepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Pricing</h2>
      <p className="text-sm text-muted-fg">
        Set the levers that drive Final Price. You can change these any time
        in Project Setup.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field
          label="Target margin"
          hint="The margin Final Price is grossed up to achieve."
        >
          <PctInput
            value={input.targetMarginPct}
            onChange={(v) => onChange({ ...input, targetMarginPct: v })}
            max={99.9}
          />
        </Field>

        <Field
          label="Contingency"
          hint="Buffer added to Base Cost for unknowns."
        >
          <PctInput
            value={input.contingencyPct}
            onChange={(v) => onChange({ ...input, contingencyPct: v })}
            max={100}
          />
        </Field>

        <Field
          label="Management reserve"
          hint="PMO / governance buffer above contingency."
        >
          <PctInput
            value={input.managementReservePct}
            onChange={(v) => onChange({ ...input, managementReservePct: v })}
            max={100}
          />
        </Field>
      </div>

      <div className="mt-4 rounded-md border border-border bg-muted/10 p-3 text-xs text-muted-fg">
        <span className="font-medium text-foreground">Quick math.</span>{' '}
        With these settings, a $1M base cost yields a target price of{' '}
        <span className="font-mono">
          ${formatPriceFromBase(1_000_000, input)}
        </span>
        .
      </div>
    </div>
  );
}

function PhasesStep({ input, onChange }: StepProps) {
  function updatePhase(idx: number, patch: Partial<WizardPhase>) {
    const next = input.phases.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    onChange({ ...input, phases: next });
  }
  function removePhase(idx: number) {
    onChange({ ...input, phases: input.phases.filter((_, i) => i !== idx) });
  }
  function addPhase() {
    onChange({
      ...input,
      phases: [...input.phases, { name: 'New Phase', durationWeeks: 4 }],
    });
  }
  function resetToDefaults() {
    onChange({ ...input, phases: [...DEFAULT_PHASES] });
  }

  const totalWeeks = input.phases.reduce((acc, p) => acc + (p.durationWeeks || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold">Phases</h2>
          <p className="text-sm text-muted-fg">
            Pre-filled with the standard six. Edit names and durations as
            needed. Total project duration is{' '}
            <span className="font-mono">{totalWeeks} weeks</span>{' '}
            (~{(totalWeeks / 4.345).toFixed(1)} months).
          </p>
        </div>
        <button
          type="button"
          onClick={resetToDefaults}
          className="text-xs text-muted-fg hover:text-foreground"
        >
          Reset to defaults
        </button>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs font-medium uppercase tracking-wide text-muted-fg">
            <tr>
              <th className="w-12 px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Phase name</th>
              <th className="w-32 px-3 py-2 text-left">Weeks</th>
              <th className="w-12 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {input.phases.map((p, i) => (
              <tr key={i} className="border-t border-border/60">
                <td className="px-3 py-2 font-mono text-muted-fg">{i + 1}</td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => updatePhase(i, { name: e.target.value })}
                    aria-label={`Phase ${i + 1} name`}
                    className="w-full rounded border border-border bg-background px-2 py-1 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={p.durationWeeks}
                    onChange={(e) =>
                      updatePhase(i, {
                        durationWeeks: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    aria-label={`Phase ${i + 1} weeks`}
                    className="w-24 rounded border border-border bg-background px-2 py-1 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  {input.phases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePhase(i)}
                      aria-label={`Remove phase ${p.name}`}
                      className="rounded px-2 py-1 text-xs text-muted-fg hover:bg-muted hover:text-status-bad"
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addPhase}
        className="rounded border border-dashed border-border px-3 py-1.5 text-sm text-muted-fg hover:bg-muted hover:text-foreground"
      >
        + Add phase
      </button>
    </div>
  );
}

function ConfirmStep({
  input,
  hasExisting,
}: {
  input: NewProjectInput;
  hasExisting: boolean;
}) {
  const totalWeeks = input.phases.reduce((acc, p) => acc + p.durationWeeks, 0);
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Ready to create</h2>

      {hasExisting && (
        <div className="rounded-md border border-status-warn/40 bg-status-warn/10 p-3 text-sm">
          <span className="font-medium text-status-warn">Heads up.</span>{' '}
          You already have a project loaded. Creating a new project will
          replace it in this browser. To save the existing one first, cancel
          this wizard and use the Export Center (JSON or XLSX).
        </div>
      )}

      <dl className="grid grid-cols-1 gap-2 rounded-md border border-border bg-muted/10 p-4 text-sm sm:grid-cols-2">
        <SummaryRow label="Project" value={input.name} />
        <SummaryRow label="Client" value={input.client} />
        <SummaryRow label="Currency" value={input.baseCurrency} />
        <SummaryRow label="Engagement" value={engagementLabel(input.engagementType)} />
        <SummaryRow label="Context" value={contextLabel(input.engagementContext)} />
        <SummaryRow label="Target margin" value={`${input.targetMarginPct}%`} />
        <SummaryRow label="Contingency" value={`${input.contingencyPct}%`} />
        <SummaryRow label="Mgmt reserve" value={`${input.managementReservePct}%`} />
        <SummaryRow label="Phases" value={`${input.phases.length} (${totalWeeks} wk)`} />
      </dl>

      <p className="text-xs text-muted-fg">
        Next: you'll land on the Project Setup screen, where the base scenario
        is created empty. Add resources, cloud, and other-cost items from the
        relevant left-rail screens.
      </p>
    </div>
  );
}

function engagementLabel(v: EngagementType): string {
  return ENGAGEMENT_TYPES.find((t) => t.value === v)?.label ?? v;
}
function contextLabel(v: EngagementContext): string {
  return ENGAGEMENT_CONTEXTS.find((c) => c.value === v)?.label ?? v;
}

// -----------------------------------------------------------------
// Small shared UI bits
// -----------------------------------------------------------------

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-fg">
        {label}
        {required && <span className="ml-0.5 text-status-bad">*</span>}
      </span>
      {children}
      {hint && <span className="text-[10px] text-muted-fg/80">{hint}</span>}
    </label>
  );
}

function PctInput({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  max: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0"
        max={max}
        step="0.5"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-24 rounded border border-border bg-background px-2 py-1 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <span className="text-sm text-muted-fg">%</span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-fg">{label}</dt>
      <dd className="font-medium text-foreground">{value || '—'}</dd>
    </div>
  );
}

function formatPriceFromBase(base: number, input: NewProjectInput): string {
  // Mirror the engine's pricing formula at a high level:
  //   totalCost = base * (1 + contingency + reserve)
  //   targetPrice = totalCost / (1 - margin)
  const total =
    base * (1 + input.contingencyPct / 100 + input.managementReservePct / 100);
  const price = total / Math.max(0.001, 1 - input.targetMarginPct / 100);
  return Math.round(price).toLocaleString();
}
