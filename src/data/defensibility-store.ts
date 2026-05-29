/**
 * Defensibility store (M5d-2).
 *
 * Lifts the "which KPI is being explained" state out of per-page useState
 * into a single Zustand store. The drawer is now mounted once in AppShell,
 * not per-page. Any clickable surface calls openDefensibility(kind).
 *
 * Why: with 7+ surfaces wired in M5d-2 (Dashboard's 4 tiles, Compare grid
 * cards, top-rail KPIs, Resource Bill column), per-page state duplicates
 * the drawer mount + provenance hook 7 times. One store, one drawer, many
 * call sites is simpler.
 */

import { create } from 'zustand';
import type { KpiKind } from './kpi-provenance-types';

interface DefensibilityState {
  /** The currently-open KPI, or null if the drawer is closed. */
  openKpi: KpiKind | null;
  open(kind: KpiKind): void;
  close(): void;
}

export const useDefensibilityStore = create<DefensibilityState>((set) => ({
  openKpi: null,
  open(kind) {
    set({ openKpi: kind });
  },
  close() {
    set({ openKpi: null });
  },
}));
