/**
 * AddCloudLineItemModal - "+ Add from catalog" picker.
 *
 * Flow:
 *  1. Pick provider (AWS / Azure)
 *  2. (Loading state while catalog fetches)
 *  3. Pick category to narrow
 *  4. Pick service+SKU+pricingModel combination (catalog entry)
 *  5. Pick environment (auto-populates env multiplier from catalog defaults)
 *  6. Quantity, optional description
 *  7. Preview unit cost; confirm -> add to scenario, close modal
 *
 * Catalogs lazy-load on provider selection. First open of AWS or Azure
 * takes ~half a second; subsequent opens are instant.
 */

import { useEffect, useRef, useState } from 'react';
import type {
  CloudProvider,
  CloudCategory,
  PricingModel,
  Environment,
} from '@/types/cloud';
import { formatMoney } from '@/ui/format';
import {
  CATALOG_PROVIDERS,
  getCatalog,
  getCategoriesFor,
  getEntriesFor,
  type CatalogEntry,
  type ProviderCatalog,
} from '@/data/cloud-catalog-lookup';
import type { NewCloudLineItemInput } from '@/data/store';
import { CloudProviderBadge } from './CloudProviderBadge';

const ENVIRONMENTS: readonly Environment[] = ['dev', 'test', 'staging', 'prod', 'dr'] as const;

export interface AddCloudLineItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (input: NewCloudLineItemInput) => void;
}

