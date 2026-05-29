/**
 * KPI provenance types (M5d-1).
 *
 * Describes what's behind a single computed number on screen. The
 * right-rail Defensibility panel renders this shape; the renderer is
 * dumb, the data is pre-shaped.
 *
 * Three sections per KPI:
 *   - math: a list of FormulaLine items that combine into the result
 *   - assumptions: scenario assumptions that touch this KPI
 *   - inputs: links back to the source data (resources, project setup, etc.)
 */

import type { Money } from '@/types/money';
import type { Assumption } from '@/types/assumption';

/**
 * Identifies which KPI we're explaining. Tagged so we can dispatch on it
 * exhaustively. M5d-1 ships only the first few; M5d-2 adds the rest.
 */
export type KpiKind =
  | { kind: 'finalPrice' }
  | { kind: 'totalCost' }
  | { kind: 'realizedMargin' }
  | { kind: 'blendedRate' }
  | { kind: 'resourceBilled'; resourceId: string };

/**
 * One row in the math section. Rendered as a small two-column table.
 * Operator drives the visual presentation only - actual math is already
 * computed and packed into the row's amount.
 */
export interface FormulaLine {
  label: string;
  /** Display amount (Money or raw number like a percentage). */
  amount: Money | { kind: 'pct'; value: number } | { kind: 'count'; value: number };
  /** Visual hint for prefix. 'sum' = main operand, '+' / '×' / '÷' decorators. */
  operator?: 'sum' | 'plus' | 'times' | 'divide' | 'equals';
  /** If this line is the final result, set highlight to bold it. */
  highlight?: boolean;
}

/**
 * Pointer back to a source input. Optional `route` lets the panel render
 * it as a navigable link.
 */
export interface InputRef {
  label: string;
  detail?: string;
  /** Where clicking this jumps to. Relative to the active project. */
  route?: string;
}

/**
 * Full provenance for one KPI: title, displayed value, three explainer sections.
 */
export interface KpiProvenance {
  /** Human label of the metric ("Final Price"). */
  title: string;
  /** Formatted value of the metric ("$2,369,903"). */
  displayValue: string;
  /** A one-line summary of where the number comes from. */
  oneLiner: string;
  math: FormulaLine[];
  assumptions: Assumption[];
  inputs: InputRef[];
}
