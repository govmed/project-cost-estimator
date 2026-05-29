/**
 * AssumptionRiskBadge - color-coded badge for risk level.
 */

import clsx from 'clsx';
import type { AssumptionRiskLevel } from '@/types/assumption';

const STYLES: Record<AssumptionRiskLevel, string> = {
  low:    'bg-status-good/15 text-status-good',
  medium: 'bg-status-warn/15 text-status-warn',
  high:   'bg-status-bad/15 text-status-bad',
};

export function AssumptionRiskBadge({ risk }: { risk: AssumptionRiskLevel }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        STYLES[risk],
      )}
    >
      {risk}
    </span>
  );
}
