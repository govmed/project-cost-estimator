/**
 * EditableToggle - boolean field as a labeled toggle / checkbox.
 *
 * Single click toggles. No "commit" step since there's no transient draft.
 */

import clsx from 'clsx';

export interface EditableToggleProps {
  label: string;
  value: boolean;
  onCommit: (next: boolean) => void;
  /** Optional hint shown beneath when on/off. */
  hint?: { on: string; off: string };
}

export function EditableToggle({ label, value, onCommit, hint }: EditableToggleProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-fg">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onCommit(!value)}
        className={clsx(
          'inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors',
          value
            ? 'border-accent bg-accent'
            : 'border-border bg-muted',
        )}
      >
        <span
          className={clsx(
            'inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform',
            value ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
      {hint && (
        <span className="text-[10px] text-muted-fg/80">
          {value ? hint.on : hint.off}
        </span>
      )}
    </div>
  );
}