export function AddCloudLineItemModal({ isOpen, onClose, onAdd }: AddCloudLineItemModalProps) {
  const [provider, setProvider] = useState<CloudProvider | ''>('');
  const [category, setCategory] = useState<CloudCategory | ''>('');
  const [entryKey, setEntryKey] = useState<string>('');
  const [environment, setEnvironment] = useState<Environment>('prod');
  const [envMultiplier, setEnvMultiplier] = useState<number>(1.0);
  const [quantity, setQuantity] = useState<string>('1');
  const [description, setDescription] = useState('');

  const [catalog, setCatalog] = useState<ProviderCatalog | null>(null);
  const [categories, setCategories] = useState<CloudCategory[]>([]);
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const firstInputRef = useRef<HTMLSelectElement>(null);

  // Reset on open
  useEffect(() => {
    if (!isOpen) return;
    setProvider('');
    setCategory('');
    setEntryKey('');
    setEnvironment('prod');
    setEnvMultiplier(1.0);
    setQuantity('1');
    setDescription('');
    setCatalog(null);
    setCategories([]);
    setEntries([]);
    setLoadingCatalog(false);
    setTimeout(() => firstInputRef.current?.focus(), 0);
  }, [isOpen]);

  // Load catalog when provider chosen
  useEffect(() => {
    if (!provider) return;
    let cancelled = false;
    setLoadingCatalog(true);
    Promise.all([getCatalog(provider), getCategoriesFor(provider)]).then(
      ([cat, cats]) => {
        if (cancelled) return;
        setCatalog(cat);
        setCategories(cats);
        setLoadingCatalog(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [provider]);

  // Load entries when category changes
  useEffect(() => {
    if (!provider || !category) {
      setEntries([]);
      return;
    }
    let cancelled = false;
    getEntriesFor(provider, category).then((es) => {
      if (!cancelled) setEntries(es);
    });
    return () => {
      cancelled = true;
    };
  }, [provider, category]);

  // When environment changes, pull the default multiplier from the catalog
  useEffect(() => {
    if (!catalog) return;
    const def = catalog.environmentMultiplierDefaults[environment];
    if (typeof def === 'number') setEnvMultiplier(def);
  }, [environment, catalog]);

  // Esc closes
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Build a stable key for each entry so the select can pick one
  const entryKeyFor = (e: CatalogEntry, i: number) =>
    `${e.service}::${e.sku ?? ''}::${e.pricingModel}::${i}`;

  const selectedEntry = entries.find((e, i) => entryKeyFor(e, i) === entryKey) ?? null;

  const parsedQty = Number(quantity);
  const validQty = Number.isFinite(parsedQty) && parsedQty > 0;
  const canSubmit = !!(provider && category && selectedEntry && catalog && validQty);

  function handleSubmit() {
    if (!canSubmit || !selectedEntry || !catalog) return;
    onAdd({
      provider: provider as CloudProvider,
      category: category as CloudCategory,
      service: selectedEntry.service,
      sku: selectedEntry.sku,
      region: catalog.region,
      pricingModel: selectedEntry.pricingModel,
      environment,
      environmentMultiplier: envMultiplier,
      unitCost: { amount: selectedEntry.unitCost, currency: catalog.currency },
      quantity: parsedQty,
      unitName: selectedEntry.unitName,
      rampCurve: 'flat',
      includeInRunRate: environment === 'prod',
      description: description.trim() || undefined,
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
      aria-labelledby="add-cloud-title"
    >
      <div className="w-full max-w-2xl rounded-lg border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="add-cloud-title" className="text-lg font-semibold">
            Add Cloud Line Item
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

        <div className="space-y-4">
          {/* Provider */}
          <div className="flex flex-col gap-1">
            <label htmlFor="cloud-provider" className="text-xs font-medium uppercase tracking-wide text-muted-fg">
              Provider
            </label>
            <select
              id="cloud-provider"
              ref={firstInputRef}
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value as CloudProvider);
                setCategory('');
                setEntryKey('');
              }}
              className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">— select a provider —</option>
              {CATALOG_PROVIDERS.map((p) => (
                <option key={p} value={p}>{p.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {loadingCatalog && (
            <div className="py-2 text-sm text-muted-fg">Loading {provider} catalog…</div>
          )}

          {provider && !loadingCatalog && catalog && (
            <>
              {/* Category */}
              <div className="flex flex-col gap-1">
                <label htmlFor="cloud-category" className="text-xs font-medium uppercase tracking-wide text-muted-fg">
                  Category
                </label>
                <select
                  id="cloud-category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as CloudCategory);
                    setEntryKey('');
                  }}
                  className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">— select a category —</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Service / SKU / pricing model */}
              {category && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="cloud-entry" className="text-xs font-medium uppercase tracking-wide text-muted-fg">
                    Service / SKU / Pricing Model
                    <span className="ml-2 text-muted-fg/70 normal-case">
                      ({entries.length} option{entries.length === 1 ? '' : 's'} in {category})
                    </span>
                  </label>
                  <select
                    id="cloud-entry"
                    value={entryKey}
                    onChange={(e) => setEntryKey(e.target.value)}
                    className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="">— select a service —</option>
                    {entries.map((e, i) => (
                      <option key={entryKeyFor(e, i)} value={entryKeyFor(e, i)}>
                        {e.service}
                        {e.sku ? ` · ${e.sku}` : ''}
                        {' · '}{e.pricingModel}
                        {' · '}${e.unitCost}/{e.unitName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Environment + qty side by side */}
              {selectedEntry && (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="cloud-env" className="text-xs font-medium uppercase tracking-wide text-muted-fg">
                        Environment
                      </label>
                      <select
                        id="cloud-env"
                        value={environment}
                        onChange={(e) => setEnvironment(e.target.value as Environment)}
                        className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      >
                        {ENVIRONMENTS.map((e) => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="cloud-mult" className="text-xs font-medium uppercase tracking-wide text-muted-fg">
                        Env Multiplier
                      </label>
                      <input
                        id="cloud-mult"
                        type="number"
                        min="0"
                        step="0.05"
                        value={envMultiplier}
                        onChange={(e) => setEnvMultiplier(Number(e.target.value))}
                        className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="cloud-qty" className="text-xs font-medium uppercase tracking-wide text-muted-fg">
                        Quantity
                      </label>
                      <input
                        id="cloud-qty"
                        type="number"
                        min="1"
                        step="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="cloud-desc" className="text-xs font-medium uppercase tracking-wide text-muted-fg">
                      Description <span className="text-muted-fg/60 normal-case">(optional)</span>
                    </label>
                    <input
                      id="cloud-desc"
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., production web tier autoscaling group"
                      className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  {/* Preview */}
                  <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                    <div className="mb-1 flex items-center gap-2">
                      <CloudProviderBadge provider={provider as CloudProvider} />
                      <span className="text-xs uppercase tracking-wide text-muted-fg">
                        {category}
                      </span>
                    </div>
                    <div className="mb-2 font-medium text-foreground">
                      {selectedEntry.service}
                      {selectedEntry.sku && (
                        <span className="ml-2 font-mono text-xs font-normal text-muted-fg">
                          {selectedEntry.sku}
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs tabular-money text-muted-fg">
                      {formatMoney(selectedEntry.unitCost, catalog.currency)}/{selectedEntry.unitName}
                      {' × '}{envMultiplier.toFixed(2)}
                      {' × '}{validQty ? parsedQty : '?'}
                      {' = '}
                      <span className="font-semibold text-foreground">
                        {validQty
                          ? formatMoney(
                              selectedEntry.unitCost * envMultiplier * parsedQty,
                              catalog.currency,
                            )
                          : '—'}
                      </span>
                      {' / month'}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
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
