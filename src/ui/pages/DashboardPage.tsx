/**
 * DashboardPage - the landing screen.
 *
 * M1b: shows the big KPI cards (carried over from the M1a proof page) plus
 * a few summary breakdowns from the engine, so the default route has real
 * content. The full dashboard (burn chart, by-phase / by-geography tables,
 * etc.) lands in M4.
 */

import { useScenarioTotals } from '@/hooks/useScenarioTotals';
import { formatMoney, formatPercent } from '@/ui/format';

export function DashboardPage() {
  const totals = useScenarioTotals();

  if (!totals) {
    return (
      <div className="px-8 py-12 text-muted-fg">No active scenario.</div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-fg">
          Headline KPIs
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BigKpi label="Final Price" value={formatMoney(totals.finalPrice)} />
          <BigKpi label="Total Cost" value={formatMoney(totals.totalCost)} />
          <BigKpi label="Realized Margin" value={formatPercent(totals.realizedMarginPct)} />
          <BigKpi
            label="Blended Rate"
            value={`${formatMoney(totals.effectiveBlendedRate)}/hr`}
            sub={`${Math.round(totals.totalBillableHours).toLocaleString()} hours`}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="By Geography">
          <BreakdownList
            entries={Object.entries(totals.byGeography).map(([k, v]) => ({
              label: k,
              value: formatMoney(v),
            }))}
          />
        </Panel>

        <Panel title="By Cloud Provider">
          <BreakdownList
            entries={Object.entries(totals.byCloudProvider).map(([k, v]) => ({
              label: k.toUpperCase(),
              value: formatMoney(v),
            }))}
          />
        </Panel>

        <Panel title="By Phase">
          <BreakdownList
            entries={totals.byPhase.map((p) => ({
              label: p.phaseName,
              value: formatMoney(p.totalCost),
            }))}
          />
        </Panel>

        <Panel title="Run-Rate (after go-live)">
          <BreakdownList
            entries={[
              { label: 'Monthly', value: formatMoney(totals.runRateMonthly) },
              { label: 'Annual (Y1)', value: formatMoney(totals.runRateYear1) },
            ]}
          />
        </Panel>
      </div>

      <p className="mt-8 text-xs text-muted-fg">
        The full dashboard — monthly burn chart, headcount curve, top
        assumptions — lands in M4. These breakdowns are live engine output.
      </p>
    </div>
  );
}

function BigKpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-fg">
        {label}
      </div>
      <div className="mt-2 font-mono text-kpi-sm tabular-money">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-fg">{sub}</div>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-fg">
        {title}
      </h3>
      {children}
    </div>
  );
}

function BreakdownList({ entries }: { entries: { label: string; value: string }[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-fg">No data.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {entries.map((e) => (
        <li key={e.label} className="flex items-center justify-between text-sm">
          <span className="text-foreground">{e.label}</span>
          <span className="font-mono tabular-money text-muted-fg">{e.value}</span>
        </li>
      ))}
    </ul>
  );
}
