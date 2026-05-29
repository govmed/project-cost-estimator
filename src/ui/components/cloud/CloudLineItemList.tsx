/**
 * CloudLineItemList - left pane of the Cloud Planner.
 *
 * M3b adds row action buttons (duplicate, delete) per item. Delete uses
 * the same two-click confirm pattern as RowActions in the Resource Planner.
 */

import clsx from 'clsx';
import type { CloudLineItem, CloudProvider } from '@/types/cloud';
import type { CloudLineItemTotals } from '@/engine/types';
import type { CloudLineItemId, ScenarioId } from '@/types/ids';
import { formatMoney } from '@/ui/format';
import { useProjectStore } from '@/data/store';
import { CloudProviderBadge } from './CloudProviderBadge';
import { RowActions } from '@/ui/components/planner/RowActions';

export interface CloudLineItemListProps {
  items: CloudLineItem[];
  totalsByItemId: Map<CloudLineItemId, CloudLineItemTotals>;
  selectedId: CloudLineItemId | null;
  scenarioId: ScenarioId;
  onSelect: (id: CloudLineItemId) => void;
}

export function CloudLineItemList({
  items,
  totalsByItemId,
  selectedId,
  scenarioId,
  onSelect,
}: CloudLineItemListProps) {
  const deleteItem = useProjectStore((s) => s.deleteCloudLineItem);
  const duplicateItem = useProjectStore((s) => s.duplicateCloudLineItem);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/10 p-6 text-center text-sm text-muted-fg">
        No cloud line items yet. Click <span className="font-medium text-foreground">+ Add from catalog</span> to start.
      </div>
    );
  }

  const grouped: Record<CloudProvider, CloudLineItem[]> = {} as Record<CloudProvider, CloudLineItem[]>;
  for (const item of items) {
    if (!grouped[item.provider]) grouped[item.provider] = [];
    grouped[item.provider].push(item);
  }
  const providers = Object.keys(grouped) as CloudProvider[];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      {providers.map((provider) => (
        <div key={provider}>
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
            <CloudProviderBadge provider={provider} />
            <span className="text-xs uppercase tracking-wide text-muted-fg">
              {grouped[provider].length} {grouped[provider].length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <ul>
            {grouped[provider].map((item) => {
              const totals = totalsByItemId.get(item.id);
              const monthly = totals?.monthlyAtSteadyState.amount ?? 0;
              const isSelected = selectedId === item.id;
              const itemLabel = item.sku ? `${item.service} ${item.sku}` : item.service;
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
                          {item.service}
                        </span>
                        {item.sku && (
                          <span className="truncate font-mono text-xs text-muted-fg">{item.sku}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-fg">
                        {item.category} · {item.environment} · qty {item.quantity}
                        {item.pricingModel !== 'OnDemand' && ` · ${item.pricingModel}`}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-sm tabular-money text-foreground">
                        {formatMoney(monthly)}/mo
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
                      rowLabel={itemLabel}
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
