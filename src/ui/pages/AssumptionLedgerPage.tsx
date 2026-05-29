/**
 * AssumptionLedgerPage - M5a.
 *
 * Lists the active scenario's assumptions in a table. Per-row:
 *  - Topic (inline-renameable)
 *  - Description (truncated; expand on hover/click)
 *  - Source badge (assumed / validated / clientConfirmed / industryBenchmark)
 *  - Risk badge (low / medium / high)
 *  - Links count
 *  - Created date + reviewed status
 *  - Actions: mark reviewed, edit source, edit risk, delete
 *
 * Footer: + Add assumption button opens a small modal.
 *
 * Filter: source + risk multi-select. Scenarios with 0 assumptions show an
 * empty-state CTA.
 */

import { useMemo, useState } from 'react';
import { useProjectStore, selectActiveScenario } from '@/data/store';
import type {
  Assumption,
  AssumptionSource,
  AssumptionRiskLevel,
} from '@/types/assumption';
import { AssumptionSourceBadge } from '@/ui/components/assumptions/AssumptionSourceBadge';
import { AssumptionRiskBadge } from '@/ui/components/assumptions/AssumptionRiskBadge';
import { AddAssumptionModal } from '@/ui/components/assumptions/AddAssumptionModal';

const SOURCES: readonly AssumptionSource[] = [
  'assumed',
  'validated',
  'clientConfirmed',
  'industryBenchmark',
];

const RISKS: readonly AssumptionRiskLevel[] = ['low', 'medium', 'high'];

