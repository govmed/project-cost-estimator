/**
 * CloudPlannerPage - M3a (read-only).
 *
 * Two-pane layout:
 *  - Left: CloudLineItemList (grouped by provider, click to select)
 *  - Right: CloudLineItemDetail (full fields + ramp curve preview)
 *
 * Below the planes: provider summary cards and a "coming next" panel.
 *
 * Engine totals flow through useScenarioTotals (same hook the Dashboard
 * and Resource Planner use). The cloud-line-item totals get keyed into a
 * Map for O(1) lookup by the detail pane.
 */

import { useMemo, useState } from 'react';
import { useProjectStore, selectActiveScenario } from '@/data/store';
import { useScenarioTotals } from '@/hooks/useScenarioTotals';
import type { CloudLineItemId } from '@/types/ids';
import type { CloudLineItemTotals } from '@/engine/types';
import { formatMoney } from '@/ui/format';
import { CloudLineItemList } from '@/ui/components/cloud/CloudLineItemList';
import { CloudLineItemDetail } from '@/ui/components/cloud/CloudLineItemDetail';

export function CloudPlannerPage() {
  const project = useProjectStore((s) => s.project);
  const scenarios = useProjectStore((s) => s.scenarios);
  const activeScenarioId = useProjectStore((s) => s.activeScenarioId);
  const totals = useScenarioTotals();

  const activeScenario = useMemo(
    () => selectActiveScenario({ scenarios, activeScenarioId }),
    [scenarios, activeScenarioId],
  );

  const totalsByItemId = useMemo(() => {
    const map = new Map<CloudLineItemId, CloudLineItemTotals>();
    if (totals) {
      for (const t of totals.cloudLineItems) {
        map.set(t.lineItemId, t);
      }
    }
    return map;
  }, [totals]);

  // Default selection: first item if any
  const items = activeScenario?.cloudLineItems ?? [];
  const [selectedId, setSelectedId] = useState<CloudLineItemId | null>(null);
  const effectiveSelectedId = selectedId ?? items[0]?.id ?? null;

  const selectedItem = useMemo(
    () => items.find((i) => i.id === effectiveSelectedId) ?? null,
    [items, effectiveSelectedId],
  );
  const selectedTotals = effectiveSelectedId
    ? totalsByItemId.get(effectiveSelectedId) ?? null
    : null;

  if (!project || !activeScenario || !totals) {
    return <div className="px-8 py-12 text-muted-fg">No active scenario.</div>;
  }

  // Provider-summary cards
  const providerSubtotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const t = totalsByItemId.get(item.id);
      if (!t) continue;
      map.set(item.provider, (map.get(item.provider) ?? 0) + t.projectDurationCost.amount);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [items, totalsByItemId]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cloud Planner</h1>
          <p className="text-sm text-muted-fg">
            {items.length} {items.length === 1 ? 'line item' : 'line items'} ·{' '}
            {activeScenario.name} · Project total{' '}
            <span className="font-mono tabular-money text-foreground">
              {formatMoney(totals.cloudSubtotal)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-fg opacity-60"
            title="+ Add from catalog — lands in M3b"
          >
            + Add from catalog
          </button>
        </div>
      </div>

      {/* Provider subtotal cards */}
      {providerSubtotals.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {providerSubtotals.map(([provider, total]) => (
            <div
              key={provider}
              className="rounded-lg border border-border bg-background p-3"
            >
              <div className="text-xs font-medium uppercase tracking-wide text-muted-fg">
                {provider}
              </div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-money">
                {formatMoney(total, totals.cloudSubtotal.currency)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main two-pane */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <CloudLineItemList
            items={items}
            totalsByItemId={totalsByItemId}
            selectedId={effectiveSelectedId}
            onSelect={setSelectedId}
          />
        </div>
        <div className="lg:col-span-3">
          <CloudLineItemDetail item={selectedItem} totals={selectedTotals} />
        </div>
      </div>

      {/* Coming next */}
      <div className="mt-6 rounded-lg border border-border bg-background p-4">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-fg">
          Coming next (M3b / M3c)
        </h3>
        <ul className="space-y-1.5 text-sm text-muted-fg">
          <li>• <span className="text-foreground">M3b:</span> editable fields, "+ Add from catalog" flow, delete / duplicate</li>
          <li>• <span className="text-foreground">M3c:</span> Other Costs planner + Project Setup screen</li>
          <li>• <span className="text-foreground">Later:</span> Recharts ramp chart with phase boundary annotations</li>
        </ul>
      </div>
    </div>
  );
}
