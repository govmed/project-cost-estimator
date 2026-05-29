/**
 * MAModePage - M4d.
 *
 * Replaces the placeholder /ma-mode route with the real M&A overlay screen.
 *
 * Layout:
 *  - Banner explaining preview status (overlay doesn't affect top-rail KPIs)
 *  - Mode selector (TSA / Carve-out / Integration)
 *  - Mode-specific input form
 *  - Impact summary panel using engine output
 *
 * If the scenario has no maData yet, the page shows an empty state with
 * three "Configure {mode}" CTAs.
 *
 * Visibility: per the wireframe, this screen should only be reachable when
 * project.engagementContext is MAIntegration / MACarveOut / TSA. The left
 * rail handles that gating; the route itself stays accessible so dealmakers
 * can preview the math regardless.
 */

import { useMemo } from 'react';
import { useProjectStore, selectActiveScenario } from '@/data/store';
import { useScenarioTotals } from '@/hooks/useScenarioTotals';
import type { MAModeData } from '@/types/scenario';
import { TSAForm } from '@/ui/components/ma/TSAForm';
import { CarveOutForm } from '@/ui/components/ma/CarveOutForm';
import { IntegrationForm } from '@/ui/components/ma/IntegrationForm';
import { OverlayImpactSummary } from '@/ui/components/ma/OverlayImpactSummary';

type Mode = 'TSA' | 'CarveOut' | 'Integration';

const MODE_LABELS: Record<Mode, string> = {
  TSA: 'TSA',
  CarveOut: 'Carve-out',
  Integration: 'Integration',
};

// Default starting values when the user picks a mode for the first time
const DEFAULTS: Record<Mode, MAModeData> = {
  TSA: { mode: 'TSA', tsaDurationMonths: 12, tsaExitRampPct: 8 },
  CarveOut: {
    mode: 'CarveOut',
    separationOneTimeCostMultiplier: 1.4,
    dissynergiesAnnualPct: 3,
  },
  Integration: {
    mode: 'Integration',
    synergyTargetAnnual: 0,
    synergyRealizationMonths: 24,
    oneTimeIntegrationCost: 0,
  },
};

export function MAModePage() {
  const project = useProjectStore((s) => s.project);
  const scenarios = useProjectStore((s) => s.scenarios);
  const activeScenarioId = useProjectStore((s) => s.activeScenarioId);
  const updateMAData = useProjectStore((s) => s.updateMAData);
  const totals = useScenarioTotals();

  const activeScenario = useMemo(
    () => selectActiveScenario({ scenarios, activeScenarioId }),
    [scenarios, activeScenarioId],
  );

  if (!project || !activeScenario) {
    return <div className="px-8 py-12 text-muted-fg">No active scenario.</div>;
  }

  const maData = activeScenario.maData;
  const currentMode: Mode | null = maData?.mode ?? null;

  function setMode(mode: Mode) {
    // Switching mode replaces maData with the defaults for the new mode.
    // The previous mode's inputs are lost - by design per the wireframe.
    updateMAData(activeScenario!.id, DEFAULTS[mode]);
  }

  function clearMode() {
    updateMAData(activeScenario!.id, null);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">M&amp;A Mode</h1>
            <p className="text-sm text-muted-fg">
              Overlay TSA / Carve-out / Integration math on top of the active scenario
              ({activeScenario.name}).
            </p>
          </div>
          {currentMode && (
            <button
              type="button"
              onClick={clearMode}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Clear overlay
            </button>
          )}
        </div>
      </div>

      {/* Preview banner */}
      <div className="rounded-md border border-status-warn/30 bg-status-warn/5 px-3 py-2 text-xs text-muted-fg">
        <span className="font-medium text-foreground">Preview math.</span>{' '}
        Numbers shown here are projections based on your inputs; they don't yet
        flow into the top-rail KPIs. Use this screen to capture assumptions and
        size the overlay impact; the rollup into Final Price is a future feature.
      </div>

      {/* Mode selector */}
      <div>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-fg">
          Sub-mode
        </h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="M&A sub-mode">
          {(['TSA', 'CarveOut', 'Integration'] as const).map((m) => {
            const active = currentMode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={active}
                className={
                  active
                    ? 'rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg'
                    : 'rounded-md border border-border bg-background px-4 py-2 text-sm hover:bg-muted'
                }
              >
                {MODE_LABELS[m]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode-specific form */}
      {!maData ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/10 p-8 text-center text-sm text-muted-fg">
          M&amp;A Mode is not yet configured for this scenario.
          <br />
          Pick a sub-mode above to start.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-background p-5">
          {maData.mode === 'TSA' && (
            <TSAForm
              maData={maData}
              onChange={(next) => updateMAData(activeScenario.id, next)}
            />
          )}
          {maData.mode === 'CarveOut' && (
            <CarveOutForm
              maData={maData}
              onChange={(next) => updateMAData(activeScenario.id, next)}
            />
          )}
          {maData.mode === 'Integration' && (
            <IntegrationForm
              maData={maData}
              onChange={(next) => updateMAData(activeScenario.id, next)}
            />
          )}
        </div>
      )}

      {/* Impact summary */}
      {totals?.maOverlay && (
        <div className="rounded-lg border border-border bg-background p-5">
          <OverlayImpactSummary overlay={totals.maOverlay} />
        </div>
      )}

      <p className="mt-4 text-xs text-muted-fg">
        Edits create audit entries in{' '}
        <span className="font-mono">sow-calc:audit:{project.id}</span> under{' '}
        <span className="font-mono">scenario.maData.*</span> kinds.
      </p>
    </div>
  );
}
