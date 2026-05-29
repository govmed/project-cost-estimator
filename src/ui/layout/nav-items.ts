/**
 * Navigation definitions.
 *
 * Single source of truth for both the left rail and the router. Each item
 * has a path, label, an icon glyph (M1b uses simple text/unicode; a later
 * pass swaps in lucide-react icons), and an optional "count" selector that
 * reads from the store to show a badge.
 */

import type { Scenario } from '@/types/scenario';

export interface NavItem {
  path: string;          // relative to /p/:projectId
  label: string;
  glyph: string;         // placeholder icon (unicode) for M1b
  /** Given the active scenario, return a count badge (or null for none). */
  count?: (scenario: Scenario | null) => number | null;
  /** Only show this item when the predicate is true (e.g. M&A mode). */
  visible?: (engagementContext: string) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { path: 'dashboard', label: 'Dashboard', glyph: '◆' },
  { path: 'setup', label: 'Project Setup', glyph: '✎' },
  {
    path: 'resources',
    label: 'Resources',
    glyph: '👥',
    count: (s) => s?.resources.length ?? null,
  },
  {
    path: 'cloud',
    label: 'Cloud',
    glyph: '☁',
    count: (s) => s?.cloudLineItems.length ?? null,
  },
  {
    path: 'other-costs',
    label: 'Other Costs',
    glyph: '$',
    count: (s) => s?.otherCostLineItems.length ?? null,
  },
  {
    path: 'ma-mode',
    label: 'M&A Mode',
    glyph: '⇌',
    visible: (ctx) => ['MAIntegration', 'MACarveOut', 'TSA'].includes(ctx),
  },
  {
    path: 'scenarios',
    label: 'Scenarios',
    glyph: '⇄',
  },
  {
    path: 'assumptions',
    label: 'Assumptions',
    glyph: '✓',
    count: (s) => s?.assumptions.length ?? null,
  },
  { path: 'export', label: 'Export', glyph: '↓' },
  { path: 'audit', label: 'Audit Log', glyph: '🕒' },
];
