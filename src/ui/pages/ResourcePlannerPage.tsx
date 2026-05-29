/**
 * ResourcePlannerPage - M2a.
 *
 * Read-only assembly:
 *   - Header with title + resource count
 *   - Main resource table (per-row totals, phase allocations, footer)
 *   - Geography mix card
 *
 * No editing in M2a. The "+ Add resource", filters, search, group-by,
 * guardrails, and right-rail defensibility panel land in later
 * sub-milestones.
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

  if (!project || !activeScenario || !totals) {
    return (
      <div className="px-8 py-12 text-muted-fg">
        No active scenario.
      </div>
    );
  }

  // Footer totals: sum across visible rows.
  const totalsFooter = useMemo(() => {
    const hours = rows.reduce((acc, r) => acc + r.totals.totalHours, 0);
    const billed = rows.reduce((acc, r) => acc + r.totals.billedAmount.amount, 0);
    const cost = rows.reduce((acc, r) => acc + r.totals.internalCost.amount, 0);
    const marginPct = billed > 0 ? ((billed - cost) / billed) * 100 : 0;
    return { hours, billed, cost, marginPct };
  }, [rows]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      {/* Header */}
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
            title="Add resource - inline edit lands in M2b, add flow in M2c"
          >
            + Add resource
          </button>
        </div>
      </div>

      {/* Main table */}
      <ResourceTable rows={rows} phases={project.phases} totalsFooter={totalsFooter} />

      {/* Bottom cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GeographyMixBar byGeography={totals.byGeography} />
        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-fg">
            Coming next (M2b / M2c)
          </h3>
          <ul className="space-y-1.5 text-sm text-muted-fg">
            <li>• <span className="text-foreground">M2b:</span> click any phase % cell to edit inline; rates/utilization editable in expanded row</li>
            <li>• <span className="text-foreground">M2c:</span> add/delete/duplicate, filter by geo/phase/level, search, guardrails strip</li>
            <li>• <span className="text-foreground">M1c (deferred):</span> right-rail defensibility panel when you click any number</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
