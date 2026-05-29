/**
 * ScenariosPage - M4a.
 *
 * Simple list of all scenarios with inline actions. Each row shows:
 *  - Inline-renameable scenario name
 *  - Base / Active badges
 *  - Final Price, Margin, Hours (from engine, computed per scenario)
 *  - R / C / O line item counts
 *  - Set-as-base star (★)
 *  - Clone (⎘)
 *  - Delete (✕, two-click confirm; hidden on base scenario)
 *
 * No compare grid here — that's M4b. M4a's job is to ship CRUD cleanly.
 */

import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { useProjectStore } from '@/data/store';
import { calculate } from '@/engine/calculate';
import { formatMoney, formatPercent } from '@/ui/format';
import type { Scenario } from '@/types/scenario';
import type { ScenarioId } from '@/types/ids';
import type { ScenarioTotals } from '@/engine/types';

export function ScenariosPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const project = useProjectStore((s) => s.project);
  const scenarios = useProjectStore((s) => s.scenarios);
  const activeScenarioId = useProjectStore((s) => s.activeScenarioId);
  const setActiveScenario = useProjectStore((s) => s.setActiveScenario);
  const cloneScenario = useProjectStore((s) => s.cloneScenario);

  // Pre-compute totals for every scenario. ScenariosPage is the first
  // screen that needs cross-scenario totals; M4b will lift this into a
  // shared hook.
  const allTotals = useMemo(() => {
    const map = new Map<ScenarioId, ScenarioTotals>();
    if (!project) return map;
    for (const sc of scenarios) {
      try {
        map.set(sc.id, calculate(project, sc));
      } catch {
        // Skip scenarios that fail to calculate (shouldn't happen with valid data)
      }
    }
    return map;
  }, [project, scenarios]);

  const sortedScenarios = useMemo(
    () => [...scenarios].sort((a, b) => a.order - b.order),
    [scenarios],
  );

  if (!project) {
    return <div className="px-8 py-12 text-muted-fg">No project loaded.</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Scenarios</h1>
          <p className="text-sm text-muted-fg">
            {scenarios.length} scenario{scenarios.length === 1 ? '' : 's'} in this project.
            Clone, rename, delete, or set a different base. Side-by-side comparison lands
            in M4b.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const fromId = activeScenarioId ?? project.baseScenarioId;
            cloneScenario(fromId);
          }}
          className="rounded-md bg-accent px-3 py-1.5 text-sm text-accent-fg hover:bg-accent/90"
        >
          + Clone active scenario
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30 text-xs font-medium uppercase tracking-wide text-muted-fg">
            <tr>
              <th className="px-3 py-2 text-left">Scenario</th>
              <th className="px-3 py-2 text-right">Final Price</th>
              <th className="px-3 py-2 text-right">Margin</th>
              <th className="px-3 py-2 text-right">Hours</th>
              <th className="px-3 py-2 text-right" title="Resources / Cloud / Other Costs">
                R / C / O
              </th>
              <th className="px-3 py-2 w-36"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {sortedScenarios.map((sc) => (
              <ScenarioRow
                key={sc.id}
                scenario={sc}
                totals={allTotals.get(sc.id) ?? null}
                isActive={sc.id === activeScenarioId}
                projectId={projectId ?? project.id}
                onView={(id) => {
                  setActiveScenario(id);
                }}
              />
            ))}
          </tbody>
        </table>
        <div className="border-t border-border bg-muted/10 px-3 py-2 text-xs text-muted-fg">
          R / C / O = Resources / Cloud line items / Other-cost line items.
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-fg">
        Every scenario action (clone, rename, delete, set-base) creates an audit entry
        in <span className="font-mono">sow-calc:audit:{project.id}</span>.
      </p>
    </div>
  );
}

interface ScenarioRowProps {
  scenario: Scenario;
  totals: ScenarioTotals | null;
  isActive: boolean;
  projectId: string;
  onView: (id: ScenarioId) => void;
}

