/**
 * ScenarioCompareCard - one scenario's column in the Compare grid.
 *
 * Top: scenario name (in a <heading>) + baseline / base badges.
 * Body: metric rows for cost / margin / hours / counts / run-rate.
 * Bottom: View link to switch active and jump to Dashboard.
 *
 * The "primary" card is the baseline for comparison (the first one
 * selected by the user). Its column shows no deltas — other columns
 * show their values relative to it.
 *
 * Deltas use ScenarioMetricRow's direction semantics:
 *  - Cost/Price = goodIfDown
 *  - Margin = goodIfUp
 *  - Hours = neutral
 */

import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import type { Scenario } from '@/types/scenario';
import type { ScenarioTotals } from '@/engine/types';
import { formatMoney, formatPercent } from '@/ui/format';
import { useProjectStore } from '@/data/store';
import { ScenarioMetricRow } from './ScenarioMetricRow';

export interface ScenarioCompareCardProps {
  scenario: Scenario;
  totals: ScenarioTotals | null;
  /** If provided, deltas are computed vs this baseline. */
  baseline?: ScenarioTotals | null;
  /** True when this is the baseline card (first selected). No deltas shown. */
  isPrimary?: boolean;
  /** Project ID for the View navigation. */
  projectId: string;
}

export function ScenarioCompareCard({
  scenario,
  totals,
  baseline,
  isPrimary,
  projectId,
}: ScenarioCompareCardProps) {
  const navigate = useNavigate();
  const setActiveScenario = useProjectStore((s) => s.setActiveScenario);

  function jumpToDashboard() {
    setActiveScenario(scenario.id);
    navigate(`/p/${projectId}/dashboard`);
  }

  const baseForDelta = isPrimary ? null : baseline;

  return (
    <div
      data-testid={`compare-card-${scenario.id}`}
      className={clsx(
        'overflow-hidden rounded-lg border bg-background',
        isPrimary ? 'border-accent/40 ring-1 ring-accent/20' : 'border-border',
      )}
    >
      {/* Header */}
      <div className="border-b border-border bg-muted/30 px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-foreground" title={scenario.name}>
              {scenario.name}
            </h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] uppercase tracking-wide">
              {scenario.isBase && (
                <span className="rounded bg-accent/15 px-1.5 py-0.5 font-medium text-accent">
                  Base
                </span>
              )}
              {isPrimary && !scenario.isBase && (
                <span className="rounded bg-status-good/15 px-1.5 py-0.5 font-medium text-status-good">
                  Baseline (compare)
                </span>
              )}
              {!isPrimary && baseline && (
                <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-muted-fg">
                  vs baseline
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      {!totals ? (
        <div className="px-3 py-6 text-center text-sm text-muted-fg">
          Unable to compute totals for this scenario.
        </div>
      ) : (
        <div>
          <ScenarioMetricRow
            label="Final Price"
            value={formatMoney(totals.finalPrice)}
            numeric={totals.finalPrice.amount}
            baseline={baseForDelta?.finalPrice.amount}
            formatDelta={(d) => formatMoney(d, totals.finalPrice.currency)}
            direction="goodIfDown"
          />
          <ScenarioMetricRow
            label="Total Cost"
            value={formatMoney(totals.totalCost)}
            numeric={totals.totalCost.amount}
            baseline={baseForDelta?.totalCost.amount}
            formatDelta={(d) => formatMoney(d, totals.totalCost.currency)}
            direction="goodIfDown"
          />
          <ScenarioMetricRow
            label="Realized Margin"
            value={formatPercent(totals.realizedMarginPct)}
            numeric={totals.realizedMarginPct}
            baseline={baseForDelta?.realizedMarginPct}
            formatDelta={(d) => `${d.toFixed(1)} pts`}
            direction="goodIfUp"
          />
          <ScenarioMetricRow
            label="Resources Subtotal"
            value={formatMoney(totals.resourcesSubtotal)}
            numeric={totals.resourcesSubtotal.amount}
            baseline={baseForDelta?.resourcesSubtotal.amount}
            formatDelta={(d) => formatMoney(d, totals.resourcesSubtotal.currency)}
            direction="goodIfDown"
            hint={`${scenario.resources.length} resource${scenario.resources.length === 1 ? '' : 's'}`}
          />
          <ScenarioMetricRow
            label="Cloud Subtotal"
            value={formatMoney(totals.cloudSubtotal)}
            numeric={totals.cloudSubtotal.amount}
            baseline={baseForDelta?.cloudSubtotal.amount}
            formatDelta={(d) => formatMoney(d, totals.cloudSubtotal.currency)}
            direction="goodIfDown"
            hint={`${scenario.cloudLineItems.length} cloud line item${scenario.cloudLineItems.length === 1 ? '' : 's'}`}
          />
          <ScenarioMetricRow
            label="Other Costs"
            value={formatMoney(totals.otherCostsSubtotal)}
            numeric={totals.otherCostsSubtotal.amount}
            baseline={baseForDelta?.otherCostsSubtotal.amount}
            formatDelta={(d) => formatMoney(d, totals.otherCostsSubtotal.currency)}
            direction="goodIfDown"
            hint={`${scenario.otherCostLineItems.length} other-cost line item${scenario.otherCostLineItems.length === 1 ? '' : 's'}`}
          />
          <ScenarioMetricRow
            label="Total Hours"
            value={Math.round(totals.totalBillableHours).toLocaleString()}
            numeric={totals.totalBillableHours}
            baseline={baseForDelta?.totalBillableHours}
            formatDelta={(d) => `${Math.round(d).toLocaleString()} hrs`}
            direction="neutral"
          />
          <ScenarioMetricRow
            label="Blended Rate"
            value={`${formatMoney(totals.effectiveBlendedRate)}/hr`}
            numeric={totals.effectiveBlendedRate.amount}
            baseline={baseForDelta?.effectiveBlendedRate.amount}
            formatDelta={(d) => formatMoney(d, totals.effectiveBlendedRate.currency)}
            direction="neutral"
          />
          <ScenarioMetricRow
            label="Run-Rate / month"
            value={formatMoney(totals.runRateMonthly)}
            numeric={totals.runRateMonthly.amount}
            baseline={baseForDelta?.runRateMonthly.amount}
            formatDelta={(d) => formatMoney(d, totals.runRateMonthly.currency)}
            direction="neutral"
            hint="steady-state run-rate"
          />
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border bg-muted/10 px-3 py-2">
        <button
          type="button"
          onClick={jumpToDashboard}
          className="text-xs text-accent hover:underline"
        >
          View dashboard for this scenario →
        </button>
      </div>
    </div>
  );
}
