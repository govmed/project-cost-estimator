/**
 * HeadcountChart - line chart of total FTE per month.
 *
 * Single line, simple. The geography breakdown is interesting but adds
 * noise here - we expose totalFTE as the primary signal. By-geography
 * details show in the Headcount-by-Geography table below.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { HeadcountMonth } from '@/engine/types';

export interface HeadcountChartProps {
  headcountCurve: HeadcountMonth[];
}

interface ChartDatum {
  monthLabel: string;
  totalFTE: number;
}

export function HeadcountChart({ headcountCurve }: HeadcountChartProps) {
  if (headcountCurve.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 text-sm text-muted-fg">
        No headcount data for this scenario.
      </div>
    );
  }

  const data: ChartDatum[] = headcountCurve.map((m) => ({
    monthLabel: `M${m.monthIndex + 1}`,
    totalFTE: Number(m.totalFTE.toFixed(2)),
  }));

  // Peak FTE - useful as a reference line and as a label
  const peakFTE = Math.max(...data.map((d) => d.totalFTE));

  return (
    <div className="h-72 w-full" data-testid="headcount-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" opacity={0.4} />
          <XAxis dataKey="monthLabel" stroke="rgb(var(--color-muted-fg))" style={{ fontSize: 11 }} />
          <YAxis
            stroke="rgb(var(--color-muted-fg))"
            tickFormatter={(v: number) => v.toFixed(1)}
            style={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(2)} FTE`, "Headcount"]}
            contentStyle={{
              background: 'rgb(var(--color-background))',
              border: '1px solid rgb(var(--color-border))',
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <ReferenceLine
            y={peakFTE}
            stroke="rgb(var(--color-muted-fg))"
            strokeDasharray="3 3"
            label={{
              value: `Peak ${peakFTE.toFixed(1)}`,
              position: 'insideTopRight',
              style: { fontSize: 10, fill: 'rgb(var(--color-muted-fg))' },
            }}
          />
          <Line
            type="monotone"
            dataKey="totalFTE"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
