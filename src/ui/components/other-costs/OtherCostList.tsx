/**
 * OtherCostList - left pane of Other Costs Planner.
 *
 * Groups by category. Each row shows name + vendor + pricing summary + total
 * dollars (from engine). Hover reveals duplicate/delete actions.
 */

import clsx from 'clsx';
import type { OtherCostLineItem } from '@/types/other-costs';
import type { OtherCostLineItemTotals } from '@/engine/types';
import type { OtherCostLineItemId, ScenarioId } from '@/types/ids';
import { formatMoney } from '@/ui/format';
import { useProjectStore } from '@/data/store';
import { OtherCostCategoryBadge } from './OtherCostCategoryBadge';
import { RowActions } from '@/ui/components/planner/RowActions';

export interface OtherCostListProps {
  items: OtherCostLineItem[];
  totalsByItemId: Map<OtherCostLineItemId, OtherCostLineItemTotals>;
  selectedId: OtherCostLineItemId | null;
  scenarioId: ScenarioId;
  onSelect: (id: OtherCostLineItemId) => void;
}

export function OtherCostList({
  items,
  totalsByItemId,
  selectedId,
  scenarioId,
  onSelect,
}: OtherCostListProps) {
  const deleteItem = useProjectStore((s) => s.deleteOtherCostLineItem);
  const duplicateItem = useProjectStore((s) => s.duplicateOtherCostLineItem);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/10 p-6 text-center text-sm text-muted-fg">
        No other-cost line items yet. Click <span className="font-medium text-foreground">+ Add line item</span> to start.
      </div>
    );
  }

  // Group by category, preserving original insertion order within group
  const grouped: Record<string, OtherCostLineItem[]> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }
  const categories = Object.keys(grouped);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      {categories.map((category) => (
        <div key={category}>
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
            <OtherCostCategoryBadge category={category as OtherCostLineItem['category']} />
            <span className="text-xs uppercase tracking-wide text-muted-fg">
              {grouped[category].length} {grouped[category].length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <ul>
            {grouped[category].map((item) => {
              const totals = totalsByItemId.get(item.id);
              const total = totals?.totalCost.amount ?? 0;
              const isSelected = selectedId === item.id;
              return (
                <li
                  key={item.id}
                  className={clsx(
                    'group flex items-center gap-2 border-b border-border/60 px-3 py-2 transition-colors last:border-b-0',
                    isSelected ? 'bg-accent/10' : 'hover:bg-muted/30',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    aria-pressed={isSelected}
                    className="flex flex-1 min-w-0 items-center gap-3 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {item.name}
                        </span>
                        {item.vendor && (
                          <span className="truncate text-xs text-muted-fg">{item.vendor}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-fg">
                        {formatMoney(item.unitCost)} · {item.pricingUnit} · qty {item.quantity}
                        {item.userCount && ` · ${item.userCount} users`}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-sm tabular-money text-foreground">
                        {formatMoney(total)}
                      </div>
                      {item.includeInRunRate && (
                        <div className="text-[10px] uppercase tracking-wide text-status-good">
                          run-rate
                        </div>
                      )}
                    </div>
                  </button>
                  <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <RowActions
                      rowLabel={item.name}
                      onDuplicate={() => duplicateItem(scenarioId, item.id)}
                      onDelete={() => deleteItem(scenarioId, item.id)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
