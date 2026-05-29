/**
 * ScenarioMetricRow - one labeled metric in a Compare card column.
 *
 * Renders: label, value, optional delta vs baseline.
 *
 * Delta semantics:
 *  - direction='goodIfDown' (cost, price): negative delta is green
 *  - direction='goodIfUp' (margin): positive delta is green
 *  - direction='neutral' (hours): muted color
 *  - No delta when baseline is null/undefined or numeric is undefined
 *  - Zero deltas (<0.001) are suppressed entirely
 *
 * M5d-2: if `onValueClick` is supplied, the value becomes a button that
 * opens the defensibility drawer scoped to the row's scenario.
 */

import clsx from 'clsx';

export type MetricDirection = 'goodIfUp' | 'goodIfDown' | 'neutral';

export interface ScenarioMetricRowProps {
  label: string;
  /** Pre-formatted value string. */
  value: string;
  /** Numeric raw value used to compute the delta. */
  numeric?: number;
  /** Baseline numeric for delta computation. */
  baseline?: number;
  /** Formatter for the delta value. Defaults to integer rounding. */
  formatDelta?: (delta: number) => string;
  direction?: MetricDirection;
  /** Hint shown beneath the value. */
  hint?: string;
  /** M5d-2: if provided, clicking the value fires this handler. */
  onValueClick?: () => void;
}

export function ScenarioMetricRow({
  label,
  value,
  numeric,
  baseline,
  formatDelta,
  direction = 'neutral',
  hint,
  onValueClick,
}: ScenarioMetricRowProps) {
  const hasDelta =
    typeof numeric === 'number' &&
    typeof baseline === 'number' &&
    Number.isFinite(numeric) &&
    Number.isFinite(baseline);

  let delta = 0;
  let pct = 0;
  let deltaClass = '';
  if (hasDelta) {
    delta = numeric - baseline;
    pct = baseline !== 0 ? (delta / Math.abs(baseline)) * 100 : 0;
    if (Math.abs(delta) > 0.001) {
      const up = delta > 0;
      switch (direction) {
        case 'goodIfUp':
          deltaClass = up ? 'text-status-good' : 'text-status-bad';
          break;
        case 'goodIfDown':
          deltaClass = up ? 'text-status-bad' : 'text-status-good';
          break;
        default:
          deltaClass = 'text-muted-fg';
      }
    }
  }
  const showDelta = hasDelta && Math.abs(delta) > 0.001;
  const fmt = formatDelta ?? ((n: number) =>
    Math.abs(n) >= 1 ? n.toFixed(0) : n.toFixed(2)
  );

  return (
    <div className="border-b border-border/60 px-3 py-2 last:border-b-0">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-fg">
        {label}
      </div>
      <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        {onValueClick ? (
          <button
            type="button"
            onClick={onValueClick}
            aria-label={`Show defensibility for ${label}`}
            className="font-mono text-sm tabular-money text-foreground rounded -mx-0.5 px-0.5 hover:bg-muted/50 hover:underline focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {value}
          </button>
        ) : (
          <span className="font-mono text-sm tabular-money text-foreground">{value}</span>
        )}
        {showDelta && (
          <span className={clsx('font-mono text-xs tabular-nums', deltaClass)}>
            {delta > 0 ? '+' : ''}
            {fmt(delta)}{' '}
            <span className="opacity-70">
              ({delta > 0 ? '+' : ''}{pct.toFixed(1)}%)
            </span>
          </span>
        )}
      </div>
      {hint && <span className="text-[10px] text-muted-fg/70">{hint}</span>}
    </div>
  );
}
