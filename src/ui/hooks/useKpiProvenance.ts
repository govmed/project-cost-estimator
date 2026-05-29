/**
 * useKpiProvenance hook (M5d-1).
 *
 * Given a KpiKind, returns the full KpiProvenance for the active scenario.
 * Returns null when:
 *   - no project is loaded
 *   - the kind requires a resourceId that doesn't exist
 *
 * Pure projection of project state + totals. No I/O.
 */

import { useMemo } from 'react';
import { useProjectStore, selectActiveScenario } from '@/data/store';
import { useScenarioTotals } from '@/hooks/useScenarioTotals';
import { formatMoney } from '@/ui/format';
import type {
  KpiKind,
  KpiProvenance,
  FormulaLine,
  InputRef,
} from '@/data/kpi-provenance-types';

export function useKpiProvenance(kind: KpiKind | null): KpiProvenance | null {
  const project = useProjectStore((s) => s.project);
  const scenarios = useProjectStore((s) => s.scenarios);
  const activeScenarioId = useProjectStore((s) => s.activeScenarioId);
  const totals = useScenarioTotals();

  return useMemo(() => {
    if (!kind || !project || !totals) return null;
    const activeScenario = selectActiveScenario({ scenarios, activeScenarioId });
    if (!activeScenario) return null;

    switch (kind.kind) {
      case 'finalPrice':
        return buildFinalPriceProvenance(project, activeScenario, totals);
      case 'totalCost':
        return buildTotalCostProvenance(project, activeScenario, totals);
      case 'realizedMargin':
        return buildMarginProvenance(project, activeScenario, totals);
      case 'blendedRate':
        return buildBlendedRateProvenance(project, activeScenario, totals);
      case 'resourceBilled':
        return buildResourceBilledProvenance(
          project,
          activeScenario,
          totals,
          kind.resourceId,
        );
      default: {
        const _exhaustive: never = kind;
        void _exhaustive;
        return null;
      }
    }
  }, [kind, project, scenarios, activeScenarioId, totals]);
}

// -----------------------------------------------------------------
// Builders
// -----------------------------------------------------------------

import type { Project } from '@/types/project';
import type { Scenario } from '@/types/scenario';
import type { ScenarioTotals } from '@/engine/types';

function buildFinalPriceProvenance(
  project: Project,
  scenario: Scenario,
  totals: ScenarioTotals,
): KpiProvenance {
  const math: FormulaLine[] = [
    { label: 'Resources subtotal', amount: totals.resourcesSubtotal, operator: 'sum' },
    { label: 'Cloud subtotal',     amount: totals.cloudSubtotal,     operator: 'plus' },
    { label: 'Other costs subtotal', amount: totals.otherCostsSubtotal, operator: 'plus' },
    { label: 'Base cost',          amount: totals.baseCost,          operator: 'equals' },
    {
      label: `Contingency (${project.contingencyPct}%)`,
      amount: totals.contingencyAmount,
      operator: 'plus',
    },
    {
      label: `Management reserve (${project.managementReservePct}%)`,
      amount: totals.managementReserveAmount,
      operator: 'plus',
    },
    { label: 'Total cost',         amount: totals.totalCost,         operator: 'equals' },
    {
      label: `÷ (1 − ${project.targetMarginPct}% margin)`,
      amount: { kind: 'pct', value: 100 - project.targetMarginPct },
      operator: 'divide',
    },
    { label: 'Final Price', amount: totals.finalPrice, operator: 'equals', highlight: true },
  ];

  const inputs: InputRef[] = [
    {
      label: 'Resources',
      detail: `${scenario.resources.length} resources, ${Math.round(totals.totalBillableHours).toLocaleString()} hours`,
      route: `/p/${project.id}/resources`,
    },
    {
      label: 'Cloud',
      detail: `${scenario.cloudLineItems.length} line items`,
      route: `/p/${project.id}/cloud`,
    },
    {
      label: 'Other costs',
      detail: `${scenario.otherCostLineItems.length} line items`,
      route: `/p/${project.id}/other-costs`,
    },
    {
      label: 'Pricing levers',
      detail: `Target ${project.targetMarginPct}% · Contingency ${project.contingencyPct}% · Reserve ${project.managementReservePct}%`,
      route: `/p/${project.id}/setup`,
    },
  ];

  return {
    title: 'Final Price',
    displayValue: formatMoney(totals.finalPrice),
    oneLiner:
      'Total cost grossed up to hit the target margin. Includes contingency and management reserve.',
    math,
    assumptions: scenario.assumptions,
    inputs,
  };
}

