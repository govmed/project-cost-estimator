/**
 * Seed loader.
 *
 * The seed scenario JSON from Deliverable #3 has shape:
 *   { _comment, _modelVersion, _generatedAt, project, scenarios: [...] }
 *
 * Our internal Project doesn't include the scenarios array (scenarios are
 * stored separately - see the data model). This loader denormalizes the
 * seed into a Project + scenarios pair that the store consumes.
 */

import type { Project } from '@/types/project';
import type { Scenario } from '@/types/scenario';
import seedJson from '@/../seed/scenarios/example-modernization.json';

export interface LoadedSeed {
  project: Project;
  scenarios: Scenario[];
}

interface SeedShape {
  project: Project;
  scenarios: Scenario[];
}

export function loadSeed(): LoadedSeed {
  // The JSON is typed as `any` because the imported JSON has the meta-fields
  // (_comment, etc.) that we don't include in the runtime type. Cast safely.
  const raw = seedJson as unknown as SeedShape;
  return {
    project: raw.project,
    scenarios: raw.scenarios,
  };
}
