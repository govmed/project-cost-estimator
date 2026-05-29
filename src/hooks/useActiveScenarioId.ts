/**
 * useActiveScenarioId - small selector for the active scenario's ID.
 *
 * Returns the ScenarioId of the active scenario, or null. Wraps the store
 * selector so components that only need the ID don't subscribe to other
 * store changes.
 */

import { useProjectStore } from '@/data/store';
import type { ScenarioId } from '@/types/ids';

export function useActiveScenarioId(): ScenarioId | null {
  return useProjectStore((s) => s.activeScenarioId);
}
