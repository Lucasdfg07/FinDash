'use client';

import {
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useChartTheme } from '@/hooks/useChartTheme';

interface ForecastData {
  date: string;
  historical: number;
  predicted: number;
  lower: number;
  upper: number;
}

interface Props {
  data: ForecastData[];
  categoryName: string;
  title?: string;
}

export function ForecastChart({ data, categoryName, title }: Props) {
  const ct = useChartTheme();

  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-6">
        <p className="text-muted text-center">No forecast data available</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: 28 }}>
      <div className="mb-6">
        <h3
          className="text-[12px] font-bold tracking-[0.2em] uppercase font-mono mb-1"
          style={{ color: 'var(--muted)' }}
        >
          {title || 'SPENDING FORECAST'}
        </h3>
        <p className="text-sm" style={{ color: 'var(--muted)', opacity: 0.7 }}>
          {categoryName} • Next 30 days
        </p>
      </div>

      <div style={{ height: 350 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ComposedChart data={data} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={ct.gridStroke} opacity={0.3} />
            <XAxis
              dataKey="date"
              stroke={ct.axisStroke}
              fontSize={10}
              fontFamily="monospace"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={ct.axisStroke}
              fontSize={10}
              fontFamily="monospace"
              tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: ct.tooltipBg,
                border: `1px solid ${ct.tooltipBorder}`,
                borderRadius: 12,
                fontSize: 12,
                fontFamily: 'monospace',
                backdropFilter: 'blur(20px)',
              }}
              formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
              labelStyle={{ color: ct.tooltipColor, fontWeight: 600 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, fontFamily: 'monospace', color: ct.legendColor }}
            />

            {/* Confidence interval area */}
            <Area
              type="monotone"
              dataKey="upper"
              fill="url(#confidenceGradient)"
              stroke="transparent"
              isAnimationActive={false}
            />

            {/* Historical data */}
            <Line
              type="monotone"
              dataKey="historical"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              name="Historical"
            />

            {/* Forecast */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
              name="Forecast"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
        <div>
          <p style={{ color: 'var(--muted)', opacity: 0.7 }}>Confidence</p>
          <p className="font-mono font-bold text-sm">85%</p>
        </div>
        <div>
          <p style={{ color: 'var(--muted)', opacity: 0.7 }}>Trend</p>
          <p className="font-mono font-bold text-sm text-green-500">↑ Stable</p>
        </div>
        <div>
          <p style={{ color: 'var(--muted)', opacity: 0.7 }}>Next 30 Days</p>
          <p className="font-mono font-bold text-sm">R$ 3.500</p>
        </div>
      </div>
    </div>
  );
}
