/**
 * CostByPhaseChart - horizontal stacked bar of total cost per phase,
 * broken down by category (Resource / Cloud / Other).
 *
 * Horizontal because phase names ("Discovery", "Build", "Hypercare") read
 * naturally left-to-right, and bars left-to-right naturally suggest time
 * flowing.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { PhaseTotals } from '@/engine/types';
import type { CurrencyCode } from '@/types/money';
import { formatMoney } from '@/ui/format';

export interface CostByPhaseChartProps {
  byPhase: PhaseTotals[];
  currency: CurrencyCode;
}

interface ChartDatum {
  phaseName: string;
  resourceCost: number;
  cloudCost: number;
  otherCost: number;
}

export function CostByPhaseChart({ byPhase, currency }: CostByPhaseChartProps) {
  if (byPhase.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 text-sm text-muted-fg">
        No phase data for this scenario.
      </div>
    );
  }

  const data: ChartDatum[] = byPhase.map((p) => ({
    phaseName: p.phaseName,
    resourceCost: p.resourceCost.amount,
    cloudCost: p.cloudCost.amount,
    otherCost: p.otherCost.amount,
  }));

  const fmt = (v: number) => formatMoney({ amount: v, currency });
  const compactFmt = (v: number) => {
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(0)}k`;
    return v.toFixed(0);
  };

  // Height scales with phase count so labels never crowd
  const chartHeight = Math.max(240, byPhase.length * 44);

  return (
    <div className="w-full" style={{ height: chartHeight }} data-testid="cost-by-phase-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 70, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" opacity={0.4} />
          <XAxis
            type="number"
            stroke="rgb(var(--color-muted-fg))"
            tickFormatter={compactFmt}
            style={{ fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="phaseName"
            stroke="rgb(var(--color-muted-fg))"
            style={{ fontSize: 11 }}
            width={70}
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
          <Bar dataKey="resourceCost" stackId="cost" fill="#6366f1" />
          <Bar dataKey="cloudCost" stackId="cost" fill="#0ea5e9" />
          <Bar dataKey="otherCost" stackId="cost" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function labelFor(key: string): string {
  switch (key) {
    case 'resourceCost': return 'Resources';
    case 'cloudCost': return 'Cloud';
    case 'otherCost': return 'Other';
    default: return key;
  }
}
