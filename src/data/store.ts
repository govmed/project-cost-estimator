/**
 * Project store - the single source of truth for "what is the user viewing."
 *
 * Holds the Project, its scenarios, and which scenario is active. Engine
 * output (totals, burn curve, etc.) is NOT stored here - it's derived from
 * (project, activeScenario) via calculate() at the component boundary.
 *
 * Persistence is via the Storage interface. M1a wires LocalStorageProvider;
 * Phase 2 will swap for a backend provider with no component changes.
 */

import { create } from 'zustand';
import type { Project } from '@/types/project';
import type { Scenario } from '@/types/scenario';
import type { ScenarioId } from '@/types/ids';
import { LocalStorageProvider } from './local-storage-provider';
import type { Storage } from './storage';

const storage: Storage = new LocalStorageProvider();

interface ProjectState {
  project: Project | null;
  scenarios: Scenario[];
  activeScenarioId: ScenarioId | null;

  // Actions
  setProject(project: Project, scenarios: Scenario[]): void;
  setActiveScenario(scenarioId: ScenarioId): void;
  reset(): void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: null,
  scenarios: [],
  activeScenarioId: null,

  setProject(project, scenarios) {
    set({
      project,
      scenarios,
      activeScenarioId: project.activeScenarioId,
    });
    // Persist asynchronously - don't await; UI shouldn't block on storage.
    void storage.save(project);
  },

  setActiveScenario(scenarioId) {
    set({ activeScenarioId: scenarioId });
  },

  reset() {
    set({ project: null, scenarios: [], activeScenarioId: null });
  },
}));

/**
 * Helper to get the currently active scenario from the store.
 * Returns null if no project loaded or no active scenario set.
 */
export function selectActiveScenario(
  state: Pick<ProjectState, 'scenarios' | 'activeScenarioId'>,
): Scenario | null {
  if (!state.activeScenarioId) return null;
  return state.scenarios.find((s) => s.id === state.activeScenarioId) ?? null;
}
