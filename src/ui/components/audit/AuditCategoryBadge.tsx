/**
 * AuditCategoryBadge - color-coded badge for the 8 audit categories.
 */

import clsx from 'clsx';
import type { AuditCategory } from './AuditActionLabel';

const STYLES: Record<AuditCategory, string> = {
  resource:  'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400',
  cloud:     'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  otherCost: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  project:   'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  phase:     'bg-teal-500/15 text-teal-700 dark:text-teal-400',
  scenario:  'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  ma:        'bg-rose-500/15 text-rose-700 dark:text-rose-400',
  assumption:'bg-slate-500/15 text-slate-700 dark:text-slate-400',
};

export function AuditCategoryBadge({ category }: { category: AuditCategory }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        STYLES[category],
      )}
    >
      {category}
    </span>
  );
}
