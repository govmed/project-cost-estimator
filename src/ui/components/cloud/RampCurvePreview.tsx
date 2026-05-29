/**
 * RampCurvePreview - inline bar chart of a cloud line item's monthly burn.
 *
 * Renders the per-month spend as a horizontal row of small bars, each
 * scaled to the max month. Pure CSS - no chart library dependency yet.
 *
 * Phase boundaries are shown as faint vertical lines underneath via the
 * phaseBoundaries array. M3a renders the bars; phase overlay is a small
 * polish item that can land alongside Recharts in a later milestone.
 */

import { useMemo } from 'react';
import type { Money } from '@/types/money';
import { formatMoney } from '@/ui/format';

export interface RampCurvePreviewProps {
  monthlyBurn: Money[];
  /** Label below the chart, e.g. "monthly burn over 14 months". */
  label?: string;
}

export function RampCurvePreview({ monthlyBurn, label }: RampCurvePreviewProps) {
  const { max, total, nonZeroCount } = useMemo(() => {
    let max = 0;
    let total = 0;
    let nonZero = 0;
    for (const m of monthlyBurn) {
      total += m.amount;
      if (m.amount > max) max = m.amount;
      if (m.amount > 0) nonZero++;
    }
    return { max, total, nonZeroCount: nonZero };
  }, [monthlyBurn]);

  if (monthlyBurn.length === 0) {
    return <p className="text-sm text-muted-fg">No burn data.</p>;
  }
  if (max === 0) {
    return <p className="text-sm text-muted-fg">No spend across project months.</p>;
  }

  return (
    <div className="space-y-2">
      <div
        className="flex h-16 items-end gap-px rounded bg-muted/30 p-1"
        role="img"
        aria-label={
          label ??
          `Monthly burn curve over ${monthlyBurn.length} months, peak ${formatMoney(max, monthlyBurn[0]?.currency ?? 'USD')}`
        }
      >
        {monthlyBurn.map((m, i) => {
          const pct = max > 0 ? (m.amount / max) * 100 : 0;
          return (
            <div
              key={i}
              className="flex-1 rounded-sm bg-accent/60 transition-colors hover:bg-accent"
              style={{ height: `${Math.max(pct, m.amount > 0 ? 3 : 0)}%` }}
              title={`Month ${i + 1}: ${formatMoney(m)}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-fg">
        <span>{nonZeroCount} of {monthlyBurn.length} months active</span>
        <span className="font-mono tabular-money">
          Peak {formatMoney(max, monthlyBurn[0]?.currency ?? 'USD')} · Total{' '}
          {formatMoney(total, monthlyBurn[0]?.currency ?? 'USD')}
        </span>
      </div>
    </div>
  );
}
