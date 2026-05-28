/**
 * Time math.
 *
 * The model uses WEEKS as the natural unit (phases are in durationWeeks).
 * Burn curves and run-rate projections need MONTHS. This file owns the
 * conversion and the project timeline geometry.
 *
 * Convention: a "month" is exactly 4.345 weeks (52.14/12). This is what most
 * deal teams use for converting weekly billing to monthly burn. The slight
 * fractional weeks don't matter at the resolution we report (full months).
 */

import { Phase } from '../types/project';
import { PhaseId } from '../types/ids';

export const WEEKS_PER_MONTH = 4.345;
export const RUN_RATE_HORIZON_MONTHS = 36;

/**
 * Project duration in months, rounded up so partial months don't get lost
 * in the burn curve.
 */
export function projectDurationMonths(phases: Phase[]): number {
  const totalWeeks = projectDurationWeeks(phases);
  return Math.ceil(totalWeeks / WEEKS_PER_MONTH);
}

/** Project duration in weeks: max(phase.offsetWeeks + phase.durationWeeks). */
export function projectDurationWeeks(phases: Phase[]): number {
  if (phases.length === 0) return 0;
  return Math.max(...phases.map(p => p.offsetWeeks + p.durationWeeks));
}

/**
 * Return the phaseId that covers a given month index (0-based).
 *
 * Uses the month's midpoint to assign a single phase — no overlap at
 * boundaries, so rollups don't double-count.
 *
 * For months whose midpoint falls AFTER the last phase ends (which happens
 * when projectDurationMonths rounds up a partial trailing month), the
 * last phase is returned so no cost is lost from rollups. Months whose
 * midpoint is BEFORE all phases return null (this is a degenerate input).
 */
export function phaseAtMonth(phases: Phase[], monthIndex: number): PhaseId | null {
  if (phases.length === 0) return null;

  // Month i covers weeks [i * WEEKS_PER_MONTH, (i+1) * WEEKS_PER_MONTH).
  const monthStartWeek = monthIndex * WEEKS_PER_MONTH;
  const monthEndWeek = (monthIndex + 1) * WEEKS_PER_MONTH;
  const monthMidWeek = (monthStartWeek + monthEndWeek) / 2;

  const sorted = [...phases].sort((a, b) => a.order - b.order);

  // First pass: midpoint strictly inside a phase span.
  for (const p of sorted) {
    const start = p.offsetWeeks;
    const end = p.offsetWeeks + p.durationWeeks;
    if (monthMidWeek >= start && monthMidWeek < end) {
      return p.id;
    }
  }

  // Tail-rounding case: midpoint is past the last phase end.
  // Return the last phase so no cost is dropped from rollups.
  const last = sorted[sorted.length - 1];
  if (monthMidWeek >= last.offsetWeeks + last.durationWeeks) {
    return last.id;
  }

  // Midpoint is before all phases (degenerate).
  return null;
}

/**
 * For each phase, return the [startMonthIndex, endMonthIndex) range (exclusive end).
 */
export function phaseMonthRanges(phases: Phase[]): Map<PhaseId, [number, number]> {
  const out = new Map<PhaseId, [number, number]>();
  for (const p of phases) {
    const startMonth = Math.floor(p.offsetWeeks / WEEKS_PER_MONTH);
    const endMonth = Math.ceil((p.offsetWeeks + p.durationWeeks) / WEEKS_PER_MONTH);
    out.set(p.id, [startMonth, endMonth]);
  }
  return out;
}

/**
 * Find the project month index where a given phase starts.
 */
export function phaseStartMonth(phases: Phase[], phaseId: PhaseId): number {
  const phase = phases.find(p => p.id === phaseId);
  if (!phase) return 0;
  return Math.floor(phase.offsetWeeks / WEEKS_PER_MONTH);
}

/** Phase duration in months (used for run-rate items pinned to a phase). */
export function phaseDurationMonths(phase: Phase): number {
  return phase.durationWeeks / WEEKS_PER_MONTH;
}
