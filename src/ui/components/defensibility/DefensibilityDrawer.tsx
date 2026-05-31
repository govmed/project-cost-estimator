/**
 * DefensibilityDrawer (M5d-1).
 *
 * A slide-in panel from the right edge. Renders KpiProvenance for the
 * currently-selected KPI, or nothing if none is selected.
 *
 * Controlled via the parent's open state. Closes on Escape, on backdrop
 * click, or via the X button.
 *
 * Layout (top to bottom):
 *   Header   - title + close button
 *   Hero     - the displayValue + one-liner
 *   Math     - formula table summing to the result
 *   Assumptions - linked Assumption Ledger entries
 *   Inputs   - navigable links to the source screens
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { KpiProvenance, FormulaLine } from '@/data/kpi-provenance-types';
import { formatMoney } from '@/ui/format';
import { AssumptionSourceBadge } from '@/ui/components/assumptions/AssumptionSourceBadge';
import { AssumptionRiskBadge } from '@/ui/components/assumptions/AssumptionRiskBadge';
import { CommentThread } from '@/ui/components/comments/CommentThread';
import { useProjectStore } from '@/data/store';

export interface DefensibilityDrawerProps {
  /** Pass null to render closed. Pass a built KpiProvenance to render open. */
  provenance: KpiProvenance | null;
  onClose: () => void;
}

type DrawerTab = 'derivation' | 'comments';

export function DefensibilityDrawer({ provenance, onClose }: DefensibilityDrawerProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DrawerTab>('derivation');
  const projectId = useProjectStore((s) => s.project?.id ?? '');

  useEffect(() => { setActiveTab('derivation'); }, [provenance?.title]);

  // Escape to close
  useEffect(() => {
    if (!provenance) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [provenance, onClose]);

  if (!provenance) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="defensibility-title"
      data-testid="defensibility-drawer"
      className="fixed inset-0 z-40 pointer-events-none"
    >
      {/* Backdrop - clickable to close */}
      <div
        className="absolute inset-0 bg-foreground/10 pointer-events-auto"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer body */}
      <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-border bg-background shadow-xl pointer-events-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-5 py-3">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-fg">
              Why this number
            </div>
            <h2 id="defensibility-title" className="text-base font-semibold">
              {provenance.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close defensibility panel"
            className="rounded p-1 text-muted-fg hover:bg-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['derivation', 'comments'] as DrawerTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-xs font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-accent text-foreground'
                  : 'text-muted-fg hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'comments' && projectId && (
          <div className="px-5 py-4">
            <CommentThread
              projectId={projectId}
              entityType={provenance.entityType ?? 'kpi'}
              entityId={provenance.entityId ?? provenance.title}
            />
          </div>
        )}

        {activeTab === 'derivation' && <div className="space-y-6 px-5 py-4">
          {/* Hero */}
          <section>
            <div className="font-mono text-2xl tabular-money text-foreground">
              {provenance.displayValue}
            </div>
            <p className="mt-1 text-sm text-muted-fg">{provenance.oneLiner}</p>
          </section>

          {/* Math */}
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-fg">
              Math
            </h3>
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {provenance.math.map((line, i) => (
                    <FormulaRow key={i} line={line} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Assumptions */}
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-fg">
              Assumptions ({provenance.assumptions.length})
            </h3>
            {provenance.assumptions.length === 0 ? (
              <p className="text-sm text-muted-fg">
                No assumptions captured for this scenario yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {provenance.assumptions.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-md border border-border bg-muted/10 p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-foreground">{a.topic}</div>
                      <div className="flex shrink-0 items-center gap-1">
                        <AssumptionSourceBadge source={a.source} />
                        <AssumptionRiskBadge risk={a.riskLevel} />
                      </div>
                    </div>
                    {a.description && (
                      <p className="mt-1 text-xs text-muted-fg">{a.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Inputs */}
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-fg">
              Source inputs
            </h3>
            <ul className="space-y-1.5">
              {provenance.inputs.map((inp, i) => (
                <li key={i}>
                  {inp.route ? (
                    <button
                      type="button"
                      onClick={() => {
                        navigate(inp.route!);
                        onClose();
                      }}
                      className="flex w-full items-start justify-between gap-2 rounded border border-border bg-background px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <span>
                        <span className="font-medium text-foreground">{inp.label}</span>
                        {inp.detail && (
                          <span className="ml-2 text-xs text-muted-fg">{inp.detail}</span>
                        )}
                      </span>
                      <span className="text-muted-fg">→</span>
                    </button>
                  ) : (
                    <div className="rounded border border-border bg-muted/10 px-3 py-2 text-sm">
                      <span className="font-medium text-foreground">{inp.label}</span>
                      {inp.detail && (
                        <span className="ml-2 text-xs text-muted-fg">{inp.detail}</span>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>}

      </aside>
    </div>
  );
}

function FormulaRow({ line }: { line: FormulaLine }) {
  const opGlyph = (() => {
    switch (line.operator) {
      case 'plus': return '+';
      case 'times': return '×';
      case 'divide': return '÷';
      case 'equals': return '=';
      default: return '';
    }
  })();

  return (
    <tr
      className={
        line.highlight
          ? 'border-t border-border bg-accent/10 font-semibold'
          : 'border-t border-border/40 first:border-t-0'
      }
    >
      <td className="w-6 px-2 py-1.5 text-center text-muted-fg">{opGlyph}</td>
      <td className="px-2 py-1.5">{line.label}</td>
      <td className="px-2 py-1.5 text-right font-mono tabular-money">
        {formatAmount(line.amount)}
      </td>
    </tr>
  );
}

function formatAmount(amount: FormulaLine['amount']): string {
  if ('kind' in amount) {
    if (amount.kind === 'pct') return `${amount.value.toFixed(1)}%`;
    if (amount.kind === 'count') return amount.value.toLocaleString();
  }
  if ('currency' in amount) return formatMoney(amount);
  return String(amount);
}
