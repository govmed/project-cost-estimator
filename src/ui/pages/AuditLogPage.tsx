/**
 * AuditLogPage - M5a.
 *
 * Renders the localStorage audit log for the current project. Filters:
 *  - Scenario (single-select; defaults to "all")
 *  - Category chips (resource / cloud / otherCost / project / phase /
 *    scenario / ma / assumption)
 *  - Search box (substring match on headline + summary)
 *
 * Each row: timestamp, category badge, headline, summary. Click a row to
 * expand and see the raw JSON for that audit entry.
 *
 * Reads from localStorage on mount and on demand (a "Refresh" button) - the
 * store doesn't push audit entries to React state, so the page polls when
 * the user wants the latest. (M5b's export will share the same read path.)
 */

import { useEffect, useMemo, useState } from 'react';
import { useProjectStore } from '@/data/store';
import { readAudit, type AuditEntry } from '@/data/audit-log';
import { labelForAuditAction, type AuditCategory } from '@/ui/components/audit/AuditActionLabel';
import { AuditCategoryBadge } from '@/ui/components/audit/AuditCategoryBadge';

const CATEGORIES: AuditCategory[] = [
  'resource',
  'cloud',
  'otherCost',
  'project',
  'phase',
  'scenario',
  'ma',
  'assumption',
];

const PAGE_SIZE = 100;

export function AuditLogPage() {
  const project = useProjectStore((s) => s.project);
  const scenarios = useProjectStore((s) => s.scenarios);

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [scenarioFilter, setScenarioFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<Set<AuditCategory>>(new Set());
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(PAGE_SIZE);

  function refresh() {
    if (!project) return;
    setEntries(readAudit(project.id));
  }

  useEffect(() => {
    refresh();
    // We also refresh on every change to the project's updatedAt - that's a
    // reasonable proxy for "the user did something" without subscribing to
    // every action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, project?.updatedAt]);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [entries],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sorted.filter((e) => {
      if (scenarioFilter !== 'all' && e.scenarioId !== scenarioFilter) return false;
      const label = labelForAuditAction(e.action);
      if (categoryFilter.size > 0 && !categoryFilter.has(label.category)) return false;
      if (q) {
        const hay = `${label.headline} ${label.summary}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [sorted, scenarioFilter, categoryFilter, search]);

  if (!project) {
    return <div className="px-8 py-12 text-muted-fg">No project loaded.</div>;
  }

  const totalCount = entries.length;
  const visible = filtered.slice(0, limit);
  const hasMore = filtered.length > limit;

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Audit Log</h1>
          <p className="text-sm text-muted-fg">
            {totalCount} entr{totalCount === 1 ? 'y' : 'ies'} recorded for this project.
            Every edit anywhere in the app appears here. Newest first.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/10 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium uppercase tracking-wide text-muted-fg">Scenario:</span>
          <select
            value={scenarioFilter}
            onChange={(e) => setScenarioFilter(e.target.value)}
            className="rounded border border-border bg-background px-2 py-0.5"
          >
            <option value="all">All scenarios</option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="font-medium uppercase tracking-wide text-muted-fg">Category:</span>
          {CATEGORIES.map((c) => {
            const active = categoryFilter.has(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  const next = new Set(categoryFilter);
                  if (next.has(c)) next.delete(c);
                  else next.add(c);
                  setCategoryFilter(next);
                }}
                aria-pressed={active}
                className={
                  active
                    ? 'rounded-full bg-accent px-2 py-0.5 text-accent-fg'
                    : 'rounded-full border border-border bg-background px-2 py-0.5 hover:bg-muted'
                }
              >
                {c}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="ml-auto w-48 rounded border border-border bg-background px-2 py-1 text-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />

        {(scenarioFilter !== 'all' || categoryFilter.size > 0 || search) && (
          <button
            type="button"
            onClick={() => {
              setScenarioFilter('all');
              setCategoryFilter(new Set());
              setSearch('');
            }}
            className="rounded px-2 py-1 text-muted-fg hover:bg-muted hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {filtered.length !== totalCount && (
        <p className="mb-2 text-xs text-muted-fg">
          Showing {filtered.length} of {totalCount} entries.
        </p>
      )}

      {/* Entries */}
      {totalCount === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/10 p-8 text-center text-sm text-muted-fg">
          No audit entries yet. Edit a resource, cloud line item, scenario, or
          anything else, and the change appears here.
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/10 p-8 text-center text-sm text-muted-fg">
          No entries match the current filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          <ul>
            {visible.map((entry) => {
              const isExpanded = expanded.has(entry.id);
              const label = labelForAuditAction(entry.action);
              const scenario = scenarios.find((s) => s.id === entry.scenarioId);
              return (
                <li
                  key={entry.id}
                  className="border-b border-border/60 last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => {
                      const next = new Set(expanded);
                      if (next.has(entry.id)) next.delete(entry.id);
                      else next.add(entry.id);
                      setExpanded(next);
                    }}
                    aria-expanded={isExpanded}
                    className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-muted/30"
                  >
                    <div className="w-32 shrink-0 text-xs text-muted-fg tabular-nums">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                    <div className="w-24 shrink-0">
                      <AuditCategoryBadge category={label.category} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {label.headline}
                      </div>
                      {label.summary && (
                        <div className="text-xs text-muted-fg">{label.summary}</div>
                      )}
                    </div>
                    {scenario && (
                      <div className="shrink-0 text-xs text-muted-fg">
                        {scenario.name}
                      </div>
                    )}
                    <div className="w-4 shrink-0 text-muted-fg">
                      {isExpanded ? '▾' : '▸'}
                    </div>
                  </button>
                  {isExpanded && (
                    <pre className="overflow-x-auto border-t border-border bg-muted/10 px-3 py-2 text-[10px] text-muted-fg">
                      {JSON.stringify(entry, null, 2)}
                    </pre>
                  )}
                </li>
              );
            })}
          </ul>
          {hasMore && (
            <div className="border-t border-border bg-muted/10 px-3 py-2 text-center">
              <button
                type="button"
                onClick={() => setLimit(limit + PAGE_SIZE)}
                className="text-xs text-accent hover:underline"
              >
                Load {Math.min(PAGE_SIZE, filtered.length - limit)} more
                ({filtered.length - limit} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-muted-fg">
        Audit storage: localStorage key{' '}
        <span className="font-mono">sow-calc:audit:{project.id}</span>, capped
        at 1,000 entries with FIFO eviction.
      </p>
    </div>
  );
}
