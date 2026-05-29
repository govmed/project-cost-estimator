/**
 * EditableNumericCell - the click-to-edit cell for the phase allocation matrix.
 *
 * Behavior:
 *  - Click (or focus) -> becomes an <input> with current value pre-selected
 *  - Type -> local state updates; nothing fires yet
 *  - Enter or Tab or blur -> commit the value via onCommit
 *  - Esc -> revert to original; no commit
 *
 * The cell does NOT call the store directly. The parent supplies onCommit,
 * which the parent uses to dispatch the store action. This keeps the cell
 * dumb and easy to test in isolation.
 *
 * Visual feedback:
 *  - Empty cells (value 0) render muted
 *  - On commit, if the typed value was clamped (>100 or <0), the cell
 *    briefly flashes amber so the user sees their input was adjusted
 */

import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import clsx from 'clsx';

export interface EditableNumericCellProps {
  value: number;
  /** Called with the parsed new value when the user commits. May be clamped. */
  onCommit: (newValue: number) => void;
  /** Min / max for clamping at the cell level (display). */
  min?: number;
  max?: number;
  /** Aria label for screen readers / tests. */
  label?: string;
  /** Visual class for "no value" state. */
  zeroClassName?: string;
}

export function EditableNumericCell({
  value,
  onCommit,
  min = 0,
  max = 100,
  label,
  zeroClassName = 'text-muted-fg/40',
}: EditableNumericCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(String(value));
  const [flash, setFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep draft in sync if external value changes (e.g., scenario switch)
  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  // Focus + select on entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    // Empty = 0 (matches Excel)
    const parsed = trimmed === '' ? 0 : Number(trimmed);
    if (!Number.isFinite(parsed)) {
      // Reject NaN; revert
      setDraft(String(value));
      setEditing(false);
      return;
    }
    const clamped = Math.max(min, Math.min(max, parsed));
    if (clamped !== parsed) {
      // Flash to signal the input was adjusted
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
    }
    onCommit(clamped);
    setEditing(false);
  }

  function cancel() {
    setDraft(String(value));
    setEditing(false);
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === 'Tab') {
      // Tab still moves focus naturally; we just commit first.
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        aria-label={label}
        className={clsx(
          'w-12 rounded border border-accent bg-background px-1 py-0.5 text-center font-mono text-sm tabular-nums text-foreground focus:outline-none focus:ring-1 focus:ring-accent',
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      onFocus={() => setEditing(true)}
      aria-label={label}
      className={clsx(
        'w-12 rounded px-1 py-0.5 text-center font-mono text-sm tabular-nums transition-colors',
        'hover:bg-muted focus:bg-muted focus:outline-none',
        flash && 'bg-status-warn/30',
        value === 0 ? zeroClassName : 'text-foreground',
      )}
      title="Click to edit"
    >
      {value}
    </button>
  );
}
