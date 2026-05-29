/**
 * OverlayImpactSummary - shows the engine-computed overlay totals for the
 * currently configured maData.
 *
 * Layout: a small grid of headline metrics (one-time cost, recurring cost,
 * realized synergy, net impact), the timeline horizon, and the breakeven
 * month if applicable. Below that, a compact month-by-month table for
 * the first ~24 months (truncated for very long timelines).
 *
 * This deliberately doesn't render a chart. A burn-curve chart for the
 * overlay is a small follow-up that needs Recharts; for M4d we keep the
 * surface text-and-numbers so the page stays light and renders even
 * without the dashboard chunk.
 */

import type { MAOverlayTotals } from '@/engine/ma-overlay';
import { formatMoney } from '@/ui/format';

export interface OverlayImpactSummaryProps {
  overlay: MAOverlayTotals;
}

export function OverlayImpactSummary({ overlay }: OverlayImpactSummaryProps) {
  const isIntegration = overlay.mode === 'Integration';
  const isTSA = overlay.mode === 'TSA';

  return (
    <div className="space-y-4" data-testid="overlay-impact-summary">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-fg">
        Impact Summary
      </h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile
          label="One-time"
          value={formatMoney(overlay.oneTimeCost)}
          hint={overlay.mode === 'CarveOut' ? 'stand-up extra' : isIntegration ? 'integration cost' : '—'}
        />
        <Tile
          label="Recurring"
          value={formatMoney(overlay.recurringCost)}
          hint={isTSA ? `over ${overlay.timelineMonths}mo TSA` : 'Y1 dis-synergies'}
        />
        {isIntegration && (
          <Tile
            label="Realized synergy"
            value={formatMoney(overlay.realizedSynergy)}
            hint={`over ${overlay.timelineMonths}mo`}
            positive
          />
        )}
        <Tile
          label="Net impact"
          value={formatMoney(overlay.netImpact)}
          hint={overlay.netImpact.amount > 0 ? 'net cost' : 'net benefit'}
          negative={overlay.netImpact.amount > 0}
          positive={overlay.netImpact.amount <= 0 && isIntegration}
        />
      </div>

      {isIntegration && (
        <div className="rounded-md border border-border bg-muted/10 px-3 py-2 text-sm">
          {overlay.breakevenMonthIndex !== null ? (
            <>
              <span className="font-medium text-status-good">Breakeven reached</span>
              {' '}at month <span className="font-mono">{overlay.breakevenMonthIndex + 1}</span>
              {' '}— after this, realized synergy exceeds the one-time integration cost.
            </>
          ) : (
            <>
              <span className="font-medium text-status-warn">No breakeven</span>
              {' '}within the {overlay.timelineMonths}-month horizon at these inputs.
            </>
          )}
        </div>
      )}

      <div>
        <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-fg">
          Monthly projection (first 24 months)
        </h4>
        {overlay.monthly.length === 0 ? (
          <p className="text-sm text-muted-fg">
            No timeline data — populate the base scenario's run-rate first.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/30 text-muted-fg">
                <tr>
                  <th className="px-2 py-1.5 text-left">Month</th>
                  <th className="px-2 py-1.5 text-right">Cost</th>
                  {isIntegration && (
                    <th className="px-2 py-1.5 text-right">Synergy</th>
                  )}
                  <th className="px-2 py-1.5 text-right">Net</th>
                  <th className="px-2 py-1.5 text-right">Cumulative Net</th>
                </tr>
              </thead>
              <tbody>
                {overlay.monthly.slice(0, 24).map((m) => (
                  <tr key={m.monthIndex} className="border-t border-border/60">
                    <td className="px-2 py-1.5 font-mono">M{m.monthIndex + 1}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-money">
                      {m.cost.amount > 0 ? formatMoney(m.cost) : '—'}
                    </td>
                    {isIntegration && (
                      <td className="px-2 py-1.5 text-right font-mono tabular-money text-status-good">
                        {m.synergy.amount > 0 ? formatMoney(m.synergy) : '—'}
                      </td>
                    )}
                    <td className="px-2 py-1.5 text-right font-mono tabular-money">
                      {formatMoney(m.netImpact)}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-money">
                      {formatMoney(m.cumulativeNet)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {overlay.monthly.length > 24 && (
              <div className="border-t border-border bg-muted/10 px-2 py-1 text-[10px] text-muted-fg">
                Truncated to 24 months. Full timeline: {overlay.monthly.length} months.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  hint,
  positive,
  negative,
}: {
  label: string;
  value: string;
  hint?: string;
  positive?: boolean;
  negative?: boolean;
}) {
  const valueClass = positive
    ? 'text-status-good'
    : negative
    ? 'text-status-bad'
    : 'text-foreground';
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-fg">
        {label}
      </div>
      <div className={`mt-1 font-mono text-base tabular-money ${valueClass}`}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[10px] text-muted-fg/70">{hint}</div>}
    </div>
  );
}
