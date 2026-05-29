/**
 * ScenarioChooser - the dropdown in the top rail for switching scenarios.
 *
 * M1b: a native select that switches the active scenario in the store.
 * Switching re-renders every screen with the new scenario's numbers (the
 * KPI strip, the active page) because they all read from the store.
 *
 * M1c will add the [+ Clone] and [Compare] buttons next to it.
 */

import { useProjectStore } from '@/data/store';
import { ScenarioId } from '@/types/ids';

export function ScenarioChooser() {
  const scenarios = useProjectStore((s) => s.scenarios);
  const activeScenarioId = useProjectStore((s) => s.activeScenarioId);
  const setActiveScenario = useProjectStore((s) => s.setActiveScenario);

  if (scenarios.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-fg">Scenario</span>
      <select
        value={activeScenarioId ?? ''}
        onChange={(e) => setActiveScenario(ScenarioId(e.target.value))}
        className="rounded-md border border-border bg-background px-2 py-1 text-sm font-medium text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {scenarios.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
            {s.isBase ? ' (base)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
