/**
 * AssumptionSourceBadge - color-coded badge for source type.
 * - assumed:           neutral gray
 * - validated:         sky blue (internally validated)
 * - clientConfirmed:   status-good (the strongest, client-affirmed)
 * - industryBenchmark: amber (external reference)
 */

import clsx from 'clsx';
import type { AssumptionSource } from '@/types/assumption';

const STYLES: Record<AssumptionSource, string> = {
  assumed:           'bg-muted text-muted-fg',
  validated:         'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  clientConfirmed:   'bg-status-good/15 text-status-good',
  industryBenchmark: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
};

const LABELS: Record<AssumptionSource, string> = {
  assumed:           'Assumed',
  validated:         'Validated',
  clientConfirmed:   'Client',
  industryBenchmark: 'Benchmark',
};

export function AssumptionSourceBadge({ source }: { source: AssumptionSource }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        STYLES[source],
      )}
    >
      {LABELS[source]}
    </span>
  );
}
