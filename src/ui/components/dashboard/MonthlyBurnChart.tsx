/**
 * MonthlyBurnChart - stacked area of monthly cost by category, with a
 * cumulative line overlay on a secondary Y axis.
 *
 * Data comes straight from engine `burnCurve` array. Layers:
 *  - Resource cost (bottom)
 *  - Cloud cost (middle)
 *  - Other cost (top)
 *  - Cumulative line (right axis)
 *
 * Each month is a chart datum with these keys; Recharts handles the stacking
 * via stackId.
 */

import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import type { BurnCurveMonth } from '@/engine/types';
import type { CurrencyCode } from '@/types/money';
import { formatMoney } from '@/ui/format';

export interface MonthlyBurnChartProps {
  burnCurve: BurnCurveMonth[];
  currency: CurrencyCode;
}

interface ChartDatum {
  monthLabel: string;
  resourceCost: number;
  cloudCost: number;
  otherCost: number;
  totalCost: number;
  cumulativeCost: number;
}

export function MonthlyBurnChart({ burnCurve, currency }: MonthlyBurnChartProps) {
  if (burnCurve.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 text-sm text-muted-fg">
        No burn data for this scenario.
      </div>
    );
  }

  const data: ChartDatum[] = burnCurve.map((m) => ({
    monthLabel: `M${m.monthIndex + 1}`,
    resourceCost: m.resourceCost.amount,
    cloudCost: m.cloudCost.amount,
    otherCost: m.otherCost.amount,
    totalCost: m.totalCost.amount,
    cumulativeCost: m.cumulativeCost.amount,
  }));

  const fmt = (v: number) => formatMoney({ amount: v, currency });
  const compactFmt = (v: number) => {
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(0)}k`;
    return v.toFixed(0);
  };

  return (
    <div className="h-72 w-full" data-testid="monthly-burn-chart">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" opacity={0.4} />
          <XAxis dataKey="monthLabel" stroke="rgb(var(--color-muted-fg))" style={{ fontSize: 11 }} />
          <YAxis
            yAxisId="left"
            stroke="rgb(var(--color-muted-fg))"
            tickFormatter={compactFmt}
            style={{ fontSize: 11 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="rgb(var(--color-muted-fg))"
            tickFormatter={compactFmt}
            style={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value, name) => [fmt(Number(value)), labelFor(String(name))]}
            contentStyle={{
              background: 'rgb(var(--color-background))',
              border: '1px solid rgb(var(--color-border))',
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => labelFor(value)} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="resourceCost"
            stackId="cost"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.7}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="cloudCost"
            stackId="cost"
            stroke="#0ea5e9"
            fill="#0ea5e9"
            fillOpacity={0.7}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="otherCost"
            stackId="cost"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.7}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulativeCost"
            stroke="rgb(var(--color-foreground))"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function labelFor(key: string): string {
  switch (key) {
    case 'resourceCost': return 'Resources';
    case 'cloudCost': return 'Cloud';
    case 'otherCost': return 'Other';
    case 'cumulativeCost': return 'Cumulative';
    case 'totalCost': return 'Total';
    default: return key;
  }
}
