/**
 * EditableSelect - dropdown form field used in detail panes for enums.
 *
 * Renders the value as a styled span until clicked, then becomes a native
 * <select>. Commits on change (selects don't have a meaningful "blur"
 * commit pattern; the change event IS the commit).
 *
 * Esc cancels and reverts.
 */

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

export interface EditableSelectProps<T extends string> {
  label: string;
  value: T;
  options: readonly T[];
  onCommit: (next: T) => void;
  /** Optional display formatter. Defaults to the raw value. */
  formatOption?: (opt: T) => string;
}

export function EditableSelect<T extends string>({
  label,
  value,
  options,
  onCommit,
  formatOption,
}: EditableSelectProps<T>) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<T>(value);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [editing]);

  const format = formatOption ?? ((o: T) => o);

  function commit() {
    if (draft !== value) onCommit(draft);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-fg">{label}</span>
      {editing ? (
        <select
          ref={selectRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value as T)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
          }}
          className={clsx(
            'rounded border border-accent bg-background px-2 py-1 text-sm text-foreground',
            'focus:outline-none focus:ring-1 focus:ring-accent',
          )}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {format(o)}
            </option>
          ))}
        </select>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded border border-transparent px-2 py-1 text-left text-sm hover:border-border hover:bg-muted/40"
          title="Click to edit"
        >
          {format(value)}
        </button>
      )}
    </div>
  );
}
