/**
 * Resource row builder.
 *
 * The Resource Planner table renders one row per resource. Each row needs
 * BOTH the input data (role/level/geo, per-phase allocations) and the
 * engine's computed output (hours, billed, cost, margin). This module
 * stitches them together into one flat ResourceRow type the table consumes.
 *
 * Why a separate module? It's the only seam between the engine's output
 * shape and the table's column definitions. Keeping the stitch in one
 * place means the column defs stay clean and the engine output can change
 * shape (e.g., add new derived fields) without touching the columns.
 */

import type { Resource } from '@/types/resource';
import type { Phase } from '@/types/project';
import type { PhaseId } from '@/types/ids';
import type { ResourceTotals } from '@/engine/types';
import { allocationForPhase } from '@/engine/calculations/resource';

export interface ResourceRow {
  // Identity / input
  resource: Resource;
  // Per-phase allocation % (computed from defaultAllocationPct + overrides)
  allocationByPhase: Record<PhaseId, number>;
  // Engine output (totals across all phases)
  totals: ResourceTotals;
}

/**
 * Build the rows array.
 *
 * Inputs:
 *  - resources: Resource[] from the active scenario
 *  - phases: Phase[] from the project
 *  - resourceTotals: ResourceTotals[] from calculate(...)
 *
 * Returns: one ResourceRow per resource, in input order.
 *
 * If a resource has no matching ResourceTotals entry (shouldn't happen but
 * we're defensive), it's skipped. The table will simply not show that row.
 */
export function buildResourceRows(
  resources: Resource[],
  phases: Phase[],
  resourceTotals: ResourceTotals[],
): ResourceRow[] {
  const rows: ResourceRow[] = [];
  for (const resource of resources) {
    const totals = resourceTotals.find((t) => t.resourceId === resource.id);
    if (!totals) continue;

    const allocationByPhase: Record<string, number> = {};
    for (const phase of phases) {
      allocationByPhase[phase.id] = allocationForPhase(resource, phase.id);
    }

    rows.push({
      resource,
      allocationByPhase: allocationByPhase as Record<PhaseId, number>,
      totals,
    });
  }
  return rows;
}
