"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { useChartTheme } from "@/hooks/useChartTheme";

interface TopItem {
  name: string;
  amount: number;
}

interface Props {
  data: TopItem[];
  title: string;
  color: string;
  onBarClick?: (params: { recipient: string; label: string }) => void;
}

export function TopExpensesChart({
  data,
  title,
  color,
  onBarClick,
}: Props) {
  const ct = useChartTheme();
  const chartData = data.slice(0, 8).map((d) => ({
    ...d,
    fullName: d.name,
    name: d.name.length > 20 ? d.name.slice(0, 20) + "..." : d.name,
  }));

  const handleClick = (entry: Record<string, unknown>) => {
    if (!onBarClick || !entry) return;
    const fullName = entry.fullName as string;
    onBarClick({ recipient: fullName, label: fullName });
  };

  return (
    <div className="glass-card" style={{ padding: 28 }}>
      <div className="flex items-center justify-between mb-5">
        <h3
          className="text-[10px] font-bold tracking-[0.2em] uppercase font-mono"
          style={{ color: "var(--muted)" }}
        >
          {title}
        </h3>
        {onBarClick && (
          <span className="text-[10px] font-mono" style={{ color: "var(--muted)", opacity: 0.6 }}>
            Clique nas barras para ver detalhes
          </span>
        )}
      </div>
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 10, right: 20 }}
          >
            <XAxis
              type="number"
              stroke={ct.axisStroke}
              fontSize={10}
              fontFamily="monospace"
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={130}
              stroke={ct.axisStroke}
              fontSize={10}
              fontFamily="monospace"
              tick={{ fill: ct.tickFill }}
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
              formatter={(value: number) => [formatCurrency(value), "Valor"]}
              labelStyle={{ color: ct.tooltipColor, fontWeight: 600 }}
              cursor={{ fill: ct.cursorFill }}
            />
            <Bar
              dataKey="amount"
              fill={color}
              radius={[0, 6, 6, 0]}
              cursor={onBarClick ? "pointer" : undefined}
              onClick={handleClick}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
