/**
 * AssumptionLinksCell (M5d-3).
 *
 * Renders the `linkedEntities` count for one assumption row, and on click
 * pops open a tiny menu listing each linked entity as a navigable chip.
 * Clicking a chip navigates to the screen that owns that entity:
 *   - resource → Resource Planner
 *   - cloud → Cloud Planner
 *   - otherCost → Other Costs
 *   - project → Project Setup
 *   - scenario → Scenarios & Compare
 *
 * The router screens don't yet support per-entity anchors (the
 * Planner pages auto-scroll if a URL hash matches a row's ID, but
 * that's a future polish). For now navigation lands on the page that
 * owns the kind, which is enough to let a reviewer audit any
 * assumption's downstream.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/data/store';
import type { LinkedEntity } from '@/types/assumption';
import type { Project } from '@/types/project';
import type { Scenario } from '@/types/scenario';

export interface AssumptionLinksCellProps {
  entities: LinkedEntity[];
}

export function AssumptionLinksCell({ entities }: AssumptionLinksCellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (entities.length === 0) {
    return <span className="font-mono text-xs text-muted-fg">0</span>;
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Show ${entities.length} linked ${entities.length === 1 ? 'entity' : 'entities'}`}
        aria-expanded={open}
        className="rounded px-1 font-mono text-xs tabular-nums text-foreground hover:bg-muted hover:underline focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {entities.length}
      </button>
      {open && (
        <div
          role="menu"
          data-testid="assumption-links-popover"
          className="absolute right-0 top-full z-30 mt-1 min-w-[200px] rounded-md border border-border bg-background p-1.5 shadow-lg"
        >
          <div className="mb-1 px-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-fg">
            Linked entities
          </div>
          <ul className="space-y-0.5">
            {entities.map((e, i) => (
              <li key={`${e.type}-${e.id}-${i}`}>
                <EntityLinkButton
                  entity={e}
                  onNavigate={() => setOpen(false)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------
// EntityLinkButton
// -----------------------------------------------------------------

function EntityLinkButton({
  entity,
  onNavigate,
}: {
  entity: LinkedEntity;
  onNavigate: () => void;
}) {
  const navigate = useNavigate();
  const project = useProjectStore((s) => s.project);
  const scenarios = useProjectStore((s) => s.scenarios);

  const display = describeEntity(entity, project, scenarios);
  const route = routeForEntity(entity, project?.id);

  function handleClick() {
    if (route) navigate(route);
    onNavigate();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left text-xs hover:bg-muted focus:outline-none focus:ring-1 focus:ring-accent"
    >
      <span className="flex items-center gap-1.5 truncate">
        <span className="rounded bg-muted px-1 py-px text-[9px] font-medium uppercase tracking-wide text-muted-fg">
          {entity.type}
        </span>
        <span className="truncate">{display}</span>
      </span>
      {route && <span className="text-muted-fg">→</span>}
    </button>
  );
}

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

function describeEntity(
  entity: LinkedEntity,
  project: Project | null,
  scenarios: Scenario[],
): string {
  // Try to resolve a friendly name from the active scenario's data.
  // Fall back to the raw id if no match.
  if (!project) return entity.id;

  switch (entity.type) {
    case 'project':
      return project.name;
    case 'scenario': {
      const sc = scenarios.find((s) => s.id === entity.id);
      return sc?.name ?? entity.id;
    }
    case 'resource': {
      for (const sc of scenarios) {
        const r = sc.resources.find((x) => x.id === entity.id);
        if (r) return r.name?.trim() || `${r.role} (${r.skillLevel})`;
      }
      return entity.id;
    }
    case 'cloud': {
      for (const sc of scenarios) {
        const c = sc.cloudLineItems.find((x) => x.id === entity.id);
        if (c) return c.service;
      }
      return entity.id;
    }
    case 'otherCost': {
      for (const sc of scenarios) {
        const o = sc.otherCostLineItems.find((x) => x.id === entity.id);
        if (o) return o.name;
      }
      return entity.id;
    }
    default:
      return entity.id;
  }
}

function routeForEntity(
  entity: LinkedEntity,
  projectId: string | undefined,
): string | null {
  if (!projectId) return null;
  switch (entity.type) {
    case 'project': return `/p/${projectId}/setup`;
    case 'scenario': return `/p/${projectId}/scenarios`;
    case 'resource': return `/p/${projectId}/resources`;
    case 'cloud': return `/p/${projectId}/cloud`;
    case 'otherCost': return `/p/${projectId}/other-costs`;
    default: return null;
  }
}
