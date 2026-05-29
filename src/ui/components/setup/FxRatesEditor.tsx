/**
 * FxRatesEditor - currency-to-rate editing for the project.
 *
 * Lists all CurrencyCodes; base currency is fixed at 1.0 (greyed out);
 * others editable inline.
 */

import type { CurrencyCode } from '@/types/money';
import { useProjectStore } from '@/data/store';
import { EditableField } from '@/ui/components/planner/EditableField';

const ALL_CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'BRL'];

export interface FxRatesEditorProps {
  baseCurrency: CurrencyCode;
  fxRates: Record<CurrencyCode, number>;
}

export function FxRatesEditor({ baseCurrency, fxRates }: FxRatesEditorProps) {
  const updateFxRate = useProjectStore((s) => s.updateFxRate);

  return (
    <div className="rounded-lg border border-border bg-background">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/30 text-xs font-medium uppercase tracking-wide text-muted-fg">
          <tr>
            <th className="px-3 py-2 text-left w-32">Currency</th>
            <th className="px-3 py-2 text-left">Rate (per 1 {baseCurrency})</th>
          </tr>
        </thead>
        <tbody>
          {ALL_CURRENCIES.map((c) => {
            const isBase = c === baseCurrency;
            const rate = isBase ? 1.0 : (fxRates[c] ?? 0);
            return (
              <tr key={c} className="border-b border-border/60 last:border-b-0">
                <td className="px-3 py-2 font-mono">
                  {c}
                  {isBase && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-fg">
                      base
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {isBase ? (
                    <span className="font-mono text-muted-fg">1.0000</span>
                  ) : (
                    <EditableField
                      label=""
                      value={rate}
                      kind="number"
                      min={0}
                      onCommit={(v) => updateFxRate(c, Number(v))}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
