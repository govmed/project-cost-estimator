/**
 * ResourceTable - dense editable table at the heart of the Resource Planner.
 *
 * M2c additions on top of M2b:
 *  - Trailing Actions column with Duplicate + Delete buttons
 *  - Empty state row when filters return no resources
 */

import { useState, Fragment } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
} from '@tanstack/react-table';
import clsx from 'clsx';
import type { Phase } from '@/types/project';
import type { ResourceId, ScenarioId, PhaseId } from '@/types/ids';
import { formatMoney, formatPercent } from '@/ui/format';
import { useProjectStore } from '@/data/store';
import type { ResourceRow } from './build-rows';
import { phaseShortLabel } from './phase-labels';
import { EditableNumericCell } from './EditableNumericCell';
import { ResourceRowExpanded } from './ResourceRowExpanded';
import { RowActions } from './RowActions';

const columnHelper = createColumnHelper<ResourceRow>();

export interface ResourceTableProps {
  rows: ResourceRow[];
  phases: Phase[];
  scenarioId: ScenarioId;
  totalsFooter: {
    hours: number;
    billed: number;
    cost: number;
    marginPct: number;
  };
  /** Total rows in the scenario before filtering, for empty-state messaging. */
  unfilteredCount: number;
}

export function ResourceTable({
  rows,
  phases,
  scenarioId,
  totalsFooter,
  unfilteredCount,
}: ResourceTableProps) {
  const updateResourceAllocation = useProjectStore((s) => s.updateResourceAllocation);
  const deleteResource = useProjectStore((s) => s.deleteResource);
  const duplicateResource = useProjectStore((s) => s.duplicateResource);
  const [expandedIds, setExpandedIds] = useState<Set<ResourceId>>(new Set());

  function toggleExpand(id: ResourceId) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const columns = [
    columnHelper.accessor((row) => row.resource, {
      id: 'identity',
      header: 'Role / Level / Geo',
      cell: (info) => {
        const r = info.getValue();
        const isOpen = expandedIds.has(r.id);
        return (
          <button
            type="button"
            onClick={() => toggleExpand(r.id)}
            className="flex w-full items-center gap-2 rounded text-left hover:bg-transparent"
            aria-expanded={isOpen}
            aria-label={`${isOpen ? 'Collapse' : 'Expand'} details for ${r.role}`}
          >
            <span className={clsx('w-3 text-muted-fg transition-transform', isOpen && 'rotate-90')}>
              ▸
            </span>
            <div className="flex flex-col leading-tight">
              <span className="font-medium text-foreground">{r.role}</span>
              <span className="text-xs text-muted-fg">
                {r.skillLevel} · {r.geography}
                {r.name && r.name !== 'TBD' ? ` · ${r.name}` : ''}
              </span>
            </div>
          </button>
        );
      },
    }),

    ...phases.map((phase) =>
      columnHelper.accessor((row) => row.allocationByPhase[phase.id] ?? 0, {
        id: `phase-${phase.id}`,
        header: () => (
          <div className="text-center text-xs font-medium uppercase tracking-wide">
            {phaseShortLabel(phase)}
          </div>
        ),
        cell: (info) => {
          const value = info.getValue();
          const resource = info.row.original.resource;
          return (
            <div className="flex justify-center">
              <EditableNumericCell
                value={value}
                onCommit={(newPct) =>
                  updateResourceAllocation(
                    scenarioId,
                    resource.id,
                    phase.id as PhaseId,
                    newPct,
                  )
                }
                label={`${resource.role} ${phase.name} allocation`}
              />
            </div>
          );
        },
      }),
    ),

    columnHelper.accessor((row) => row.totals.totalHours, {
      id: 'hours',
      header: () => <div className="text-right">Hours</div>,
      cell: (info) => (
        <div className="text-right font-mono text-sm tabular-nums text-foreground">
          {Math.round(info.getValue()).toLocaleString()}
        </div>
      ),
    }),

    columnHelper.accessor((row) => row.totals.billedAmount.amount, {
      id: 'billed',
      header: () => <div className="text-right">Bill</div>,
      cell: (info) => (
        <div className="text-right font-mono text-sm tabular-money text-foreground">
          {formatMoney(info.getValue())}
        </div>
      ),
    }),

    columnHelper.accessor((row) => row.totals.internalCost.amount, {
      id: 'cost',
      header: () => <div className="text-right">Cost</div>,
      cell: (info) => (
        <div className="text-right font-mono text-sm tabular-money text-muted-fg">
          {formatMoney(info.getValue())}
        </div>
      ),
    }),

    columnHelper.accessor((row) => row.totals.marginPct, {
      id: 'margin',
      header: () => <div className="text-right">M%</div>,
      cell: (info) => {
        const v = info.getValue();
        const color =
          v < 0 ? 'text-status-bad' : v < 15 ? 'text-status-warn' : 'text-status-good';
        return (
          <div className={clsx('text-right font-mono text-sm tabular-nums', color)}>
            {formatPercent(v)}
          </div>
        );
      },
    }),

    // Actions column (M2c)
    columnHelper.display({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: (info) => {
        const r = info.row.original.resource;
        return (
          <RowActions
            rowLabel={r.role}
            onDuplicate={() => duplicateResource(scenarioId, r.id)}
            onDelete={() => deleteResource(scenarioId, r.id)}
          />
        );
      },
    }),
  ];

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const colCount = columns.length;

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-background">
      <table className="w-full min-w-[1000px] text-sm">
        <thead className="border-b border-border bg-muted/30 text-xs font-medium uppercase tracking-wide text-muted-fg">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={clsx(
                    'px-3 py-2 text-left',
                    header.id.startsWith('phase-') && 'w-14',
                    header.id === 'identity' && 'min-w-[16rem]',
                    header.id === 'actions' && 'w-20',
                  )}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={colCount} className="px-6 py-10 text-center text-sm text-muted-fg">
                {unfilteredCount === 0
                  ? 'No resources yet. Click "+ Add resource" to start staffing.'
                  : 'No resources match the current filters.'}
              </td>
            </tr>
          )}
          {table.getRowModel().rows.map((row) => {
            const resource = row.original.resource;
            const isExpanded = expandedIds.has(resource.id);
            return (
              <Fragment key={row.id}>
                <tr
                  className={clsx(
                    'border-b border-border/60 transition-colors',
                    isExpanded ? 'bg-muted/30' : 'hover:bg-muted/20',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2.5 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                {isExpanded && (
                  <tr className="border-b border-border bg-muted/20">
                    <td colSpan={colCount} className="px-4 py-3">
                      <ResourceRowExpanded resource={resource} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
        {rows.length > 0 && (
          <tfoot className="border-t-2 border-border bg-muted/40 font-medium">
            <tr>
              <td className="px-3 py-2.5 text-xs uppercase tracking-wide text-muted-fg">
                Totals ({rows.length} {rows.length === 1 ? 'resource' : 'resources'})
                {unfilteredCount !== rows.length && (
                  <span className="ml-1 text-muted-fg/70"> of {unfilteredCount}</span>
                )}
              </td>
              {phases.map((p) => (
                <td key={p.id} />
              ))}
              <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums">
                {Math.round(totalsFooter.hours).toLocaleString()}
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-sm tabular-money">
                {formatMoney(totalsFooter.billed)}
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-sm tabular-money text-muted-fg">
                {formatMoney(totalsFooter.cost)}
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-sm tabular-nums">
                {formatPercent(totalsFooter.marginPct)}
              </td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
