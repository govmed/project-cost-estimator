/**
 * StatusPill - the project status indicator in the top rail.
 *
 * draft (gray) / underReview (amber) / approved (green) / archived (faded).
 * M1b renders it read-only; M1c/M2 will make it a dropdown that writes audit.
 */

import clsx from 'clsx';
import type { ProjectStatus } from '@/types/project';

const STYLES: Record<ProjectStatus, string> = {
  draft: 'bg-muted text-muted-fg',
  underReview: 'bg-status-warn/15 text-status-warn',
  approved: 'bg-status-good/15 text-status-good',
  archived: 'bg-muted text-muted-fg/60',
};

const LABELS: Record<ProjectStatus, string> = {
  draft: 'DRAFT',
  underReview: 'UNDER REVIEW',
  approved: 'APPROVED',
  archived: 'ARCHIVED',
};

export function StatusPill({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={clsx(
        'rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide',
        STYLES[status],
      )}
    >
      {LABELS[status]}
    </span>
  );
}
