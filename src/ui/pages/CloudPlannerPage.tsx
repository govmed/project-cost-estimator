/**
 * CloudPlannerPage - M3b.
 *
 * Builds on M3a (read-only) and adds:
 *  - "+ Add from catalog" opens AddCloudLineItemModal (now enabled)
 *  - Per-row duplicate/delete in the list
 *  - All detail-pane fields editable
 *  - Newly-added items auto-select
 *
 * Engine totals flow through useScenarioTotals; every edit triggers a
 * fresh calculate() pass, so detail computed fields update live.
 */

import { useEffect, useMemo, useState } from 'react';
import { useProjectStore, selectActiveScenario } from '@/data/store';
import { useScenarioTotals } from '@/hooks/useScenarioTotals';
import type { CloudLineItemId } from '@/types/ids';
import type { CloudLineItemTotals } from '@/engine/types';
import { formatMoney } from '@/ui/format';
import { CloudLineItemList } from '@/ui/components/cloud/CloudLineItemList';
import { CloudLineItemDetail } from '@/ui/components/cloud/CloudLineItemDetail';
import { AddCloudLineItemModal } from '@/ui/components/cloud/AddCloudLineItemModal';

export function CloudPlannerPage() {
  const project = useProjectStore((s) => s.project);
  const scenarios = useProjectStore((s) => s.scenarios);
  const activeScenarioId = useProjectStore((s) => s.activeScenarioId);
  const addCloudLineItem = useProjectStore((s) => s.addCloudLineItem);
  const totals = useScenarioTotals();

  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<CloudLineItemId | null>(null);

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

  const items = activeScenario?.cloudLineItems ?? [];

  // If the selected item gets deleted (no longer in items), drop the selection
  // so it falls back to the first item via effectiveSelectedId.
  useEffect(() => {
    if (selectedId && !items.find((i) => i.id === selectedId)) {
      setSelectedId(null);
    }
  }, [selectedId, items]);

  const effectiveSelectedId = selectedId ?? items[0]?.id ?? null;
  const selectedItem = useMemo(
    () => items.find((i) => i.id === effectiveSelectedId) ?? null,
    [items, effectiveSelectedId],
  );
  const selectedTotals = effectiveSelectedId
    ? totalsByItemId.get(effectiveSelectedId) ?? null
    : null;

  const providerSubtotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const t = totalsByItemId.get(item.id);
      if (!t) continue;
      map.set(item.provider, (map.get(item.provider) ?? 0) + t.projectDurationCost.amount);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [items, totalsByItemId]);

  if (!project || !activeScenario || !totals) {
    return <div className="px-8 py-12 text-muted-fg">No active scenario.</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
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
            onClick={() => setAddOpen(true)}
            className="rounded-md bg-accent px-3 py-1.5 text-sm text-accent-fg hover:bg-accent/90"
          >
            + Add from catalog
          </button>
        </div>
      </div>

      {providerSubtotals.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {providerSubtotals.map(([provider, total]) => (
            <div key={provider} className="rounded-lg border border-border bg-background p-3">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <CloudLineItemList
            items={items}
            totalsByItemId={totalsByItemId}
            selectedId={effectiveSelectedId}
            scenarioId={activeScenario.id}
            onSelect={setSelectedId}
          />
        </div>
        <div className="lg:col-span-3">
          <CloudLineItemDetail
            item={selectedItem}
            totals={selectedTotals}
            scenarioId={activeScenario.id}
          />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-background p-4">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-fg">
          Coming next (M3c)
        </h3>
        <ul className="space-y-1.5 text-sm text-muted-fg">
          <li>• <span className="text-foreground">Other Costs Planner</span> — licenses, hardware, travel, training, subcontractors</li>
          <li>• <span className="text-foreground">Project Setup screen</span> — phases, contingency, FX rates, target margin</li>
          <li>• <span className="text-foreground">Closes M3</span> — full-estimate workflow from scratch</li>
        </ul>
      </div>

      <p className="mt-4 text-xs text-muted-fg">
        Every edit creates an audit entry in{' '}
        <span className="font-mono">sow-calc:audit:{project.id}</span>. The Audit
        Log screen lands in M5.
      </p>

      <AddCloudLineItemModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(input) => {
          const newId = addCloudLineItem(activeScenario.id, input);
          setSelectedId(newId);
        }}
      />
    </div>
  );
}
