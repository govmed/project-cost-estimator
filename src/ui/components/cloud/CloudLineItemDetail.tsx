/**
 * CloudLineItemDetail - the right pane of the Cloud Planner.
 *
 * M3b: all fields are now editable. Commits go through the store via
 * updateCloudLineItemField; each writes an audit entry.
 *
 * Computed fields (effective unit cost, monthly at steady state) update
 * live as you edit inputs - they're derived from useScenarioTotals.
 */

import type { CloudLineItem, CloudCategory, PricingModel, Environment, RampCurve } from '@/types/cloud';
import type { CloudLineItemTotals } from '@/engine/types';
import type { ScenarioId } from '@/types/ids';
import { formatMoney } from '@/ui/format';
import { useProjectStore } from '@/data/store';
import { CloudProviderBadge } from './CloudProviderBadge';
import { RampCurvePreview } from './RampCurvePreview';
import { EditableField } from '@/ui/components/planner/EditableField';
import { EditableSelect } from './EditableSelect';
import { EditableToggle } from './EditableToggle';

const PRICING_MODELS: readonly PricingModel[] = [
  'OnDemand',
  'Reserved1yr',
  'Reserved3yr',
  'SavingsPlan1yr',
  'SavingsPlan3yr',
  'Spot',
  'BringYourOwn',
] as const;

const ENVIRONMENTS: readonly Environment[] = ['dev', 'test', 'staging', 'prod', 'dr'] as const;

const CATEGORIES: readonly CloudCategory[] = [
  'Compute',
  'Storage',
  'Database',
  'Networking',
  'Security',
  'Integration',
  'Observability',
  'AI/ML',
  'Backup/DR',
  'Other',
] as const;

const RAMP_CURVES: readonly RampCurve[] = [
  'flat',
  'linear',
  'sCurve',
  'step',
  'frontLoaded',
  'backLoaded',
] as const;

export interface CloudLineItemDetailProps {
  item: CloudLineItem | null;
  totals: CloudLineItemTotals | null;
  scenarioId: ScenarioId;
}

