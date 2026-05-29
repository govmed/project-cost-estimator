/**
 * GeographyMixBar - the bottom-left card from the wireframe.
 *
 * Renders the cost mix by geography as a horizontal stacked bar plus a
 * legend with dollar amounts and percentages.
 *
 * Why this matters: offshore percentage is the single most-challenged
 * number in any modernization SOW (per Deliverable #9). Surfacing it
 * prominently in the planner work surface, not just on the Dashboard,
 * lets the user see what they're building as they build it.
 */

import { formatMoney } from '@/ui/format';
import type { Money } from '@/types/money';

interface GeoEntry {
  geography: string;
  cost: Money;
  pct: number;
  swatchClass: string;
}

export interface GeographyMixBarProps {
  byGeography: Record<string, Money>;
}

// Stable color assignment per region. Keys are matched against the
// geography string; first matching prefix wins.
const COLOR_MAP: { match: string; swatch: string }[] = [
  { match: 'US-', swatch: 'bg-blue-600' },
  { match: 'CA-', swatch: 'bg-blue-500' },
  { match: 'EU-', swatch: 'bg-indigo-600' },
  { match: 'UK-', swatch: 'bg-indigo-500' },
  { match: 'LATAM-', swatch: 'bg-amber-500' },
  { match: 'EE-', swatch: 'bg-amber-400' },
  { match: 'India-', swatch: 'bg-emerald-600' },
  { match: 'Philippines-', swatch: 'bg-emerald-500' },
  { match: 'Vietnam-', swatch: 'bg-emerald-400' },
];

function swatchFor(geography: string): string {
  return COLOR_MAP.find((m) => geography.startsWith(m.match))?.swatch ?? 'bg-slate-500';
}

export function GeographyMixBar({ byGeography }: GeographyMixBarProps) {
  const total = Object.values(byGeography).reduce((acc, m) => acc + m.amount, 0);
  if (total === 0) {
    return (
      <div className="rounded-lg border border-border bg-background p-4">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-fg">
          Geography Mix
        </h3>
        <p className="text-sm text-muted-fg">No resources to mix.</p>
      </div>
    );
  }

  const entries: GeoEntry[] = Object.entries(byGeography)
    .map(([geography, cost]) => ({
      geography,
      cost,
      pct: (cost.amount / total) * 100,
      swatchClass: swatchFor(geography),
    }))
    .sort((a, b) => b.cost.amount - a.cost.amount);

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-fg">
        Geography Mix
      </h3>

      {/* Stacked bar */}
      <div className="mb-3 flex h-3 w-full overflow-hidden rounded">
        {entries.map((e) => (
          <div
            key={e.geography}
            className={e.swatchClass}
            style={{ width: `${e.pct}%` }}
            title={`${e.geography}: ${e.pct.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <ul className="space-y-1">
        {entries.map((e) => (
          <li key={e.geography} className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 shrink-0 rounded ${e.swatchClass}`} />
            <span className="flex-1 text-foreground">{e.geography}</span>
            <span className="text-muted-fg tabular-nums">{e.pct.toFixed(1)}%</span>
            <span className="w-20 text-right font-mono tabular-money text-muted-fg">
              {formatMoney(e.cost)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
