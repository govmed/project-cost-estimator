/**
 * ResourcePlannerPage - M2b.
 *
 * Read-only became editable: phase % cells edit inline, expand a row to
 * edit name / rates / hours / utilization. Every edit:
 *  - Updates the store immutably
 *  - Bumps Project.updatedAt
 *  - Writes an audit entry (queued; M5 will render the Audit Log screen)
 *  - Triggers a re-render that flows through useScenarioTotals,
 *    updating per-row totals, the footer, the top-rail KPIs, and
 *    the geography mix card
 *
 * M2c will add: + Add resource flow, delete/duplicate, filter chips,
 * search, guardrails strip.
 */

import { useMemo } from 'react';
import { useProjectStore, selectActiveScenario } from '@/data/store';
import { useScenarioTotals } from '@/hooks/useScenarioTotals';
import { buildResourceRows } from '@/ui/components/planner/build-rows';
import { ResourceTable } from '@/ui/components/planner/ResourceTable';
import { GeographyMixBar } from '@/ui/components/planner/GeographyMixBar';

export function ResourcePlannerPage() {
  const project = useProjectStore((s) => s.project);
  const scenarios = useProjectStore((s) => s.scenarios);
  const activeScenarioId = useProjectStore((s) => s.activeScenarioId);
  const totals = useScenarioTotals();

  const activeScenario = useMemo(
    () => selectActiveScenario({ scenarios, activeScenarioId }),
    [scenarios, activeScenarioId],
  );

  const rows = useMemo(() => {
    if (!project || !activeScenario || !totals) return [];
    return buildResourceRows(activeScenario.resources, project.phases, totals.resources);
  }, [project, activeScenario, totals]);

  const totalsFooter = useMemo(() => {
    const hours = rows.reduce((acc, r) => acc + r.totals.totalHours, 0);
    const billed = rows.reduce((acc, r) => acc + r.totals.billedAmount.amount, 0);
    const cost = rows.reduce((acc, r) => acc + r.totals.internalCost.amount, 0);
    const marginPct = billed > 0 ? ((billed - cost) / billed) * 100 : 0;
    return { hours, billed, cost, marginPct };
  }, [rows]);

  if (!project || !activeScenario || !totals) {
    return <div className="px-8 py-12 text-muted-fg">No active scenario.</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Resource Planner</h1>
          <p className="text-sm text-muted-fg">
            {rows.length} {rows.length === 1 ? 'resource' : 'resources'} ·{' '}
            {activeScenario.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-fg opacity-60"
            title="Add resource - lands in M2c"
          >
            + Add resource
          </button>
        </div>
      </div>

      <div className="mb-3 rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-muted-fg">
        <span className="font-medium text-foreground">Editing is live.</span> Click any phase
        % cell to edit; click a row to expand and edit rates, hours, utilization, or notes.
        Press Enter or Tab to commit, Esc to cancel. KPIs update in real time.
      </div>

      <ResourceTable
        rows={rows}
        phases={project.phases}
        scenarioId={activeScenario.id}
        totalsFooter={totalsFooter}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GeographyMixBar byGeography={totals.byGeography} />
        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-fg">
            Coming next (M2c)
          </h3>
          <ul className="space-y-1.5 text-sm text-muted-fg">
            <li>• <span className="text-foreground">Add resource</span> — role × level × geo picker with rate card lookup</li>
            <li>• <span className="text-foreground">Delete / duplicate</span> rows</li>
            <li>• <span className="text-foreground">Filter chips</span> (Geo / Phase / Level), search box, group-by</li>
            <li>• <span className="text-foreground">Guardrails strip</span> with three configurable rules</li>
          </ul>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-fg">
        Every edit creates an audit entry in <span className="font-mono">sow-calc:audit:{project.id}</span>. The Audit Log screen lands in M5.
      </p>
    </div>
  );
}