function ScenarioRow({ scenario, totals, isActive, projectId, onView }: ScenarioRowProps) {
  const navigate = useNavigate();
  const renameScenario = useProjectStore((s) => s.renameScenario);
  const cloneScenario = useProjectStore((s) => s.cloneScenario);
  const deleteScenario = useProjectStore((s) => s.deleteScenario);
  const setBaseScenario = useProjectStore((s) => s.setBaseScenario);

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(scenario.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function commitRename() {
    if (draftName.trim() && draftName !== scenario.name) {
      renameScenario(scenario.id, draftName);
    }
    setEditingName(false);
  }

  function handleViewDashboard() {
    onView(scenario.id);
    navigate(`/p/${projectId}/dashboard`);
  }

  return (
    <tr className="border-b border-border/60 last:border-b-0 hover:bg-muted/20">
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          {editingName ? (
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') {
                  setDraftName(scenario.name);
                  setEditingName(false);
                }
              }}
              autoFocus
              aria-label={`Rename ${scenario.name}`}
              className="rounded border border-accent bg-background px-1 py-0.5 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="text-left font-medium text-foreground hover:underline"
              title="Click to rename"
            >
              {scenario.name}
            </button>
          )}
          {scenario.isBase && (
            <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-accent">
              base
            </span>
          )}
          {isActive && (
            <span className="rounded bg-status-good/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-status-good">
              active
            </span>
          )}
          {scenario.parentScenarioId && (
            <span title="Cloned from another scenario" className="text-xs text-muted-fg">
              ⎘
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2 text-right font-mono tabular-money">
        {totals ? formatMoney(totals.finalPrice) : '—'}
      </td>
      <td className="px-3 py-2 text-right font-mono tabular-nums">
        {totals ? formatPercent(totals.realizedMarginPct) : '—'}
      </td>
      <td className="px-3 py-2 text-right font-mono tabular-nums">
        {totals ? Math.round(totals.totalBillableHours).toLocaleString() : '—'}
      </td>
      <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-muted-fg">
        {scenario.resources.length}/{scenario.cloudLineItems.length}/
        {scenario.otherCostLineItems.length}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={handleViewDashboard}
            className="rounded px-2 py-1 text-xs text-muted-fg hover:bg-muted hover:text-foreground"
            title="Switch active and view dashboard"
          >
            View
          </button>
          {!scenario.isBase && (
            <button
              type="button"
              onClick={() => setBaseScenario(scenario.id)}
              className="rounded p-1 text-muted-fg hover:bg-muted hover:text-accent"
              title="Set as base scenario"
              aria-label={`Set ${scenario.name} as base scenario`}
            >
              ★
            </button>
          )}
          <button
            type="button"
            onClick={() => cloneScenario(scenario.id)}
            className="rounded p-1 text-muted-fg hover:bg-muted hover:text-foreground"
            title="Clone"
            aria-label={`Clone ${scenario.name}`}
          >
            ⎘
          </button>
          {!scenario.isBase && (
            <button
              type="button"
              onClick={() => {
                if (confirmDelete) {
                  deleteScenario(scenario.id);
                  setConfirmDelete(false);
                } else {
                  setConfirmDelete(true);
                  setTimeout(() => setConfirmDelete(false), 3000);
                }
              }}
              className={clsx(
                'rounded px-1.5 py-1 text-xs transition-colors',
                confirmDelete
                  ? 'bg-status-bad/10 font-medium text-status-bad'
                  : 'text-muted-fg hover:bg-muted hover:text-status-bad',
              )}
              title={confirmDelete ? 'Click again to confirm' : 'Delete'}
              aria-label={confirmDelete ? `Confirm delete ${scenario.name}` : `Delete ${scenario.name}`}
            >
              {confirmDelete ? 'Confirm?' : '✕'}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
