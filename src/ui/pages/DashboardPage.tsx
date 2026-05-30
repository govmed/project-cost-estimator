/**
 * DashboardPage - the landing screen.
 *
 * M4c upgrades the dashboard from KPI tiles + flat breakdown lists to
 * KPI tiles + four visualizations:
 *
 *  1. Monthly Burn Curve (stacked area + cumulative line)
 *  2. Headcount Over Time (line)
 *  3. Cost Stack by Phase (horizontal stacked bar)
 *  4. Three small breakdown panels (by Geography / Provider / Category)
 *     using lightweight CSS bars (BreakdownBars).
 *
 * All data is engine output, computed via useScenarioTotals() — no
 * separate state, no DB. Changing any input (resource, cloud, other-cost,
 * phase, FX rate) flows through the store + engine and updates every
 * chart on this page immediately.
 */

import { useProjectStore } from '@/data/store';
import { useScenarioTotals } from '@/hooks/useScenarioTotals';
import { useDefensibilityStore } from '@/data/defensibility-store';
import { formatMoney, formatPercent } from '@/ui/format';
import { MonthlyBurnChart } from '@/ui/components/dashboard/MonthlyBurnChart';
import { HeadcountChart } from '@/ui/components/dashboard/HeadcountChart';
import { CostByPhaseChart } from '@/ui/components/dashboard/CostByPhaseChart';
import {
  BreakdownBars,
  entriesFromBreakdown,
} from '@/ui/components/dashboard/BreakdownBars';
import { WelcomeCoachmark, useCoachmarkDismissed } from '@/ui/components/Coachmark';

export function DashboardPage() {
  const project = useProjectStore((s) => s.project);
  const totals = useScenarioTotals();
  const openDefensibility = useDefensibilityStore((s) => s.open);
  const { dismissed, dismiss } = useCoachmarkDismissed();

  if (!project || !totals) {
    return <div className="px-8 py-12 text-muted-fg">No active scenario.</div>;
  }

  const currency = totals.finalPrice.currency;

  return (
    <div className="mx-auto max-w-7xl px-6 py-6 space-y-8">
      {!dismissed && <WelcomeCoachmark onDismiss={dismiss} />}

      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-fg">
          Live engine output for the active scenario. Edit anything in
          Resources, Cloud, Other Costs, or Project Setup and these charts
          update immediately. Click any headline KPI to see what's behind it.
        </p>
      </div>

      {/* KPI tiles - all four now open the defensibility drawer */}
      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-fg">
          Headline KPIs
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BigKpi
            label="Final Price"
            value={formatMoney(totals.finalPrice)}
            onClick={() => openDefensibility({ kind: 'finalPrice' })}
          />
          <BigKpi
            label="Total Cost"
            value={formatMoney(totals.totalCost)}
            onClick={() => openDefensibility({ kind: 'totalCost' })}
          />
          <BigKpi
            label="Realized Margin"
            value={formatPercent(totals.realizedMarginPct)}
            onClick={() => openDefensibility({ kind: 'realizedMargin' })}
          />
          <BigKpi
            label="Blended Rate"
            value={`${formatMoney(totals.effectiveBlendedRate)}/hr`}
            sub={`${Math.round(totals.totalBillableHours).toLocaleString()} hours`}
            onClick={() => openDefensibility({ kind: 'blendedRate' })}
          />
        </div>
      </section>

      {/* Monthly burn + Headcount */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Monthly Burn Curve" subtitle={`${totals.burnCurve.length} months · cumulative on right axis`}>
          <MonthlyBurnChart burnCurve={totals.burnCurve} currency={currency} />
        </Panel>
        <Panel title="Headcount Over Time" subtitle={`${totals.headcountCurve.length} months · peak shown as dashed line`}>
          <HeadcountChart headcountCurve={totals.headcountCurve} />
        </Panel>
      </section>

      {/* Cost by phase */}
      <section>
        <Panel title="Cost Stack by Phase" subtitle={`${totals.byPhase.length} phases · stacked by category`}>
          <CostByPhaseChart byPhase={totals.byPhase} currency={currency} />
        </Panel>
      </section>

      {/* Three small breakdowns */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="By Geography" subtitle="resource cost share">
          <BreakdownBars
            entries={entriesFromBreakdown(totals.byGeography)}
            currency={currency}
            barColorClass="bg-[#6366f1]"
          />
        </Panel>
        <Panel title="By Cloud Provider" subtitle="cloud cost share">
          <BreakdownBars
            entries={entriesFromBreakdown(totals.byCloudProvider).map((e) => ({
              ...e,
              label: e.label.toUpperCase(),
            }))}
            currency={currency}
            barColorClass="bg-[#0ea5e9]"
          />
        </Panel>
        <Panel title="By Cloud Category" subtitle="cloud cost share">
          <BreakdownBars
            entries={entriesFromBreakdown(totals.byCloudCategory)}
            currency={currency}
            barColorClass="bg-[#06b6d4]"
          />
        </Panel>
      </section>

      {/* Run-Rate panel */}
      <section>
        <Panel title="Run-Rate (after go-live)" subtitle="steady-state operational cost">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <RunRateCell label="Monthly" value={formatMoney(totals.runRateMonthly)} />
            <RunRateCell label="Year 1" value={formatMoney(totals.runRateYear1)} />
            <RunRateCell label="Year 2" value={formatMoney(totals.runRateYear2)} />
            <RunRateCell label="Year 3" value={formatMoney(totals.runRateYear3)} />
          </div>
        </Panel>
      </section>

      <p className="text-xs text-muted-fg">
        Charts powered by <span className="font-mono">recharts ^3.8.1</span>.
        Engine recomputes on every change to project, scenario, or any line item.
      </p>
    </div>
  );
}

function BigKpi({
  label,
  value,
  sub,
  onClick,
}: {
  label: string;
  value: string;
  sub?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-fg">
        {label}
      </div>
      <div className="mt-2 font-mono text-kpi-sm tabular-money">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-fg">{sub}</div>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Show defensibility for ${label}`}
        className="rounded-lg border border-border bg-background p-5 text-left transition-colors hover:border-accent/60 hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {body}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background p-5">{body}</div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-fg">
          {title}
        </h3>
        {subtitle && <span className="text-[10px] text-muted-fg/70">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function RunRateCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-muted/20 p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-fg">{label}</div>
      <div className="mt-1 font-mono text-base tabular-money">{value}</div>
    </div>
  );
}
