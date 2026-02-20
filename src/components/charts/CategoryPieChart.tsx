"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { useChartTheme } from "@/hooks/useChartTheme";

interface CategoryData {
  name: string;
  amount: number;
  color: string;
}

interface Props {
  data: CategoryData[];
  onCategoryClick?: (params: { category: string; label: string }) => void;
}

export function CategoryPieChart({ data, onCategoryClick }: Props) {
  const ct = useChartTheme();
  const top = data.slice(0, 8);
  const rest = data.slice(8);
  const otherAmount = rest.reduce((sum, d) => sum + d.amount, 0);
  const chartData = otherAmount > 0
    ? [...top, { name: "Outros", amount: otherAmount, color: "#475569" }]
    : top;

  const total = chartData.reduce((sum, d) => sum + d.amount, 0);

  const handlePieClick = (_: unknown, index: number) => {
    if (!onCategoryClick) return;
    const item = chartData[index];
    if (item) {
      onCategoryClick({ category: item.name, label: item.name });
    }
  };

  const handleLegendClick = (categoryName: string) => {
    if (!onCategoryClick) return;
    onCategoryClick({ category: categoryName, label: categoryName });
  };

  return (
    <div className="glass-card" style={{ padding: 28 }}>
      <div className="flex items-center justify-between mb-5">
        <h3
          className="text-[10px] font-bold tracking-[0.2em] uppercase font-mono"
          style={{ color: "var(--muted)" }}
        >
          GASTOS POR CATEGORIA
        </h3>
        {onCategoryClick && (
          <span className="text-[10px] font-mono" style={{ color: "var(--muted)", opacity: 0.6 }}>
            Clique para ver detalhes
          </span>
        )}
      </div>
      <div className="flex items-center gap-6">
        <div style={{ width: 200, height: 200 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="amount"
                strokeWidth={0}
                onClick={handlePieClick}
                cursor={onCategoryClick ? "pointer" : undefined}
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: ct.tooltipBg,
                  border: `1px solid ${ct.tooltipBorder}`,
                  borderRadius: 12,
                  fontSize: 11,
                  fontFamily: "monospace",
                  backdropFilter: "blur(20px)",
                }}
                formatter={(value: number | undefined) => [value !== undefined ? formatCurrency(value) : "R$ 0", ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2.5">
          {chartData.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 text-xs group"
              onClick={() => handleLegendClick(item.name)}
              style={{ cursor: onCategoryClick ? "pointer" : undefined }}
              role={onCategoryClick ? "button" : undefined}
              tabIndex={onCategoryClick ? 0 : undefined}
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
                style={{ background: item.color }}
              />
              <span className="flex-1 truncate font-medium group-hover:underline" style={{ color: "var(--foreground)" }}>
                {item.name}
              </span>
              <span className="font-mono text-[10px] font-bold" style={{ color: "var(--muted)" }}>
                {((item.amount / total) * 100).toFixed(1)}%
              </span>
              <span className="font-mono font-bold text-[11px]" style={{ color: "var(--foreground)" }}>
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
