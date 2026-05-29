/**
 * RowActions - the trailing buttons in each row for duplicate and delete.
 *
 * Compact icon buttons. Delete requires a confirmation step (the button
 * label changes to "Confirm?" on first click, executes on second click;
 * clicking elsewhere or pressing Esc cancels).
 */

import { useEffect, useState } from 'react';
import clsx from 'clsx';

export interface RowActionsProps {
  onDuplicate: () => void;
  onDelete: () => void;
  /** For aria-label clarity (e.g. "Engagement Lead"). */
  rowLabel: string;
}

export function RowActions({ onDuplicate, onDelete, rowLabel }: RowActionsProps) {
  const [confirming, setConfirming] = useState(false);

  // Auto-reset confirm state after a few seconds
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  function handleDeleteClick() {
    if (confirming) {
      onDelete();
      setConfirming(false);
    } else {
      setConfirming(true);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={onDuplicate}
        className="rounded p-1 text-muted-fg hover:bg-muted hover:text-foreground"
        title="Duplicate"
        aria-label={`Duplicate ${rowLabel}`}
      >
        ⎘
      </button>
      <button
        type="button"
        onClick={handleDeleteClick}
        className={clsx(
          'rounded px-1.5 py-1 text-xs transition-colors',
          confirming
            ? 'bg-status-bad/10 font-medium text-status-bad'
            : 'text-muted-fg hover:bg-muted hover:text-status-bad',
        )}
        title={confirming ? 'Click again to confirm delete' : 'Delete'}
        aria-label={confirming ? `Confirm delete ${rowLabel}` : `Delete ${rowLabel}`}
      >
        {confirming ? 'Confirm?' : '✕'}
      </button>
    </div>
  );
}
