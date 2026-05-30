import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  heading,
  body,
  action,
}: {
  icon?: string;
  heading: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon && (
        <span className="mb-4 text-4xl leading-none text-muted-fg" aria-hidden="true">
          {icon}
        </span>
      )}
      <h3 className="text-base font-medium text-foreground">{heading}</h3>
      {body && (
        <p className="mt-2 max-w-sm text-sm text-muted-fg">{body}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
