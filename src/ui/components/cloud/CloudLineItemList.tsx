/**
 * CloudLineItemList - the left pane of the Cloud Planner.
 *
 * Shows all cloud line items grouped by provider, with a compact
 * one-line-per-item summary. Clicking selects the item; the parent
 * page shows the detail in the right pane.
 *
 * Each item shows: provider badge, service/SKU, environment indicator,
 * monthly spend, and a small chevron when selected.
 */

import clsx from 'clsx';
import type { CloudLineItem, CloudProvider } from '@/types/cloud';
import type { CloudLineItemTotals } from '@/engine/types';
import type { CloudLineItemId } from '@/types/ids';
import { formatMoney } from '@/ui/format';
import { CloudProviderBadge } from './CloudProviderBadge';

export interface CloudLineItemListProps {
  items: CloudLineItem[];
  totalsByItemId: Map<CloudLineItemId, CloudLineItemTotals>;
  selectedId: CloudLineItemId | null;
  onSelect: (id: CloudLineItemId) => void;
}

export function CloudLineItemList({
  items,
  totalsByItemId,
  selectedId,
  onSelect,
}: CloudLineItemListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/10 p-6 text-center text-sm text-muted-fg">
        No cloud line items yet. M3b will add the "+ Add from catalog" flow.
      </div>
    );
  }

  // Group by provider, preserving original order within each group.
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
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    aria-pressed={isSelected}
                    className={clsx(
                      'flex w-full items-center gap-3 border-b border-border/60 px-3 py-2 text-left transition-colors last:border-b-0',
                      isSelected
                        ? 'bg-accent/10'
                        : 'hover:bg-muted/30',
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {item.service}
                        </span>
                        {item.sku && (
                          <span className="truncate font-mono text-xs text-muted-fg">
                            {item.sku}
                          </span>
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
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
