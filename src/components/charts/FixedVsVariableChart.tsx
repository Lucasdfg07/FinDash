"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency, formatMonthYear } from "@/lib/utils";
import { useChartTheme } from "@/hooks/useChartTheme";

interface MonthlyData {
  month: string;
  fixedCosts: number;
  expenses: number;
  cardExpenses: number;
}

export function FixedVsVariableChart({ data }: { data: MonthlyData[] }) {
  const ct = useChartTheme();
  const chartData = data.map((d) => ({
    month: formatMonthYear(d.month),
    fixo: d.fixedCosts,
    variavel: d.expenses + d.cardExpenses - d.fixedCosts,
  }));

  return (
    <div className="glass-card" style={{ padding: 28 }}>
      <h3
        className="text-[10px] font-bold mb-5 tracking-[0.2em] uppercase font-mono"
        style={{ color: "var(--muted)" }}
      >
        CUSTO FIXO vs CUSTO VARIÁVEL
      </h3>
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={chartData} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke={ct.gridStroke} />
            <XAxis
              dataKey="month"
              stroke={ct.axisStroke}
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={ct.axisStroke}
              fontSize={10}
              fontFamily="monospace"
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: ct.tooltipBg,
                border: `1px solid ${ct.tooltipBorder}`,
                borderRadius: 12,
                fontSize: 12,
                fontFamily: "monospace",
                backdropFilter: "blur(20px)",
              }}
              formatter={(value: number | undefined, name: string | undefined) => [
                value !== undefined ? formatCurrency(value) : "R$ 0",
                name === "fixo" ? "Custo Fixo" : "Custo Variável",
              ]}
              labelStyle={{ color: ct.tooltipColor, fontWeight: 600 }}
              cursor={{ fill: ct.cursorFill }}
            />
            <Legend
              formatter={(value) =>
                value === "fixo" ? "Custo Fixo" : "Custo Variável"
              }
              wrapperStyle={{ fontSize: 11, fontFamily: "monospace", color: ct.legendColor }}
            />
            <Bar dataKey="fixo" fill="#a855f7" radius={[6, 6, 0, 0]} stackId="a" />
            <Bar dataKey="variavel" fill="#f97316" radius={[6, 6, 0, 0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
