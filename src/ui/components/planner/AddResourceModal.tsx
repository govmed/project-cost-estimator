/**
 * AddResourceModal - the picker for adding a new resource.
 *
 * Flow:
 *  1. Pick a Role (searchable dropdown from the rate card's distinct roles)
 *  2. Pick a Skill Level (filtered to levels available for that role)
 *  3. Pick a Geography (filtered to geos available for that role/level)
 *  4. Optionally provide a name
 *  5. Preview the resolved bill/cost rate
 *  6. Confirm -> add to scenario, close modal
 *
 * The rate card lazy-loads on modal open (~540KB JSON kept out of the
 * initial bundle). A brief loading state shows during the first open.
 */

import { useEffect, useRef, useState } from 'react';
import type { Role, SkillLevel, Geography } from '@/types/resource';
import { formatMoney } from '@/ui/format';
import {
  allRoles,
  levelsForRole,
  geographiesForRoleLevel,
  lookupRate,
  type RateCardMatch,
} from '@/data/rate-card-lookup';
import { resolveRate } from '@/data/api-rate-card';
import type { NewResourceInput } from '@/data/store';

export interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (input: NewResourceInput) => void;
}

export function AddResourceModal({ isOpen, onClose, onAdd }: AddResourceModalProps) {
  const [role, setRole] = useState<Role | ''>('');
  const [level, setLevel] = useState<SkillLevel | ''>('');
  const [geography, setGeography] = useState<Geography | ''>('');
  const [name, setName] = useState('');

  const [roles, setRoles] = useState<Role[]>([]);
  const [levels, setLevels] = useState<SkillLevel[]>([]);
  const [geos, setGeos] = useState<Geography[]>([]);
  const [rateMatch, setRateMatch] = useState<RateCardMatch | null>(null);
  const [rateSource, setRateSource] = useState<string | null>(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const [loadingRate, setLoadingRate] = useState(false);

  const firstInputRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setRole('');
    setLevel('');
    setGeography('');
    setName('');
    setLevels([]);
    setGeos([]);
    setRateMatch(null);
    setRateSource(null);
    setLoadingCard(true);
    let cancelled = false;
    allRoles().then((r) => {
      if (cancelled) return;
      setRoles(r);
      setLoadingCard(false);
      setTimeout(() => firstInputRef.current?.focus(), 0);
    });
    return () => { cancelled = true; };
  }, [isOpen]);

  useEffect(() => {
    if (!role) { setLevels([]); return; }
    let cancelled = false;
    levelsForRole(role).then((l) => { if (!cancelled) setLevels(l); });
    return () => { cancelled = true; };
  }, [role]);

  useEffect(() => {
    if (!role || !level) { setGeos([]); return; }
    let cancelled = false;
    geographiesForRoleLevel(role, level).then((g) => { if (!cancelled) setGeos(g); });
    return () => { cancelled = true; };
  }, [role, level]);

  useEffect(() => {
    if (!role || !level || !geography) { setRateMatch(null); setRateSource(null); return; }
    let cancelled = false;
    setLoadingRate(true);

    async function resolve() {
      // 1. Try local seed rate card first (fast, no network).
      const local = await lookupRate(role as string, level as string, geography as string);
      if (cancelled) return;
      if (local) {
        setRateMatch(local);
        setRateSource('seed rate card');
        setLoadingRate(false);
        return;
      }
      // 2. Fall back to API rate card lookup (OIDC mode; no-op in standalone).
      const api = await resolveRate(
        role as string,
        level as import('@/types/resource').SkillLevel,
        geography as import('@/types/resource').Geography,
      );
      if (cancelled) return;
      if (api) {
        setRateMatch({ billRate: api.billRate, internalCostRate: api.internalCostRate } as RateCardMatch);
        setRateSource(api.source);
      } else {
        setRateMatch(null);
        setRateSource(null);
      }
      setLoadingRate(false);
    }

    void resolve();
    return () => { cancelled = true; };
  }, [role, level, geography]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const canSubmit = !!(role && level && geography) && !loadingRate;

  function handleSubmit() {
    if (!canSubmit) return;
    const fallbackRate = { amount: 0, currency: 'USD' as const };
    onAdd({
      role: role as Role,
      skillLevel: level as SkillLevel,
      geography: geography as Geography,
      billRate: rateMatch?.billRate ?? fallbackRate,
      internalCostRate: rateMatch?.internalCostRate ?? fallbackRate,
      name: name.trim() || undefined,
      defaultAllocationPct: 100,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-resource-title"
    >
      <div className="w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="add-resource-title" className="text-lg font-semibold">Add Resource</h2>
          <button type="button" onClick={onClose} className="text-muted-fg hover:text-foreground" aria-label="Close">✕</button>
        </div>

        {loadingCard ? (
          <div className="py-8 text-center text-sm text-muted-fg">Loading rate card…</div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="role" className="text-xs font-medium uppercase tracking-wide text-muted-fg">Role</label>
              <select
                id="role"
                ref={firstInputRef}
                value={role}
                onChange={(e) => { setRole(e.target.value as Role); setLevel(''); setGeography(''); }}
                className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">— select a role —</option>
                {roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="level" className="text-xs font-medium uppercase tracking-wide text-muted-fg">Skill Level</label>
              <select
                id="level"
                value={level}
                onChange={(e) => { setLevel(e.target.value as SkillLevel); setGeography(''); }}
                disabled={!role || levels.length === 0}
                className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
              >
                <option value="">— select a level —</option>
                {levels.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="geo" className="text-xs font-medium uppercase tracking-wide text-muted-fg">Geography</label>
              <select
                id="geo"
                value={geography}
                onChange={(e) => setGeography(e.target.value as Geography)}
                disabled={!level || geos.length === 0}
                className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
              >
                <option value="">— select a geography —</option>
                {geos.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-xs font-medium uppercase tracking-wide text-muted-fg">
                Name <span className="text-muted-fg/60 normal-case">(optional)</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Leave blank for &quot;TBD&quot;"
                className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {loadingRate && role && level && geography && (
              <div className="text-xs text-muted-fg">Looking up rate…</div>
            )}

            {!loadingRate && rateMatch && (
              <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-fg">Rate card</span>
                  {rateSource && (
                    <span className="text-[10px] text-muted-fg/70">{rateSource}</span>
                  )}
                </div>
                <div className="flex gap-6 font-mono tabular-money">
                  <span>Bill: <span className="font-semibold text-foreground">{formatMoney(rateMatch.billRate)}/hr</span></span>
                  <span className="text-muted-fg">Cost: {formatMoney(rateMatch.internalCostRate)}/hr</span>
                </div>
                <p className="mt-1 text-xs text-muted-fg">Override either rate after adding by expanding the row.</p>
              </div>
            )}

            {!loadingRate && !rateMatch && role && level && geography && (
              <div className="rounded-md border border-border bg-status-warn/10 p-3 text-xs text-muted-fg">
                No rate found for this combination. You can set rates manually after adding.
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border border-border px-3 py-1.5 text-sm hover:bg-muted">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={!canSubmit} className="rounded bg-accent px-3 py-1.5 text-sm text-accent-fg disabled:opacity-50">Add resource</button>
        </div>
      </div>
    </div>
  );
}
