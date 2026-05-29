/**
 * AddOtherCostModal - the form to add a new other-cost line item.
 *
 * No catalog — other costs are typed in by hand. Required: category, name,
 * unit cost, quantity, pricing unit. Optional: vendor, description,
 * phase scoping, run-rate inclusion.
 */

import { useEffect, useRef, useState } from 'react';
import type { OtherCostCategory, PricingUnit } from '@/types/other-costs';
import type { Phase } from '@/types/project';
import type { PhaseId } from '@/types/ids';
import type { CurrencyCode } from '@/types/money';
import type { NewOtherCostInput } from '@/data/store';

const CATEGORIES: OtherCostCategory[] = [
  'SoftwareLicense',
  'SaaSSubscription',
  'Hardware',
  'Endpoint',
  'TravelExpense',
  'Training',
  'KnowledgeTransfer',
  'Subcontractor',
  'PartnerPassthrough',
  'Compliance',
  'Insurance',
  'Other',
];

const PRICING_UNITS: PricingUnit[] = [
  'OneTime',
  'PerMonth',
  'PerYear',
  'PerUser',
  'PerUserPerMonth',
  'PerHour',
];

export interface AddOtherCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (input: NewOtherCostInput) => void;
  phases: Phase[];
  baseCurrency: CurrencyCode;
}

export function AddOtherCostModal({
  isOpen,
  onClose,
  onAdd,
  phases,
  baseCurrency,
}: AddOtherCostModalProps) {
  const [category, setCategory] = useState<OtherCostCategory>('SoftwareLicense');
  const [name, setName] = useState('');
  const [vendor, setVendor] = useState('');
  const [unitCost, setUnitCost] = useState('0');
  const [quantity, setQuantity] = useState('1');
  const [pricingUnit, setPricingUnit] = useState<PricingUnit>('OneTime');
  const [userCount, setUserCount] = useState('');
  const [phaseSelection, setPhaseSelection] = useState<string>(''); // '' = unassigned
  const [includeInRunRate, setIncludeInRunRate] = useState(false);
  const [description, setDescription] = useState('');

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCategory('SoftwareLicense');
    setName('');
    setVendor('');
    setUnitCost('0');
    setQuantity('1');
    setPricingUnit('OneTime');
    setUserCount('');
    setPhaseSelection('');
    setIncludeInRunRate(false);
    setDescription('');
    setTimeout(() => firstInputRef.current?.focus(), 0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const needsUserCount = pricingUnit === 'PerUser' || pricingUnit === 'PerUserPerMonth';
  const parsedUnitCost = Number(unitCost);
  const parsedQty = Number(quantity);
  const parsedUserCount = Number(userCount);

  const validName = name.trim().length > 0;
  const validUnitCost = Number.isFinite(parsedUnitCost) && parsedUnitCost >= 0;
  const validQty = Number.isFinite(parsedQty) && parsedQty > 0;
  const validUserCount =
    !needsUserCount ||
    (Number.isFinite(parsedUserCount) && parsedUserCount > 0);

  const canSubmit = validName && validUnitCost && validQty && validUserCount;

  function handleSubmit() {
    if (!canSubmit) return;
    onAdd({
      category,
      name: name.trim(),
      vendor: vendor.trim() || undefined,
      description: description.trim() || undefined,
      unitCost: { amount: parsedUnitCost, currency: baseCurrency },
      quantity: parsedQty,
      pricingUnit,
      userCount: needsUserCount ? parsedUserCount : undefined,
      phaseId: phaseSelection ? (phaseSelection as PhaseId) : undefined,
      includeInRunRate,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-other-cost-title"
    >
      <div className="w-full max-w-xl rounded-lg border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="add-other-cost-title" className="text-lg font-semibold">
            Add Other-Cost Line Item
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-fg hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as OtherCostCategory)}
              className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Name">
            <input
              ref={firstInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Splunk Enterprise license"
              className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </Field>

          <Field label="Vendor (optional)">
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g., Splunk Inc."
              className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label={`Unit Cost (${baseCurrency})`}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </Field>
            <Field label="Quantity">
              <input
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </Field>
            <Field label="Pricing Unit">
              <select
                value={pricingUnit}
                onChange={(e) => setPricingUnit(e.target.value as PricingUnit)}
                className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {PRICING_UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </Field>
          </div>

          {needsUserCount && (
            <Field label="User Count">
              <input
                type="number"
                min="1"
                step="1"
                value={userCount}
                onChange={(e) => setUserCount(e.target.value)}
                placeholder="Required for Per User pricing"
                className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </Field>
          )}

          <Field label="Phase (optional)">
            <select
              value={phaseSelection}
              onChange={(e) => setPhaseSelection(e.target.value)}
              className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">(spread across whole project)</option>
              {phases.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Description (optional)">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeInRunRate}
              onChange={(e) => setIncludeInRunRate(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Include in steady-state Run-Rate projections
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded bg-accent px-3 py-1.5 text-sm text-accent-fg disabled:opacity-50"
          >
            Add line item
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-fg">{label}</span>
      {children}
    </div>
  );
}
