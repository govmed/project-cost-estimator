/**
 * BreakdownBars - a small horizontal-bar list visualization.
 *
 * Used for By Geography / By Cloud Provider / By Cloud Category panels.
 * The bar length encodes share of the largest value; the absolute number
 * stays as a formatted label on the right.
 *
 * This is not a Recharts component - it's a small SVG-free CSS bar so the
 * dashboard stays light and these tiny lists don't need a full chart engine.
 */

import type { CurrencyCode, Money } from '@/types/money';
import { formatMoney } from '@/ui/format';

export interface BreakdownEntry {
  label: string;
  value: Money;
}

export interface BreakdownBarsProps {
  entries: BreakdownEntry[];
  currency: CurrencyCode;
  /** Color class to apply to the bars (Tailwind). */
  barColorClass?: string;
}

export function BreakdownBars({
  entries,
  currency,
  barColorClass = 'bg-accent',
}: BreakdownBarsProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-fg">No data.</p>;
  }

  // Sort by value descending, then compute relative widths
  const sorted = [...entries].sort((a, b) => b.value.amount - a.value.amount);
  const max = sorted[0].value.amount;
  const total = sorted.reduce((acc, e) => acc + e.value.amount, 0);

  return (
    <ul className="space-y-2">
      {sorted.map((e) => {
        const widthPct = max > 0 ? (e.value.amount / max) * 100 : 0;
        const sharePct = total > 0 ? (e.value.amount / total) * 100 : 0;
        return (
          <li key={e.label} className="text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-foreground" title={e.label}>
                {e.label}
              </span>
              <span className="shrink-0 font-mono tabular-money text-muted-fg">
                {formatMoney(e.value)}{' '}
                <span className="text-[10px] text-muted-fg/70">
                  ({sharePct.toFixed(0)}%)
                </span>
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-sm bg-muted/40">
              <div
                className={`h-full ${barColorClass}`}
                style={{ width: `${widthPct}%` }}
                aria-hidden
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// Helper to convert Record<string, Money> -> entries
export function entriesFromBreakdown(
  breakdown: Record<string, Money>,
): BreakdownEntry[] {
  return Object.entries(breakdown).map(([label, value]) => ({ label, value }));
}
