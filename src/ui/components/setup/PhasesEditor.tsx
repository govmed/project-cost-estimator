/**
 * PhasesEditor - editable list of project phases.
 *
 * Each phase is a row with editable name, duration, offset, order.
 * Trailing delete button per row. "+ Add phase" at the bottom.
 *
 * Phases are sorted by order. Editing the order field re-sorts.
 */

import { useState } from 'react';
import type { Phase } from '@/types/project';
import { useProjectStore } from '@/data/store';
import { EditableField } from '@/ui/components/planner/EditableField';

export function PhasesEditor({ phases }: { phases: Phase[] }) {
  const updatePhase = useProjectStore((s) => s.updatePhase);
  const addPhase = useProjectStore((s) => s.addPhase);
  const deletePhase = useProjectStore((s) => s.deletePhase);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-border bg-background">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/30 text-xs font-medium uppercase tracking-wide text-muted-fg">
          <tr>
            <th className="px-3 py-2 text-left w-16">Order</th>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2 text-right w-32">Offset (weeks)</th>
            <th className="px-3 py-2 text-right w-32">Duration (weeks)</th>
            <th className="px-3 py-2 w-20"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {phases.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-fg">
                No phases defined.
              </td>
            </tr>
          )}
          {phases.map((phase) => {
            const isConfirming = confirmDelete === phase.id;
            return (
              <tr key={phase.id} className="border-b border-border/60 last:border-b-0">
                <td className="px-3 py-2">
                  <EditableField
                    label=""
                    value={phase.order}
                    kind="number"
                    min={1}
                    onCommit={(v) => updatePhase(phase.id, { kind: 'order', value: Number(v) })}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableField
                    label=""
                    value={phase.name}
                    kind="text"
                    onCommit={(v) => updatePhase(phase.id, { kind: 'name', value: String(v) })}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <EditableField
                    label=""
                    value={phase.offsetWeeks}
                    kind="number"
                    min={0}
                    onCommit={(v) =>
                      updatePhase(phase.id, { kind: 'offsetWeeks', value: Number(v) })
                    }
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <EditableField
                    label=""
                    value={phase.durationWeeks}
                    kind="number"
                    min={0}
                    onCommit={(v) =>
                      updatePhase(phase.id, { kind: 'durationWeeks', value: Number(v) })
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isConfirming) {
                        deletePhase(phase.id);
                        setConfirmDelete(null);
                      } else {
                        setConfirmDelete(phase.id);
                        setTimeout(() => setConfirmDelete((cur) => (cur === phase.id ? null : cur)), 3000);
                      }
                    }}
                    className={
                      isConfirming
                        ? 'rounded bg-status-bad/10 px-2 py-1 text-xs font-medium text-status-bad'
                        : 'rounded p-1 text-muted-fg hover:bg-muted hover:text-status-bad'
                    }
                    aria-label={
                      isConfirming
                        ? `Confirm delete phase ${phase.name}`
                        : `Delete phase ${phase.name}`
                    }
                  >
                    {isConfirming ? 'Confirm?' : '✕'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="border-t border-border bg-muted/10 px-3 py-2">
        <button
          type="button"
          onClick={() => {
            const lastOffset = phases.reduce(
              (acc, p) => Math.max(acc, p.offsetWeeks + p.durationWeeks),
              0,
            );
            addPhase({
              name: 'New Phase',
              durationWeeks: 4,
              offsetWeeks: lastOffset,
              order: phases.length + 1,
            });
          }}
          className="text-sm text-accent hover:underline"
        >
          + Add phase
        </button>
      </div>
    </div>
  );
}
