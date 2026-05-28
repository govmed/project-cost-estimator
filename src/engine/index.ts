/**
 * Engine barrel export.
 * Public API: import { calculate, ScenarioTotals } from '@/engine';
 */

export { calculate } from './calculate';
export * from './types';
export type { FxContext } from './fx';
export { toBase, sumInBase, mul } from './fx';
export {
  WEEKS_PER_MONTH,
  projectDurationMonths,
  projectDurationWeeks,
  phaseAtMonth,
} from './time';
export { rampFactor } from './calculations/cloud';
