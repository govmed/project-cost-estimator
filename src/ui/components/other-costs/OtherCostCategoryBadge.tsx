/**
 * OtherCostCategoryBadge - color-coded badge for the 12 other-cost categories.
 *
 * Groups visually: licenses/saas (blue family), hardware/endpoint (purple),
 * travel/training (amber), subcontractor/partner (red family), compliance/insurance
 * (slate), other (gray).
 */

import clsx from 'clsx';
import type { OtherCostCategory } from '@/types/other-costs';

const STYLES: Record<OtherCostCategory, string> = {
  SoftwareLicense:    'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  SaaSSubscription:   'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400',
  Hardware:           'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  Endpoint:           'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  TravelExpense:      'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  Training:           'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  KnowledgeTransfer:  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  Subcontractor:      'bg-rose-500/15 text-rose-700 dark:text-rose-400',
  PartnerPassthrough: 'bg-pink-500/15 text-pink-700 dark:text-pink-400',
  Compliance:         'bg-slate-500/15 text-slate-700 dark:text-slate-400',
  Insurance:          'bg-stone-500/15 text-stone-700 dark:text-stone-400',
  Other:              'bg-gray-500/15 text-gray-700 dark:text-gray-400',
};

const LABELS: Record<OtherCostCategory, string> = {
  SoftwareLicense: 'License',
  SaaSSubscription: 'SaaS',
  Hardware: 'Hardware',
  Endpoint: 'Endpoint',
  TravelExpense: 'Travel',
  Training: 'Training',
  KnowledgeTransfer: 'KT',
  Subcontractor: 'Subcontractor',
  PartnerPassthrough: 'Partner',
  Compliance: 'Compliance',
  Insurance: 'Insurance',
  Other: 'Other',
};

export function OtherCostCategoryBadge({ category }: { category: OtherCostCategory }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        STYLES[category],
      )}
    >
      {LABELS[category]}
    </span>
  );
}
