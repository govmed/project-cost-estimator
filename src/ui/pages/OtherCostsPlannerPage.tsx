/**
 * OtherCostsPlannerPage - M3c.
 *
 * Same list/detail pattern as Cloud Planner but with no catalog. Categories
 * include software/SaaS licenses, hardware, travel/training, subcontractors,
 * compliance, and a few more.
 */

import { useEffect, useMemo, useState } from 'react';
import { useProjectStore, selectActiveScenario } from '@/data/store';
import { useScenarioTotals } from '@/hooks/useScenarioTotals';
import type { OtherCostLineItemId } from '@/types/ids';
import type { OtherCostLineItemTotals } from '@/engine/types';
import { formatMoney } from '@/ui/format';
import { OtherCostList } from '@/ui/components/other-costs/OtherCostList';
import { OtherCostDetail } from '@/ui/components/other-costs/OtherCostDetail';
import { AddOtherCostModal } from '@/ui/components/other-costs/AddOtherCostModal';

export function OtherCostsPlannerPage() {
  const project = useProjectStore((s) => s.project);
  const scenarios = useProjectStore((s) => s.scenarios);
  const activeScenarioId = useProjectStore((s) => s.activeScenarioId);
  const addOtherCost = useProjectStore((s) => s.addOtherCostLineItem);
  const totals = useScenarioTotals();

  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<OtherCostLineItemId | null>(null);

  const activeScenario = useMemo(
    () => selectActiveScenario({ scenarios, activeScenarioId }),
    [scenarios, activeScenarioId],
  );

  const totalsByItemId = useMemo(() => {
    const map = new Map<OtherCostLineItemId, OtherCostLineItemTotals>();
    if (totals) {
      for (const t of totals.otherCostLineItems) {
        map.set(t.lineItemId, t);
      }
    }
    return map;
  }, [totals]);

  const items = activeScenario?.otherCostLineItems ?? [];

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

  const categorySubtotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const t = totalsByItemId.get(item.id);
      if (!t) continue;
      map.set(item.category, (map.get(item.category) ?? 0) + t.totalCost.amount);
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
          <h1 className="text-2xl font-semibold">Other Costs</h1>
          <p className="text-sm text-muted-fg">
            {items.length} {items.length === 1 ? 'line item' : 'line items'} ·{' '}
            {activeScenario.name} · Project total{' '}
            <span className="font-mono tabular-money text-foreground">
              {formatMoney(totals.otherCostsSubtotal)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="rounded-md bg-accent px-3 py-1.5 text-sm text-accent-fg hover:bg-accent/90"
          >
            + Add line item
          </button>
        </div>
      </div>

      {categorySubtotals.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categorySubtotals.slice(0, 4).map(([cat, total]) => (
            <div key={cat} className="rounded-lg border border-border bg-background p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-fg">
                {cat}
              </div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-money">
                {formatMoney(total, totals.otherCostsSubtotal.currency)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <OtherCostList
            items={items}
            totalsByItemId={totalsByItemId}
            selectedId={effectiveSelectedId}
            scenarioId={activeScenario.id}
            onSelect={setSelectedId}
          />
        </div>
        <div className="lg:col-span-3">
          <OtherCostDetail
            item={selectedItem}
            totals={selectedTotals}
            phases={project.phases}
            scenarioId={activeScenario.id}
          />
        </div>
      </div>

      <AddOtherCostModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(input) => {
          const newId = addOtherCost(activeScenario.id, input);
          setSelectedId(newId);
        }}
        phases={project.phases}
        baseCurrency={project.baseCurrency}
      />
    </div>
  );
}
