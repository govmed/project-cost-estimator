/**
 * CloudLineItemDetail - the right pane of the Cloud Planner.
 *
 * Read-only details for the selected line item. M3a renders all fields
 * as static text; M3b will make each editable using the same
 * EditableField pattern as the resource expanded row.
 */

import type { CloudLineItem } from '@/types/cloud';
import type { CloudLineItemTotals } from '@/engine/types';
import { formatMoney } from '@/ui/format';
import { CloudProviderBadge } from './CloudProviderBadge';
import { RampCurvePreview } from './RampCurvePreview';

export interface CloudLineItemDetailProps {
  item: CloudLineItem | null;
  totals: CloudLineItemTotals | null;
}

export function CloudLineItemDetail({ item, totals }: CloudLineItemDetailProps) {
  if (!item) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 p-8 text-center">
        <p className="text-sm text-muted-fg">
          Select a line item on the left to see its details and ramp curve.
        </p>
      </div>
    );
  }

  // Effective unit cost after environment multiplier
  const effectiveUnitCost = item.unitCost.amount * item.environmentMultiplier;
  const monthlyAtSteady = effectiveUnitCost * item.quantity;

  return (
    <div className="space-y-6 rounded-lg border border-border bg-background p-5">
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <CloudProviderBadge provider={item.provider} />
          <span className="text-xs uppercase tracking-wide text-muted-fg">
            {item.category}
          </span>
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          {item.service}
          {item.sku && (
            <span className="ml-2 font-mono text-sm font-normal text-muted-fg">
              {item.sku}
            </span>
          )}
        </h2>
        {item.description && (
          <p className="mt-1 text-sm text-muted-fg">{item.description}</p>
        )}
      </div>

      {/* Pricing block */}
      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-fg">
          Pricing
        </h3>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Pricing Model" value={item.pricingModel} mono={false} />
          <Field label="Region" value={item.region} mono={true} />
          <Field
            label="Unit Cost"
            value={`${formatMoney(item.unitCost)} / ${item.unitName}`}
            mono
            override={item.unitCostOverridden ? 'edited' : undefined}
          />
          <Field label="Quantity" value={item.quantity.toString()} mono />
          <Field label="Environment" value={item.environment} mono={false} />
          <Field
            label="Env Multiplier"
            value={item.environmentMultiplier.toFixed(2)}
            mono
          />
        </dl>
      </div>

      {/* Computed totals */}
      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-fg">
          Engine output
        </h3>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Field
            label="Effective Unit Cost"
            value={`${formatMoney(effectiveUnitCost, item.unitCost.currency)} / ${item.unitName}`}
            mono
            hint="unitCost × envMultiplier"
          />
          <Field
            label="Monthly at Steady State"
            value={formatMoney(monthlyAtSteady, item.unitCost.currency)}
            mono
            hint="effective × quantity"
          />
          {totals && (
            <>
              <Field
                label="Project Duration Cost"
                value={formatMoney(totals.projectDurationCost)}
                mono
              />
              <Field
                label="Run-Rate Monthly"
                value={formatMoney(totals.runRateMonthly)}
                mono
                hint={
                  item.includeInRunRate
                    ? 'in run-rate'
                    : 'excluded from run-rate'
                }
              />
            </>
          )}
        </dl>
      </div>

      {/* Ramp curve */}
      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-fg">
          Ramp curve ({item.rampCurve})
        </h3>
        {totals ? (
          <RampCurvePreview
            monthlyBurn={totals.monthlyBurn}
            label={`${item.service} monthly burn`}
          />
        ) : (
          <p className="text-sm text-muted-fg">No engine totals available.</p>
        )}
      </div>

      {/* M3a footer note */}
      <div className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-muted-fg">
        <span className="font-medium text-foreground">M3a is read-only.</span>{' '}
        Editing these fields lands in M3b along with the "+ Add from catalog" flow.
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  mono?: boolean;
  hint?: string;
  override?: string;
}

function Field({ label, value, mono = false, hint, override }: FieldProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-fg">
        {label}
        {override && (
          <span className="ml-1 text-status-warn">({override})</span>
        )}
      </dt>
      <dd className={mono ? 'font-mono tabular-money text-foreground' : 'text-foreground'}>
        {value}
      </dd>
      {hint && <span className="text-[10px] text-muted-fg/80">{hint}</span>}
    </div>
  );
}
