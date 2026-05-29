/**
 * ResourcePlannerPage - M2c.
 *
 * Builds on M2b (inline editing) and adds:
 *  - + Add resource button (opens modal with role/level/geo picker)
 *  - Filter chips for Geography and Skill Level
 *  - Search box (matches role / name / notes)
 *  - Row actions: duplicate, delete with confirmation
 *  - Guardrails strip at the bottom (3 rules from #9)
 *
 * Filtering is purely visual: the engine still calculates against the
 * full scenario, so the top-rail KPIs reflect the whole project. The
 * footer in the table reflects the filtered subset, with " of N" suffix.
 */

import { useMemo, useState } from 'react';
import { useProjectStore, selectActiveScenario } from '@/data/store';
import { useScenarioTotals } from '@/hooks/useScenarioTotals';
import type { Geography, SkillLevel } from '@/types/resource';
import { buildResourceRows } from '@/ui/components/planner/build-rows';
import { ResourceTable } from '@/ui/components/planner/ResourceTable';
import { GeographyMixBar } from '@/ui/components/planner/GeographyMixBar';
import { PlannerFilters } from '@/ui/components/planner/PlannerFilters';
import { AddResourceModal } from '@/ui/components/planner/AddResourceModal';
import { GuardrailsStrip } from '@/ui/components/planner/GuardrailsStrip';
import { evaluateGuardrails } from '@/engine/guardrails/resource-guardrails';

export function ResourcePlannerPage() {
  const project = useProjectStore((s) => s.project);
  const scenarios = useProjectStore((s) => s.scenarios);
  const activeScenarioId = useProjectStore((s) => s.activeScenarioId);
  const addResource = useProjectStore((s) => s.addResource);
  const totals = useScenarioTotals();

  const [search, setSearch] = useState('');
  const [selectedGeos, setSelectedGeos] = useState<Set<Geography>>(new Set());
  const [selectedLevels, setSelectedLevels] = useState<Set<SkillLevel>>(new Set());
  const [addOpen, setAddOpen] = useState(false);

  const activeScenario = useMemo(
    () => selectActiveScenario({ scenarios, activeScenarioId }),
    [scenarios, activeScenarioId],
  );

  const allRows = useMemo(() => {
    if (!project || !activeScenario || !totals) return [];
    return buildResourceRows(activeScenario.resources, project.phases, totals.resources);
  }, [project, activeScenario, totals]);

  // Apply filters + search
  const filteredRows = useMemo(() => {
    if (allRows.length === 0) return allRows;
    const q = search.trim().toLowerCase();
    return allRows.filter((row) => {
      const r = row.resource;
      if (selectedGeos.size > 0 && !selectedGeos.has(r.geography)) return false;
      if (selectedLevels.size > 0 && !selectedLevels.has(r.skillLevel)) return false;
      if (q) {
        const haystack = [
          r.role,
          r.name ?? '',
          r.notes ?? '',
          r.geography,
          r.skillLevel,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allRows, search, selectedGeos, selectedLevels]);

  const availableGeos = useMemo<Geography[]>(() => {
    const set = new Set<Geography>();
    for (const r of allRows) set.add(r.resource.geography);
    return Array.from(set).sort();
  }, [allRows]);

  const availableLevels = useMemo<SkillLevel[]>(() => {
    const set = new Set<SkillLevel>();
    for (const r of allRows) set.add(r.resource.skillLevel);
    const order: SkillLevel[] = ['Associate', 'Professional', 'Senior', 'Advisor', 'Principal'];
    return order.filter((l) => set.has(l));
  }, [allRows]);

  const totalsFooter = useMemo(() => {
    const hours = filteredRows.reduce((acc, r) => acc + r.totals.totalHours, 0);
    const billed = filteredRows.reduce((acc, r) => acc + r.totals.billedAmount.amount, 0);
    const cost = filteredRows.reduce((acc, r) => acc + r.totals.internalCost.amount, 0);
    const marginPct = billed > 0 ? ((billed - cost) / billed) * 100 : 0;
    return { hours, billed, cost, marginPct };
  }, [filteredRows]);

  const guardrails = useMemo(() => {
    if (!project || !activeScenario || !totals) return [];
    return evaluateGuardrails(project, activeScenario, totals);
  }, [project, activeScenario, totals]);

  if (!project || !activeScenario || !totals) {
    return <div className="px-8 py-12 text-muted-fg">No active scenario.</div>;
  }

  function toggleGeo(g: Geography) {
    setSelectedGeos((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  }

  function toggleLevel(l: SkillLevel) {
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });
  }

  function clearFilters() {
    setSelectedGeos(new Set());
    setSelectedLevels(new Set());
    setSearch('');
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Resource Planner</h1>
          <p className="text-sm text-muted-fg">
            {allRows.length} {allRows.length === 1 ? 'resource' : 'resources'} ·{' '}
            {activeScenario.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="rounded-md bg-accent px-3 py-1.5 text-sm text-accent-fg hover:bg-accent/90"
          >
            + Add resource
          </button>
        </div>
      </div>

      {/* Filters + search */}
      <PlannerFilters
        availableGeos={availableGeos}
        availableLevels={availableLevels}
        selectedGeos={selectedGeos}
        selectedLevels={selectedLevels}
        onToggleGeo={toggleGeo}
        onToggleLevel={toggleLevel}
        onClearAll={clearFilters}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Main table */}
      <ResourceTable
        rows={filteredRows}
        phases={project.phases}
        scenarioId={activeScenario.id}
        totalsFooter={totalsFooter}
        unfilteredCount={allRows.length}
      />

      {/* Bottom row */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GeographyMixBar byGeography={totals.byGeography} />
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-fg">
            Guardrails
          </h3>
          <GuardrailsStrip guardrails={guardrails} />
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-fg">
        Every edit creates an audit entry in{' '}
        <span className="font-mono">sow-calc:audit:{project.id}</span>. The Audit
        Log screen lands in M5.
      </p>

      <AddResourceModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(input) => addResource(activeScenario.id, input)}
      />
    </div>
  );
}
