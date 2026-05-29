/**
 * CloudProviderBadge - small visual indicator for AWS / Azure / GCP.
 *
 * Uses semantic colors per provider so the list scans quickly. Kept
 * simple - no real logos because of trademark/licensing concerns in
 * a corporate context.
 */

import clsx from 'clsx';
import type { CloudProvider } from '@/types/cloud';

const STYLES: Record<CloudProvider, string> = {
  aws:    'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  azure:  'bg-blue-600/15 text-blue-700 dark:text-blue-400',
  gcp:    'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400',
  other:  'bg-slate-500/15 text-slate-700 dark:text-slate-400',
};

const LABELS: Record<CloudProvider, string> = {
  aws: 'AWS',
  azure: 'Azure',
  gcp: 'GCP',
  other: 'Other',
};

export function CloudProviderBadge({ provider }: { provider: CloudProvider }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        STYLES[provider],
      )}
    >
      {LABELS[provider]}
    </span>
  );
}