function buildTotalCostProvenance(
  project: Project,
  scenario: Scenario,
  totals: ScenarioTotals,
): KpiProvenance {
  const math: FormulaLine[] = [
    { label: 'Resources subtotal', amount: totals.resourcesSubtotal, operator: 'sum' },
    { label: 'Cloud subtotal',     amount: totals.cloudSubtotal,     operator: 'plus' },
    { label: 'Other costs subtotal', amount: totals.otherCostsSubtotal, operator: 'plus' },
    { label: 'Base cost',          amount: totals.baseCost,          operator: 'equals' },
    {
      label: `Contingency (${project.contingencyPct}%)`,
      amount: totals.contingencyAmount,
      operator: 'plus',
    },
    {
      label: `Management reserve (${project.managementReservePct}%)`,
      amount: totals.managementReserveAmount,
      operator: 'plus',
    },
    { label: 'Total Cost', amount: totals.totalCost, operator: 'equals', highlight: true },
  ];

  const inputs: InputRef[] = [
    { label: 'Resources',   route: `/p/${project.id}/resources` },
    { label: 'Cloud',       route: `/p/${project.id}/cloud` },
    { label: 'Other costs', route: `/p/${project.id}/other-costs` },
    { label: 'Project Setup (contingency / reserve)', route: `/p/${project.id}/setup` },
  ];

  return {
    title: 'Total Cost',
    displayValue: formatMoney(totals.totalCost),
    oneLiner: 'Base cost plus contingency and management reserve.',
    math,
    assumptions: scenario.assumptions,
    inputs,
  };
}

function buildMarginProvenance(
  project: Project,
  scenario: Scenario,
  totals: ScenarioTotals,
): KpiProvenance {
  const math: FormulaLine[] = [
    { label: 'Final Price', amount: totals.finalPrice, operator: 'sum' },
    { label: 'Total Cost',  amount: totals.totalCost,  operator: 'divide' },
    {
      label: 'Realized margin %',
      amount: { kind: 'pct', value: totals.realizedMarginPct },
      operator: 'equals',
      highlight: true,
    },
  ];
  const inputs: InputRef[] = [
    { label: 'Target margin', detail: `${project.targetMarginPct}%`, route: `/p/${project.id}/setup` },
  ];
  return {
    title: 'Realized Margin',
    displayValue: `${totals.realizedMarginPct.toFixed(1)}%`,
    oneLiner: '(Final Price − Total Cost) / Final Price. Equals the target unless discount is applied.',
    math,
    assumptions: scenario.assumptions,
    inputs,
  };
}

function buildBlendedRateProvenance(
  project: Project,
  scenario: Scenario,
  totals: ScenarioTotals,
): KpiProvenance {
  const math: FormulaLine[] = [
    { label: 'Final Price', amount: totals.finalPrice, operator: 'sum' },
    {
      label: 'Total billable hours',
      amount: { kind: 'count', value: Math.round(totals.totalBillableHours) },
      operator: 'divide',
    },
    {
      label: 'Effective blended rate',
      amount: totals.effectiveBlendedRate,
      operator: 'equals',
      highlight: true,
    },
  ];
  const inputs: InputRef[] = [
    {
      label: 'Resources',
      detail: `${scenario.resources.length} resources contributing hours`,
      route: `/p/${project.id}/resources`,
    },
  ];
  return {
    title: 'Effective Blended Rate',
    displayValue: `${formatMoney(totals.effectiveBlendedRate)}/hr`,
    oneLiner: 'Final price divided by total billable hours. The single $/hr that would produce the same revenue.',
    math,
    assumptions: scenario.assumptions,
    inputs,
  };
}

function buildResourceBilledProvenance(
  project: Project,
  scenario: Scenario,
  totals: ScenarioTotals,
  resourceId: string,
): KpiProvenance | null {
  const raw = scenario.resources.find((r) => r.id === resourceId);
  const t = totals.resources.find((rt) => rt.resourceId === resourceId);
  if (!raw || !t) return null;

  const displayName = raw.name?.trim() || `${raw.role} (${raw.skillLevel})`;
  const math: FormulaLine[] = [
    {
      label: 'Bill rate',
      amount: raw.billRate,
      operator: 'sum',
    },
    {
      label: 'Total hours',
      amount: { kind: 'count', value: Math.round(t.totalHours) },
      operator: 'times',
    },
    {
      label: 'Billed amount',
      amount: t.billedAmount,
      operator: 'equals',
      highlight: true,
    },
  ];

  const inputs: InputRef[] = [
    {
      label: 'Resource detail',
      detail: `${raw.role} · ${raw.skillLevel} · ${raw.geography}`,
      route: `/p/${project.id}/resources`,
    },
    {
      label: 'Hours per week / utilization',
      detail: `${raw.hoursPerWeek}h × ${raw.utilizationPct}%`,
      route: `/p/${project.id}/resources`,
    },
    {
      label: 'Phase allocations',
      detail: `${raw.allocations.length} of ${project.phases.length} phases set`,
      route: `/p/${project.id}/resources`,
    },
  ];

  return {
    title: displayName,
    displayValue: formatMoney(t.billedAmount),
    oneLiner: `Bill rate × hours across all phase allocations. ${t.marginPct.toFixed(1)}% margin on this resource.`,
    math,
    assumptions: scenario.assumptions,
    inputs,
  };
}
