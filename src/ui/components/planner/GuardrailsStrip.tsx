/**
 * GuardrailsStrip - shows firing guardrail rules with severity coloring.
 *
 * Each item shows the title, the human message, and which line of attack
 * from #9 it defends against. If no rules fire, the strip renders an
 * "all clear" green badge.
 */

import clsx from 'clsx';
import type { Guardrail } from '@/engine/guardrails/resource-guardrails';

const SEVERITY_STYLES: Record<Guardrail['severity'], string> = {
  info: 'border-accent/30 bg-accent/5 text-accent',
  warn: 'border-status-warn/40 bg-status-warn/10 text-status-warn',
  bad: 'border-status-bad/40 bg-status-bad/10 text-status-bad',
};

const SEVERITY_GLYPH: Record<Guardrail['severity'], string> = {
  info: 'ℹ',
  warn: '⚠',
  bad: '⛔',
};

export function GuardrailsStrip({ guardrails }: { guardrails: Guardrail[] }) {
  if (guardrails.length === 0) {
    return (
      <div className="rounded-md border border-status-good/30 bg-status-good/10 px-3 py-2 text-sm">
        <span className="font-medium text-status-good">✓ Guardrails: all clear.</span>{' '}
        <span className="text-muted-fg">
          The current scenario passes all configured defensibility checks.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {guardrails.map((g) => (
        <div
          key={g.id}
          className={clsx('rounded-md border px-3 py-2 text-sm', SEVERITY_STYLES[g.severity])}
        >
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-base leading-none">{SEVERITY_GLYPH[g.severity]}</span>
            <div className="flex-1">
              <div className="font-medium">{g.title}</div>
              <p className="mt-0.5 text-foreground/80">{g.message}</p>
              <p className="mt-1 text-xs text-muted-fg">{g.defendsAgainst}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