export function AssumptionLedgerPage() {
  const project = useProjectStore((s) => s.project);
  const scenarios = useProjectStore((s) => s.scenarios);
  const activeScenarioId = useProjectStore((s) => s.activeScenarioId);
  const addAssumption = useProjectStore((s) => s.addAssumption);

  const activeScenario = useMemo(
    () => selectActiveScenario({ scenarios, activeScenarioId }),
    [scenarios, activeScenarioId],
  );

  const [addOpen, setAddOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<Set<AssumptionSource>>(new Set());
  const [riskFilter, setRiskFilter] = useState<Set<AssumptionRiskLevel>>(new Set());

  const filtered = useMemo(() => {
    const all = activeScenario?.assumptions ?? [];
    return all.filter((a) => {
      if (sourceFilter.size > 0 && !sourceFilter.has(a.source)) return false;
      if (riskFilter.size > 0 && !riskFilter.has(a.riskLevel)) return false;
      return true;
    });
  }, [activeScenario, sourceFilter, riskFilter]);

  if (!project || !activeScenario) {
    return <div className="px-8 py-12 text-muted-fg">No active scenario.</div>;
  }

  const totalCount = activeScenario.assumptions.length;
  const unreviewedCount = activeScenario.assumptions.filter((a) => !a.lastReviewedAt).length;

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Assumption Ledger</h1>
          <p className="text-sm text-muted-fg">
            {totalCount} assumption{totalCount === 1 ? '' : 's'} in {activeScenario.name}
            {unreviewedCount > 0 && (
              <>
                {' '}·{' '}
                <span className="text-status-warn">{unreviewedCount} unreviewed</span>
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="rounded-md bg-accent px-3 py-1.5 text-sm text-accent-fg hover:bg-accent/90"
        >
          + Add assumption
        </button>
      </div>

      {/* Filter chips */}
      {totalCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/10 px-3 py-2 text-xs">
          <FilterChipGroup
            label="Source"
            options={SOURCES}
            selected={sourceFilter}
            onToggle={(v) => {
              const next = new Set(sourceFilter);
              if (next.has(v)) next.delete(v);
              else next.add(v);
              setSourceFilter(next);
            }}
          />
          <FilterChipGroup
            label="Risk"
            options={RISKS}
            selected={riskFilter}
            onToggle={(v) => {
              const next = new Set(riskFilter);
              if (next.has(v)) next.delete(v);
              else next.add(v);
              setRiskFilter(next);
            }}
          />
          {(sourceFilter.size > 0 || riskFilter.size > 0) && (
            <button
              type="button"
              onClick={() => {
                setSourceFilter(new Set());
                setRiskFilter(new Set());
              }}
              className="rounded px-2 py-1 text-muted-fg hover:bg-muted hover:text-foreground"
            >
              Clear filters
            </button>
          )}
          {filtered.length !== totalCount && (
            <span className="text-muted-fg">
              showing {filtered.length} of {totalCount}
            </span>
          )}
        </div>
      )}

      {totalCount === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/10 p-8 text-center text-sm text-muted-fg">
          No assumptions yet for {activeScenario.name}.
          <br />
          Capture key estimating assumptions here so reviewers can see where
          your numbers come from and what risk level each carries.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-xs font-medium uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="px-3 py-2 text-left">Topic</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-left w-32">Source</th>
                <th className="px-3 py-2 text-left w-24">Risk</th>
                <th className="px-3 py-2 text-right w-16">Links</th>
                <th className="px-3 py-2 text-left w-32">Reviewed</th>
                <th className="px-3 py-2 w-28"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <AssumptionRow
                  key={a.id}
                  assumption={a}
                  scenarioId={activeScenario.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-fg">
        Each scenario has its own assumptions (cloned with the scenario).
        Every edit creates an audit entry under{' '}
        <span className="font-mono">assumption.*</span> kinds.
      </p>

      <AddAssumptionModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(input) => {
          addAssumption(activeScenario.id, input);
        }}
      />
    </div>
  );
}

function FilterChipGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly T[];
  selected: Set<T>;
  onToggle: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="font-medium uppercase tracking-wide text-muted-fg">{label}:</span>
      {options.map((opt) => {
        const active = selected.has(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            aria-pressed={active}
            className={
              active
                ? 'rounded-full bg-accent px-2 py-0.5 text-accent-fg'
                : 'rounded-full border border-border bg-background px-2 py-0.5 hover:bg-muted'
            }
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

interface AssumptionRowProps {
  assumption: Assumption;
  scenarioId: import('@/types/ids').ScenarioId;
}

function AssumptionRow({ assumption, scenarioId }: AssumptionRowProps) {
  const updateAssumption = useProjectStore((s) => s.updateAssumption);
  const deleteAssumption = useProjectStore((s) => s.deleteAssumption);
  const markAssumptionReviewed = useProjectStore((s) => s.markAssumptionReviewed);

  const [editingTopic, setEditingTopic] = useState(false);
  const [draftTopic, setDraftTopic] = useState(assumption.topic);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function commitTopic() {
    if (draftTopic.trim() && draftTopic !== assumption.topic) {
      updateAssumption(scenarioId, assumption.id, {
        kind: 'topic',
        value: draftTopic,
      });
    }
    setEditingTopic(false);
  }

  const reviewLabel = assumption.lastReviewedAt
    ? new Date(assumption.lastReviewedAt).toLocaleDateString()
    : null;

  return (
    <tr className="border-b border-border/60 last:border-b-0 hover:bg-muted/20">
      <td className="px-3 py-2 align-top">
        {editingTopic ? (
          <input
            type="text"
            value={draftTopic}
            onChange={(e) => setDraftTopic(e.target.value)}
            onBlur={commitTopic}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTopic();
              if (e.key === 'Escape') {
                setDraftTopic(assumption.topic);
                setEditingTopic(false);
              }
            }}
            autoFocus
            aria-label={`Rename assumption ${assumption.topic}`}
            className="w-full rounded border border-accent bg-background px-1 py-0.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-accent"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTopic(true)}
            className="text-left font-medium text-foreground hover:underline"
            title="Click to rename"
          >
            {assumption.topic}
          </button>
        )}
      </td>
      <td className="px-3 py-2 align-top text-muted-fg">
        <div className="max-w-md" title={assumption.description}>
          {assumption.description}
        </div>
        {assumption.evidenceUrl && (
          <a
            href={assumption.evidenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs text-accent hover:underline"
          >
            evidence ↗
          </a>
        )}
      </td>
      <td className="px-3 py-2 align-top">
        <select
          value={assumption.source}
          onChange={(e) =>
            updateAssumption(scenarioId, assumption.id, {
              kind: 'source',
              value: e.target.value as AssumptionSource,
            })
          }
          aria-label={`Source for ${assumption.topic}`}
          className="rounded border border-border bg-background px-1.5 py-0.5 text-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="mt-1">
          <AssumptionSourceBadge source={assumption.source} />
        </div>
      </td>
      <td className="px-3 py-2 align-top">
        <select
          value={assumption.riskLevel}
          onChange={(e) =>
            updateAssumption(scenarioId, assumption.id, {
              kind: 'riskLevel',
              value: e.target.value as AssumptionRiskLevel,
            })
          }
          aria-label={`Risk for ${assumption.topic}`}
          className="rounded border border-border bg-background px-1.5 py-0.5 text-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {RISKS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <div className="mt-1">
          <AssumptionRiskBadge risk={assumption.riskLevel} />
        </div>
      </td>
      <td className="px-3 py-2 text-right align-top font-mono text-xs tabular-nums text-muted-fg">
        {assumption.linkedEntities.length}
      </td>
      <td className="px-3 py-2 align-top text-xs">
        {reviewLabel ? (
          <span className="text-status-good">{reviewLabel}</span>
        ) : (
          <span className="text-status-warn">never</span>
        )}
      </td>
      <td className="px-3 py-2 align-top">
        <div className="flex items-center justify-end gap-1">
          {!assumption.lastReviewedAt && (
            <button
              type="button"
              onClick={() =>
                markAssumptionReviewed(scenarioId, assumption.id)
              }
              className="rounded px-2 py-0.5 text-xs text-muted-fg hover:bg-muted hover:text-status-good"
              title="Mark as reviewed"
              aria-label={`Mark ${assumption.topic} as reviewed`}
            >
              ✓ Review
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (confirmDelete) {
                deleteAssumption(scenarioId, assumption.id);
                setConfirmDelete(false);
              } else {
                setConfirmDelete(true);
                setTimeout(() => setConfirmDelete(false), 3000);
              }
            }}
            className={
              confirmDelete
                ? 'rounded bg-status-bad/10 px-2 py-0.5 text-xs font-medium text-status-bad'
                : 'rounded px-1.5 py-0.5 text-xs text-muted-fg hover:bg-muted hover:text-status-bad'
            }
            title={confirmDelete ? 'Click again to confirm' : 'Delete'}
            aria-label={
              confirmDelete
                ? `Confirm delete assumption ${assumption.topic}`
                : `Delete assumption ${assumption.topic}`
            }
          >
            {confirmDelete ? 'Confirm?' : '✕'}
          </button>
        </div>
      </td>
    </tr>
  );
}
