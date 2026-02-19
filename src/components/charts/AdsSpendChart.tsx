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
  metaAds: number;
  googleAds: number;
}

interface Props {
  data: MonthlyData[];
  onBarClick?: (params: { month: string; type: "metaAds" | "googleAds"; label: string }) => void;
}

export default function AdsSpendChart({ data, onBarClick }: Props) {
  const ct = useChartTheme();
  const chartData = data.map((d) => ({
    ...d,
    rawMonth: d.month,
    month: formatMonthYear(d.month),
  }));

  const handleClick = (dataKey: "metaAds" | "googleAds") => (entry: Record<string, unknown>) => {
    if (!onBarClick || !entry) return;
    const rawMonth = entry.rawMonth as string;
    const label = entry.month as string;
    const name = dataKey === "metaAds" ? "Meta Ads" : "Google Ads";
    onBarClick({ month: rawMonth, type: dataKey, label: `${label} • ${name}` });
  };

  return (
    <div className="glass-card" style={{ padding: 28 }}>
      <div className="flex items-center justify-between mb-5">
        <h3
          className="text-[10px] font-bold tracking-[0.2em] uppercase font-mono"
          style={{ color: "var(--muted)" }}
        >
          INVESTIMENTO EM ADS POR MÊS
        </h3>
        {onBarClick && (
          <span className="text-[10px] font-mono" style={{ color: "var(--muted)", opacity: 0.6 }}>
            Clique nas barras para ver detalhes
          </span>
        )}
      </div>
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
                fontFamily: "monospace",
                backdropFilter: "blur(20px)",
              }}
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === "metaAds" ? "Meta (Facebook)" : "Google Ads",
              ]}
              labelStyle={{ color: ct.tooltipColor, fontWeight: 600 }}
              cursor={{ fill: ct.cursorFill }}
            />
            <Legend
              formatter={(value) =>
                value === "metaAds" ? "Meta (Facebook)" : "Google Ads"
              }
              wrapperStyle={{ fontSize: 11, fontFamily: "monospace", color: ct.legendColor }}
            />
            <Bar
              dataKey="metaAds"
              fill="#3b82f6"
              radius={[6, 6, 0, 0]}
              cursor={onBarClick ? "pointer" : undefined}
              onClick={handleClick("metaAds")}
            />
            <Bar
              dataKey="googleAds"
              fill="#ef4444"
              radius={[6, 6, 0, 0]}
              cursor={onBarClick ? "pointer" : undefined}
              onClick={handleClick("googleAds")}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