export function CloudLineItemDetail({ item, totals, scenarioId }: CloudLineItemDetailProps) {
  const updateField = useProjectStore((s) => s.updateCloudLineItemField);

  if (!item) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 p-8 text-center">
        <p className="text-sm text-muted-fg">
          Select a line item on the left to see its details and ramp curve.
        </p>
      </div>
    );
  }

  const commit = (field: Parameters<typeof updateField>[2]) => {
    updateField(scenarioId, item.id, field);
  };

  const effectiveUnitCost = item.unitCost.amount * item.environmentMultiplier;
  const monthlyAtSteady = effectiveUnitCost * item.quantity;

  return (
    <div className="space-y-6 rounded-lg border border-border bg-background p-5">
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <CloudProviderBadge provider={item.provider} />
          <span className="text-xs uppercase tracking-wide text-muted-fg">{item.category}</span>
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          {item.service}
          {item.sku && (
            <span className="ml-2 font-mono text-sm font-normal text-muted-fg">{item.sku}</span>
          )}
        </h2>
      </div>

      {/* Identity */}
      <Section title="Identity">
        <EditableField
          label="Service"
          value={item.service}
          kind="text"
          onCommit={(v) => commit({ kind: 'service', value: String(v) })}
        />
        <EditableField
          label="SKU"
          value={item.sku ?? ''}
          kind="text"
          onCommit={(v) => commit({ kind: 'sku', value: String(v) })}
        />
        <EditableSelect<CloudCategory>
          label="Category"
          value={item.category}
          options={CATEGORIES}
          onCommit={(v) => commit({ kind: 'category', value: v })}
        />
        <EditableField
          label="Description"
          value={item.description ?? ''}
          kind="text"
          multiline
          onCommit={(v) => commit({ kind: 'description', value: String(v) })}
        />
      </Section>

      {/* Pricing */}
      <Section title="Pricing">
        <EditableSelect<PricingModel>
          label="Pricing Model"
          value={item.pricingModel}
          options={PRICING_MODELS}
          onCommit={(v) => commit({ kind: 'pricingModel', value: v })}
        />
        <EditableField
          label="Region"
          value={item.region}
          kind="text"
          onCommit={(v) => commit({ kind: 'region', value: String(v) })}
        />
        <div className="flex flex-col gap-1">
          <EditableField
            label={`Unit Cost ${item.unitCostOverridden ? '(edited)' : ''}`}
            value={item.unitCost.amount}
            kind="number"
            min={0}
            prefix="$"
            suffix={` / ${item.unitName}`}
            onCommit={(v) => commit({ kind: 'unitCostAmount', value: Number(v) })}
          />
          {item.unitCostOverridden && (
            <span className="text-[10px] font-medium uppercase tracking-wide text-status-warn">
              edited (off catalog)
            </span>
          )}
        </div>
        <EditableField
          label="Quantity"
          value={item.quantity}
          kind="number"
          min={0}
          onCommit={(v) => commit({ kind: 'quantity', value: Number(v) })}
        />
        <EditableField
          label="Unit Name"
          value={item.unitName}
          kind="text"
          onCommit={(v) => commit({ kind: 'unitName', value: String(v) })}
        />
      </Section>

      {/* Environment */}
      <Section title="Environment">
        <EditableSelect<Environment>
          label="Environment"
          value={item.environment}
          options={ENVIRONMENTS}
          onCommit={(v) => commit({ kind: 'environment', value: v })}
        />
        <EditableField
          label="Env Multiplier"
          value={item.environmentMultiplier}
          kind="number"
          min={0}
          onCommit={(v) => commit({ kind: 'environmentMultiplier', value: Number(v) })}
        />
        <EditableToggle
          label="Include in Run-Rate"
          value={item.includeInRunRate}
          onCommit={(v) => commit({ kind: 'includeInRunRate', value: v })}
          hint={{
            on: 'extends into steady-state Run-Rate projections',
            off: 'project-only spend; not in Run-Rate',
          }}
        />
      </Section>

      {/* Engine output */}
      <Section title="Engine output (read-only)">
        <ReadOnlyField
          label="Effective Unit Cost"
          value={`${formatMoney(effectiveUnitCost, item.unitCost.currency)} / ${item.unitName}`}
          hint="unitCost x envMultiplier"
        />
        <ReadOnlyField
          label="Monthly at Steady State"
          value={formatMoney(monthlyAtSteady, item.unitCost.currency)}
          hint="effective x quantity"
        />
        {totals && (
          <>
            <ReadOnlyField
              label="Project Duration Cost"
              value={formatMoney(totals.projectDurationCost)}
            />
            <ReadOnlyField
              label="Run-Rate Monthly"
              value={formatMoney(totals.runRateMonthly)}
              hint={item.includeInRunRate ? 'in run-rate' : 'excluded from run-rate'}
            />
          </>
        )}
      </Section>

      {/* Ramp */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-fg">
            Ramp curve
          </h3>
        </div>
        <div className="mb-3 max-w-xs">
          <EditableSelect<RampCurve>
            label="Curve shape"
            value={item.rampCurve}
            options={RAMP_CURVES}
            onCommit={(v) => commit({ kind: 'rampCurve', value: v })}
          />
        </div>
        {totals ? (
          <RampCurvePreview monthlyBurn={totals.monthlyBurn} label={`${item.service} monthly burn`} />
        ) : (
          <p className="text-sm text-muted-fg">No engine totals available.</p>
        )}
      </div>

      <div className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-muted-fg">
        <span className="font-medium text-foreground">All fields editable.</span> Click any
        value to edit; Enter / Tab to commit, Esc to cancel. The detail and the engine
        totals re-render on every commit.
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
