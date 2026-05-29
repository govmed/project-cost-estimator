/**
 * GlobalDefensibilityDrawer (M5d-2).
 *
 * The single drawer instance mounted in AppShell. Subscribes to the
 * defensibility store; renders nothing when no KPI is open. This
 * replaces the per-page mounts from M5d-1.
 *
 * Pages just call useDefensibilityStore().open(kind) on click — they
 * don't import the drawer or manage its state.
 */

import { useDefensibilityStore } from '@/data/defensibility-store';
import { useKpiProvenance } from '@/ui/hooks/useKpiProvenance';
import { DefensibilityDrawer } from './DefensibilityDrawer';

export function GlobalDefensibilityDrawer() {
  const openKpi = useDefensibilityStore((s) => s.openKpi);
  const close = useDefensibilityStore((s) => s.close);
  const provenance = useKpiProvenance(openKpi);

  return <DefensibilityDrawer provenance={provenance} onClose={close} />;
}
