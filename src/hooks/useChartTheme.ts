"use client";

import { useTheme } from "@/contexts/ThemeContext";

export function useChartTheme() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return {
    gridStroke: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)",
    axisStroke: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
    tooltipBg: isDark ? "rgba(10, 10, 10, 0.95)" : "rgba(255, 255, 255, 0.97)",
    tooltipBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
    tooltipColor: isDark ? "#71717a" : "#6b7280",
    cursorFill: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)",
    tickFill: isDark ? "#a1a1aa" : "#6b7280",
    legendColor: isDark ? "#a1a1aa" : "#6b7280",
  };
}
