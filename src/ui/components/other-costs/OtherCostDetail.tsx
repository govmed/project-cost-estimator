/**
 * OtherCostDetail - the right pane of the Other Costs Planner.
 *
 * All fields editable, same pattern as CloudLineItemDetail.
 */

import type { OtherCostLineItem, OtherCostCategory, PricingUnit } from '@/types/other-costs';
import type { OtherCostLineItemTotals } from '@/engine/types';
import type { Phase } from '@/types/project';
import type { ScenarioId, PhaseId } from '@/types/ids';
import { formatMoney } from '@/ui/format';
import { useProjectStore } from '@/data/store';
import { OtherCostCategoryBadge } from './OtherCostCategoryBadge';
import { EditableField } from '@/ui/components/planner/EditableField';
import { EditableSelect } from '@/ui/components/cloud/EditableSelect';
import { EditableToggle } from '@/ui/components/cloud/EditableToggle';
import { RampCurvePreview } from '@/ui/components/cloud/RampCurvePreview';

const CATEGORIES: readonly OtherCostCategory[] = [
  'SoftwareLicense',
  'SaaSSubscription',
  'Hardware',
  'Endpoint',
  'TravelExpense',
  'Training',
  'KnowledgeTransfer',
  'Subcontractor',
  'PartnerPassthrough',
  'Compliance',
  'Insurance',
  'Other',
] as const;

const PRICING_UNITS: readonly PricingUnit[] = [
  'OneTime',
  'PerMonth',
  'PerYear',
  'PerUser',
  'PerUserPerMonth',
  'PerHour',
] as const;

export interface OtherCostDetailProps {
  item: OtherCostLineItem | null;
  totals: OtherCostLineItemTotals | null;
  phases: Phase[];
  scenarioId: ScenarioId;
}

export function OtherCostDetail({ item, totals, phases, scenarioId }: OtherCostDetailProps) {
  const updateField = useProjectStore((s) => s.updateOtherCostLineItemField);

  if (!item) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 p-8 text-center">
        <p className="text-sm text-muted-fg">
          Select a line item on the left to edit its details and see the burn curve.
        </p>
      </div>
    );
  }

  const commit = (field: Parameters<typeof updateField>[2]) => {
    updateField(scenarioId, item.id, field);
  };

  // Phase select needs a string-keyed option list including "(unassigned)"
  const phaseOptions = ['(unassigned)', ...phases.map((p) => p.name)] as const;
  const currentPhaseLabel = item.phaseId
    ? phases.find((p) => p.id === item.phaseId)?.name ?? '(unassigned)'
    : '(unassigned)';

  return (
    <div className="space-y-6 rounded-lg border border-border bg-background p-5">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <OtherCostCategoryBadge category={item.category} />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{item.name}</h2>
        {item.vendor && (
          <p className="mt-1 text-sm text-muted-fg">{item.vendor}</p>
        )}
      </div>

      <Section title="Identity">
        <EditableField
          label="Name"
          value={item.name}
          kind="text"
          onCommit={(v) => commit({ kind: 'name', value: String(v) })}
        />
        <EditableSelect<OtherCostCategory>
          label="Category"
          value={item.category}
          options={CATEGORIES}
          onCommit={(v) => commit({ kind: 'category', value: v })}
        />
        <EditableField
          label="Vendor"
          value={item.vendor ?? ''}
          kind="text"
          onCommit={(v) => commit({ kind: 'vendor', value: String(v) })}
        />
        <EditableField
          label="Description"
          value={item.description ?? ''}
          kind="text"
          multiline
          onCommit={(v) => commit({ kind: 'description', value: String(v) })}
        />
      </Section>

      <Section title="Pricing">
        <EditableField
          label="Unit Cost"
          value={item.unitCost.amount}
          kind="number"
          min={0}
          prefix="$"
          onCommit={(v) => commit({ kind: 'unitCostAmount', value: Number(v) })}
        />
        <EditableField
          label="Quantity"
          value={item.quantity}
          kind="number"
          min={0}
          onCommit={(v) => commit({ kind: 'quantity', value: Number(v) })}
        />
        <EditableSelect<PricingUnit>
          label="Pricing Unit"
          value={item.pricingUnit}
          options={PRICING_UNITS}
          onCommit={(v) => commit({ kind: 'pricingUnit', value: v })}
        />
        {(item.pricingUnit === 'PerUser' || item.pricingUnit === 'PerUserPerMonth') && (
          <EditableField
            label="User Count"
            value={item.userCount ?? 0}
            kind="number"
            min={0}
            onCommit={(v) => commit({ kind: 'userCount', value: Number(v) })}
          />
        )}
        <EditableField
          label="Markup %"
          value={item.markupPct ?? 0}
          kind="number"
          min={0}
          max={500}
          suffix="%"
          onCommit={(v) => commit({ kind: 'markupPct', value: Number(v) })}
        />
      </Section>

      <Section title="Scope">
        <EditableSelect<string>
          label="Phase"
          value={currentPhaseLabel}
          options={phaseOptions}
          onCommit={(label) => {
            if (label === '(unassigned)') {
              commit({ kind: 'phaseId', value: null });
            } else {
              const phase = phases.find((p) => p.name === label);
              if (phase) commit({ kind: 'phaseId', value: phase.id as PhaseId });
            }
          }}
        />
        <EditableToggle
          label="Include in Run-Rate"
          value={item.includeInRunRate}
          onCommit={(v) => commit({ kind: 'includeInRunRate', value: v })}
          hint={{
            on: 'extends into steady-state Run-Rate',
            off: 'project-only spend',
          }}
        />
      </Section>

      <Section title="Engine output (read-only)">
        {totals ? (
          <>
            <ReadOnlyField label="Total Cost" value={formatMoney(totals.totalCost)} />
            <ReadOnlyField
              label="Run-Rate Monthly"
              value={formatMoney(totals.runRateMonthly)}
              hint={item.includeInRunRate ? 'in run-rate' : 'excluded from run-rate'}
            />
          </>
        ) : (
          <p className="text-sm text-muted-fg">No engine totals available.</p>
        )}
      </Section>

      {totals && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-fg">
            Monthly burn
          </h3>
          <RampCurvePreview monthlyBurn={totals.monthlyBurn} label={`${item.name} monthly burn`} />
        </div>
      )}

      <div className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-muted-fg">
        <span className="font-medium text-foreground">All fields editable.</span> Click any
        value to edit; Enter / Tab to commit, Esc to cancel.
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-fg">{title}</h3>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</dl>
    </div>
  );
}

function ReadOnlyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-fg">{label}</dt>
      <dd className="font-mono tabular-money text-foreground">{value}</dd>
      {hint && <span className="text-[10px] text-muted-fg/80">{hint}</span>}
    </div>
  );
}
