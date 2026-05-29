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
  const [loadingCard, setLoadingCard] = useState(false);

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
    if (!role || !level || !geography) { setRateMatch(null); return; }
    let cancelled = false;
    lookupRate(role, level, geography).then((m) => { if (!cancelled) setRateMatch(m); });
    return () => { cancelled = true; };
  }, [role, level, geography]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const canSubmit = !!(role && level && geography && rateMatch);

  function handleSubmit() {
    if (!canSubmit || !rateMatch) return;
    onAdd({
      role: role as Role,
      skillLevel: level as SkillLevel,
      geography: geography as Geography,
      billRate: rateMatch.billRate,
      internalCostRate: rateMatch.internalCostRate,
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

            {rateMatch && (
              <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-fg">From rate card</div>
                <div className="flex gap-6 font-mono tabular-money">
                  <span>Bill: <span className="font-semibold text-foreground">{formatMoney(rateMatch.billRate)}/hr</span></span>
                  <span className="text-muted-fg">Cost: {formatMoney(rateMatch.internalCostRate)}/hr</span>
                </div>
                <p className="mt-1 text-xs text-muted-fg">You can override either rate after adding by expanding the row.</p>
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
