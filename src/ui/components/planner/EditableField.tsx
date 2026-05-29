/**
 * EditableField - form-style editable field used in the expanded row.
 *
 * Same commit-on-blur/Enter/Tab semantics as EditableNumericCell, but
 * styled as a form input rather than an inline table cell.
 *
 * Renders the value as static text until clicked, then becomes an input.
 * This keeps the expanded row visually calm in its default state.
 */

import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import clsx from 'clsx';

export interface EditableFieldProps {
  label: string;
  value: string | number;
  /** 'number' triggers numeric input parsing; 'text' is plain text. */
  kind: 'text' | 'number';
  onCommit: (next: string | number) => void;
  /** For numeric fields: min/max for clamping. */
  min?: number;
  max?: number;
  /** Prefix shown before the value (e.g., '$'). */
  prefix?: string;
  /** Suffix shown after the value (e.g., '%', '/hr'). */
  suffix?: string;
  /** Render in a wider input for free-text. */
  multiline?: boolean;
}

export function EditableField({
  label,
  value,
  kind,
  onCommit,
  min,
  max,
  prefix,
  suffix,
  multiline,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(String(value));
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if ('select' in inputRef.current) inputRef.current.select();
    }
  }, [editing]);

  function commit() {
    if (kind === 'number') {
      const trimmed = draft.trim();
      const parsed = trimmed === '' ? 0 : Number(trimmed);
      if (!Number.isFinite(parsed)) {
        setDraft(String(value));
        setEditing(false);
        return;
      }
      let next = parsed;
      if (typeof min === 'number') next = Math.max(min, next);
      if (typeof max === 'number') next = Math.min(max, next);
      onCommit(next);
    } else {
      onCommit(draft);
    }
    setEditing(false);
  }

  function cancel() {
    setDraft(String(value));
    setEditing(false);
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    } else if (e.key === 'Tab') {
      commit();
    }
  }

  const displayValue = (
    <span className="font-mono text-sm tabular-nums">
      {prefix}
      {value}
      {suffix}
    </span>
  );

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-fg">{label}</span>
      {editing ? (
        multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKey}
            rows={2}
            className={clsx(
              'w-full rounded border border-accent bg-background px-2 py-1 text-sm text-foreground',
              'focus:outline-none focus:ring-1 focus:ring-accent',
            )}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            inputMode={kind === 'number' ? 'decimal' : 'text'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKey}
            className={clsx(
              'w-full rounded border border-accent bg-background px-2 py-1 text-sm text-foreground',
              'focus:outline-none focus:ring-1 focus:ring-accent',
            )}
          />
        )
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded border border-transparent px-2 py-1 text-left text-sm hover:border-border hover:bg-muted/40"
          title="Click to edit"
        >
          {displayValue}
        </button>
      )}
    </div>
  );
}
