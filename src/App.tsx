/**
 * App - the M1a shell.
 *
 * What it does:
 *  - Loads the seed scenario into the store on first mount
 *  - Renders the project name + the four headline KPIs from calculate()
 *  - Confirms the engine produces real numbers in a real browser
 *
 * What it deliberately doesn't do:
 *  - Routing (M1b)
 *  - Top rail with scenario chooser (M1b)
 *  - Left rail with navigation (M1b)
 *  - Right rail defensibility panel (M1c)
 *  - Any editing
 *
 * This is the "toolchain works" milestone, not the "chrome looks right"
 * milestone. The visual is intentionally plain so the focus is on proving
 * the pipeline.
 */

import { useEffect, useMemo } from 'react';
import { useProjectStore, selectActiveScenario } from '@/data/store';
import { loadSeed } from '@/data/seed-loader';
import { calculate } from '@/engine/calculate';
import { formatMoney, formatPercent } from './ui/format';

export function App() {
  const project = useProjectStore((s) => s.project);
  const scenarios = useProjectStore((s) => s.scenarios);
  const activeScenarioId = useProjectStore((s) => s.activeScenarioId);
  const setProject = useProjectStore((s) => s.setProject);

  // Load seed on first mount if nothing in the store yet.
  useEffect(() => {
    if (!project) {
      const seed = loadSeed();
      setProject(seed.project, seed.scenarios);
    }
  }, [project, setProject]);

  const activeScenario = useMemo(
    () => selectActiveScenario({ scenarios, activeScenarioId }),
    [scenarios, activeScenarioId],
  );

  const totals = useMemo(() => {
    if (!project || !activeScenario) return null;
    return calculate(project, activeScenario);
  }, [project, activeScenario]);

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-fg">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{project.name}</h1>
              <p className="text-sm text-muted-fg">
                {project.client} · v{project.version} ·{' '}
                <span className="uppercase">{project.status}</span>
              </p>
            </div>
            {activeScenario && (
              <div className="text-sm text-muted-fg">
                Scenario: <span className="font-medium text-foreground">{activeScenario.name}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {totals ? (
          <section>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-fg">
              Headline KPIs
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Final Price" value={formatMoney(totals.finalPrice)} />
              <KpiCard label="Total Cost" value={formatMoney(totals.totalCost)} />
              <KpiCard
                label="Realized Margin"
                value={formatPercent(totals.realizedMarginPct)}
              />
              <KpiCard
                label="Blended Rate"
                value={`${formatMoney(totals.effectiveBlendedRate)}/hr`}
              />
            </div>

            <div className="mt-8 rounded-lg border border-border bg-muted/20 p-6">
              <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-fg">
                Foundation proof
              </h3>
              <p className="text-sm text-foreground">
                These four numbers are computed by the same pure-TypeScript engine
                that the 43 unit tests validate. Open the browser DevTools console,
                run <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">localStorage</code>{' '}
                — your project is persisted there. Reload the page; the data and
                numbers survive.
              </p>
              <p className="mt-2 text-sm text-muted-fg">
                M1b adds the top rail, left rail, and routing. M1c adds the
                right-rail defensibility panel and scenario switching.
              </p>
            </div>
          </section>
        ) : (
          <p className="text-muted-fg">No active scenario.</p>
        )}
      </main>
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
}

function KpiCard({ label, value }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-fg">
        {label}
      </div>
      <div className="mt-2 font-mono text-kpi-sm tabular-money text-foreground">
        {value}
      </div>
    </div>
  );
}
