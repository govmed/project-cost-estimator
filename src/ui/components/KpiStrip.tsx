/**
 * KpiStrip - the four headline KPIs shown in the top rail.
 *
 * Compact horizontal layout for the chrome (vs. the big cards on the
 * Dashboard, which come in M4). Each KPI is clickable in a later milestone
 * to open the right-rail defensibility panel; M1b renders them static.
 */

import { useScenarioTotals } from '@/hooks/useScenarioTotals';
import { formatMoney, formatPercent } from '@/ui/format';
import clsx from 'clsx';

export function KpiStrip() {
  const totals = useScenarioTotals();
  if (!totals) return null;

  const marginColor =
    totals.realizedMarginPct < 0
      ? 'text-status-bad'
      : totals.realizedMarginPct < 15
        ? 'text-status-warn'
        : 'text-status-good';

  return (
    <div className="flex items-center gap-6">
      <Kpi label="Price" value={formatMoney(totals.finalPrice)} />
      <Divider />
      <Kpi label="Cost" value={formatMoney(totals.totalCost)} />
      <Divider />
      <Kpi
        label="Margin"
        value={formatPercent(totals.realizedMarginPct)}
        valueClassName={marginColor}
      />
      <Divider />
      <Kpi label="Blended" value={`${formatMoney(totals.effectiveBlendedRate)}/hr`} />
    </div>
  );
}

function Kpi({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col">
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
    </div>
  );
}

function Divider() {
  return <div className="h-8 w-px bg-border" />;
}
