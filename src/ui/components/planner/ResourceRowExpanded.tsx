/**
 * ResourceRowExpanded - the per-row form that appears when a row is expanded.
 *
 * Layout:
 *   [Name] [Bill Rate] [Cost Rate] [Hours/Wk] [Util %]
 *   [Notes (textarea)]
 *
 * All fields edit-in-place via EditableField. Commits go to the store via
 * updateResourceField; each commit produces an audit entry.
 *
 * Override indicators: bill/cost rates show a "(edited)" badge when the
 * value differs from the rate card (billRateOverridden / internalCostRateOverridden).
 */

import { useProjectStore } from '@/data/store';
import { useActiveScenarioId } from '@/hooks/useActiveScenarioId';
import type { Resource } from '@/types/resource';
import { EditableField } from './EditableField';

export function ResourceRowExpanded({ resource }: { resource: Resource }) {
  const activeScenarioId = useActiveScenarioId();
  const updateResourceField = useProjectStore((s) => s.updateResourceField);

  if (!activeScenarioId) return null;

  const commit = (field: Parameters<typeof updateResourceField>[2]) => {
    updateResourceField(activeScenarioId, resource.id, field);
  };

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <EditableField
          label="Name"
          value={resource.name ?? ''}
          kind="text"
          onCommit={(v) => commit({ kind: 'name', value: String(v) })}
        />

        <div className="flex flex-col gap-1">
          <EditableField
            label="Bill Rate"
            value={resource.billRate.amount}
            kind="number"
            min={0}
            prefix="$"
            suffix="/hr"
            onCommit={(v) => commit({ kind: 'billRate', amount: Number(v) })}
          />
          {resource.billRateOverridden && (
            <span className="text-[10px] font-medium uppercase tracking-wide text-status-warn">
              edited (off rate card)
            </span>
          )}
        </div>

        <EditableField
          label="Cost Rate"
          value={resource.internalCostRate.amount}
          kind="number"
          min={0}
          prefix="$"
          suffix="/hr"
          onCommit={(v) => commit({ kind: 'internalCostRate', amount: Number(v) })}
        />

        <EditableField
          label="Hours / Week"
          value={resource.hoursPerWeek}
          kind="number"
          min={0}
          max={80}
          onCommit={(v) => commit({ kind: 'hoursPerWeek', value: Number(v) })}
        />

        <EditableField
          label="Utilization"
          value={resource.utilizationPct}
          kind="number"
          min={0}
          max={100}
          suffix="%"
          onCommit={(v) => commit({ kind: 'utilizationPct', value: Number(v) })}
        />
      </div>

      <div className="mt-4">
        <EditableField
          label="Notes"
          value={resource.notes ?? ''}
          kind="text"
          multiline
          onCommit={(v) => commit({ kind: 'notes', value: String(v) })}
        />
      </div>
    </div>
  );
}
