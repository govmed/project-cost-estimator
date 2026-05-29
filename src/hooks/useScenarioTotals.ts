/**
 * useScenarioTotals - the single hook every screen uses to get engine output.
 *
 * Reads project + active scenario from the store, runs calculate(), memoizes
 * on the inputs. Every screen that needs totals calls this rather than calling
 * calculate() directly, so the memoization is shared and consistent.
 *
 * Returns null if there's no project or no active scenario.
 */

import { useMemo } from 'react';
import { useProjectStore, selectActiveScenario } from '@/data/store';
import { calculate } from '@/engine/calculate';
import type { ScenarioTotals } from '@/engine/types';

export function useScenarioTotals(): ScenarioTotals | null {
  const project = useProjectStore((s) => s.project);
  const scenarios = useProjectStore((s) => s.scenarios);
  const activeScenarioId = useProjectStore((s) => s.activeScenarioId);

  const activeScenario = useMemo(
    () => selectActiveScenario({ scenarios, activeScenarioId }),
    [scenarios, activeScenarioId],
  );

  return useMemo(() => {
    if (!project || !activeScenario) return null;
    return calculate(project, activeScenario);
  }, [project, activeScenario]);
}
