/**
 * ResourceTable - the dense table at the heart of the Resource Planner.
 *
 * Columns (read-only in M2a; inline editing lands in M2b):
 *   - Role / Level / Geo (combined cell, 2 lines)
 *   - One column per phase showing allocation %
 *   - Hours (total across all phases)
 *   - Bill (billed amount)
 *   - Cost (internal cost)
 *   - Margin %
 *
 * Built with TanStack Table for the headless flexibility we'll need in
 * M2b (cell editing, keyboard nav). M2a uses only the most basic features:
 * column definitions, useReactTable, flexRender.
 */

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
} from '@tanstack/react-table';
import clsx from 'clsx';
import type { Phase } from '@/types/project';
import { formatMoney, formatPercent } from '@/ui/format';
import type { ResourceRow } from './build-rows';
import { phaseShortLabel } from './phase-labels';

const columnHelper = createColumnHelper<ResourceRow>();

export interface ResourceTableProps {
  rows: ResourceRow[];
  phases: Phase[];
  /** Subtotals shown in the footer row. */
  totalsFooter: {
    hours: number;
    billed: number;
    cost: number;
    marginPct: number;
  };
}

export function ResourceTable({ rows, phases, totalsFooter }: ResourceTableProps) {
  // Build columns dynamically because phase columns depend on the project.
  const columns = [
    columnHelper.accessor((row) => row.resource, {
      id: 'identity',
      header: 'Role / Level / Geo',
      cell: (info) => {
        const r = info.getValue();
        return (
          <div className="flex flex-col leading-tight">
            <span className="font-medium text-foreground">{r.role}</span>
            <span className="text-xs text-muted-fg">
              {r.skillLevel} · {r.geography}
              {r.name && r.name !== 'TBD' ? ` · ${r.name}` : ''}
            </span>
          </div>
        );
      },
    }),

    // One column per phase
    ...phases.map((phase) =>
      columnHelper.accessor((row) => row.allocationByPhase[phase.id] ?? 0, {
        id: `phase-${phase.id}`,
        header: () => (
          <div className="text-center text-xs font-medium uppercase tracking-wide">
            {phaseShortLabel(phase)}
          </div>
        ),
        cell: (info) => {
          const v = info.getValue();
          return (
            <div
              className={clsx(
                'text-center font-mono text-sm tabular-nums',
                v === 0 ? 'text-muted-fg/40' : 'text-foreground',
              )}
            >
              {v}
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
          v < 0
            ? 'text-status-bad'
            : v < 15
              ? 'text-status-warn'
              : 'text-status-good';
        return (
          <div className={clsx('text-right font-mono text-sm tabular-nums', color)}>
            {formatPercent(v)}
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-background">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="border-b border-border bg-muted/30 text-xs font-medium uppercase tracking-wide text-muted-fg">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={clsx(
                    'px-3 py-2 text-left',
                    header.id.startsWith('phase-') && 'w-14',
                    header.id === 'identity' && 'min-w-[14rem]',
                  )}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border/60 transition-colors hover:bg-muted/30"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2.5">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-border bg-muted/40 font-medium">
          <tr>
            <td className="px-3 py-2.5 uppercase tracking-wide text-xs text-muted-fg">
              Totals ({rows.length} {rows.length === 1 ? 'resource' : 'resources'})
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
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
