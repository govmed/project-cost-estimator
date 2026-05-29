/**
 * KpiStrip - the four headline KPIs shown in the top rail.
 *
 * Compact horizontal layout for the chrome (vs. the big cards on the
 * Dashboard). M5d-2: each KPI opens the global defensibility drawer.
 */

import { useScenarioTotals } from '@/hooks/useScenarioTotals';
import { useDefensibilityStore } from '@/data/defensibility-store';
import { formatMoney, formatPercent } from '@/ui/format';
import type { KpiKind } from '@/data/kpi-provenance-types';
import clsx from 'clsx';

export function KpiStrip() {
  const totals = useScenarioTotals();
  const open = useDefensibilityStore((s) => s.open);
  if (!totals) return null;

  const marginColor =
    totals.realizedMarginPct < 0
      ? 'text-status-bad'
      : totals.realizedMarginPct < 15
        ? 'text-status-warn'
        : 'text-status-good';

  return (
    <div className="flex items-center gap-6">
      <Kpi
        label="Price"
        value={formatMoney(totals.finalPrice)}
        kind={{ kind: 'finalPrice' }}
        onOpen={open}
      />
      <Divider />
      <Kpi
        label="Cost"
        value={formatMoney(totals.totalCost)}
        kind={{ kind: 'totalCost' }}
        onOpen={open}
      />
      <Divider />
      <Kpi
        label="Margin"
        value={formatPercent(totals.realizedMarginPct)}
        valueClassName={marginColor}
        kind={{ kind: 'realizedMargin' }}
        onOpen={open}
      />
      <Divider />
      <Kpi
        label="Blended"
        value={`${formatMoney(totals.effectiveBlendedRate)}/hr`}
        kind={{ kind: 'blendedRate' }}
        onOpen={open}
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  valueClassName,
  kind,
  onOpen,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  kind: KpiKind;
  onOpen: (k: KpiKind) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(kind)}
      aria-label={`Show defensibility for top-rail ${label}`}
      className="flex flex-col text-left rounded px-1 -mx-1 hover:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-accent"
    >
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-fg">
        {label}
      </span>
      <span
        className={clsx(
          'font-mono text-sm font-semibold tabular-money',
          valueClassName ?? 'text-foreground',
        )}
      >
        {value}
      </span>
    </button>
  );
}

function Divider() {
  return <div className="h-8 w-px bg-border" />;
}
