/**
 * Short labels for phase column headers.
 *
 * The wireframe in #5 uses 3-letter abbreviations: Disc, Des, Bld, Tst, Dep, Hyp.
 * We derive these by taking the first 3 letters of the phase name, but fall
 * back to the full name if it's already short (e.g., "Test", "Build").
 */

import type { Phase } from '@/types/project';

const KNOWN_ABBREVIATIONS: Record<string, string> = {
  Discovery: 'Disc',
  Design: 'Des',
  Build: 'Bld',
  Test: 'Tst',
  Deploy: 'Dep',
  Hypercare: 'Hyp',
  Planning: 'Plan',
  Implementation: 'Impl',
  'Steady-State': 'Run',
};

export function phaseShortLabel(phase: Phase): string {
  if (KNOWN_ABBREVIATIONS[phase.name]) return KNOWN_ABBREVIATIONS[phase.name];
  // Fallback: take first 4 chars, capitalize.
  return phase.name.length <= 4 ? phase.name : phase.name.slice(0, 4);
}
