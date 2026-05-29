/**
 * PlannerFilters - the filter chip strip above the Resource table.
 *
 * Filters by Geography and Skill Level. Each chip is a toggle. Active
 * chips are highlighted; clicking removes them from the filter.
 *
 * The filter state (which geos / levels are selected) lives in the page
 * component; this is a controlled component.
 *
 * Note: the M2c plan included a Phase filter ("show only resources
 * allocated to phase X") but that's higher-complexity (per-row truth
 * varies with allocation matrix state). Deferred to keep M2c shippable.
 */

import clsx from 'clsx';
import type { Geography, SkillLevel } from '@/types/resource';

export interface PlannerFiltersProps {
  /** Distinct geos present in the active scenario's resources. */
  availableGeos: Geography[];
  /** Distinct levels present in the active scenario's resources. */
  availableLevels: SkillLevel[];

  selectedGeos: Set<Geography>;
  selectedLevels: Set<SkillLevel>;

  onToggleGeo: (geo: Geography) => void;
  onToggleLevel: (level: SkillLevel) => void;
  onClearAll: () => void;

  search: string;
  onSearchChange: (q: string) => void;
}

export function PlannerFilters({
  availableGeos,
  availableLevels,
  selectedGeos,
  selectedLevels,
  onToggleGeo,
  onToggleLevel,
  onClearAll,
  search,
  onSearchChange,
}: PlannerFiltersProps) {
  const hasAny = selectedGeos.size > 0 || selectedLevels.size > 0 || search.length > 0;

  return (
    <div className="mb-3 rounded-md border border-border bg-muted/10 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search role, name, notes…"
          aria-label="Search resources"
          className="w-48 rounded border border-border bg-background px-2 py-1 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />

        <div className="flex items-center gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-fg">Geo:</span>
          {availableGeos.map((g) => (
            <FilterChip
              key={g}
              label={g}
              active={selectedGeos.has(g)}
              onClick={() => onToggleGeo(g)}
            />
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-fg">Level:</span>
          {availableLevels.map((l) => (
            <FilterChip
              key={l}
              label={l}
              active={selectedLevels.has(l)}
              onClick={() => onToggleLevel(l)}
            />
          ))}
        </div>

        {hasAny && (
          <button
            type="button"
            onClick={onClearAll}
            className="ml-auto text-xs text-muted-fg underline hover:text-foreground"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
        active
          ? 'border-accent bg-accent/15 font-medium text-foreground'
          : 'border-border bg-background text-muted-fg hover:bg-muted',
      )}
    >
      {label}
    </button>
  );
}
