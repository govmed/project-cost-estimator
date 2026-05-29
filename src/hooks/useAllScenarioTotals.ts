/**
 * useAllScenarioTotals - engine totals for every scenario in the project.
 *
 * The Compare grid needs to render multiple scenarios at once. Rather than
 * each scenario card calling calculate(), the page builds the map once
 * and passes the relevant ScenarioTotals down.
 *
 * Returns a Map<ScenarioId, ScenarioTotals>. Empty map when no project loaded.
 * Memoizes on (project, scenarios) identity.
 *
 * Note: M4a's ScenariosPage already computes per-scenario totals locally.
 * M4b lifts that into this shared hook so the page can use the same map
 * for both the list rows AND the compare grid.
 */

import { useMemo } from 'react';
import { useProjectStore } from '@/data/store';
import { calculate } from '@/engine/calculate';
import type { ScenarioTotals } from '@/engine/types';
import type { ScenarioId } from '@/types/ids';

export function useAllScenarioTotals(): Map<ScenarioId, ScenarioTotals> {
  const project = useProjectStore((s) => s.project);
  const scenarios = useProjectStore((s) => s.scenarios);

  return useMemo(() => {
    const map = new Map<ScenarioId, ScenarioTotals>();
    if (!project) return map;
    for (const sc of scenarios) {
      try {
        map.set(sc.id, calculate(project, sc));
      } catch {
        // Skip scenarios that fail to calculate (shouldn't happen with
        // valid data). Compare grid renders them as unavailable.
      }
    }
    return map;
  }, [project, scenarios]);
}
