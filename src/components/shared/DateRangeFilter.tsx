"use client";

import { Calendar, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  /** Which side to align the dropdown. Default "right" (extends left). */
  align?: "left" | "right";
}

const presets = [
  { label: "Últimos 7 dias", days: 7 },
  { label: "Últimos 15 dias", days: 15 },
  { label: "Últimos 30 dias", days: 30 },
  { label: "Últimos 60 dias", days: 60 },
  { label: "Últimos 90 dias", days: 90 },
  { label: "Este mês", days: -1 },
  { label: "Mês passado", days: -2 },
  { label: "Todo o período", days: 0 },
];

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function getPresetRange(days: number): DateRange {
  const now = new Date();

  if (days === 0) {
    return { startDate: "", endDate: "" };
  }

  if (days === -1) {
    // This month
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: now.toISOString().split("T")[0],
    };
  }

  if (days === -2) {
    // Last month
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }

  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: now.toISOString().split("T")[0],
  };
}

function getActiveLabel(value: DateRange): string {
  if (!value.startDate && !value.endDate) {
    return "Todo o período";
  }
  return `${formatDisplayDate(value.startDate)} — ${formatDisplayDate(value.endDate)}`;
}

export default function DateRangeFilter({ value, onChange, align = "right" }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.02)",
        }}
      >
        <Calendar size={15} style={{ color: "var(--primary)" }} />
        <span className="font-mono text-xs tracking-wide">
          {getActiveLabel(value)}
        </span>
        <ChevronDown
          size={14}
          style={{ color: "var(--muted)" }}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute top-full mt-2 z-50 w-[340px] rounded-xl animate-fade-in ${align === "left" ? "left-0" : "right-0"}`}
          style={{
            background: "var(--card-solid)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Presets */}
          <div className="p-2">
            <p
              className="text-[10px] font-bold tracking-[0.15em] uppercase font-mono px-3 py-2"
              style={{ color: "var(--muted)" }}
            >
              Atalhos
            </p>
            <div className="grid grid-cols-2 gap-1">
              {presets.map((preset) => {
                const presetRange = getPresetRange(preset.days);
                const isActive =
                  value.startDate === presetRange.startDate &&
                  value.endDate === presetRange.endDate;

                return (
                  <button
                    key={preset.label}
                    onClick={() => {
                      onChange(presetRange);
                      setOpen(false);
                    }}
                    className="text-left px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                    style={{
                      background: isActive
                        ? "var(--primary-glow)"
                        : "transparent",
                      color: isActive ? "var(--primary)" : "var(--foreground)",
                      border: isActive
                        ? "1px solid var(--primary-glow)"
                        : "1px solid transparent",
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid var(--border)" }} />

          {/* Custom Range */}
          <div className="p-3">
            <p
              className="text-[10px] font-bold tracking-[0.15em] uppercase font-mono mb-2.5"
              style={{ color: "var(--muted)" }}
            >
              Período personalizado
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="date"
                  value={value.startDate}
                  onChange={(e) => onChange({ ...value, startDate: e.target.value })}
                  className="w-full text-xs py-2 px-3"
                  style={{ fontSize: "11px" }}
                />
              </div>
              <span
                className="text-xs font-mono font-bold"
                style={{ color: "var(--muted)" }}
              >
                até
              </span>
              <div className="flex-1">
                <input
                  type="date"
                  value={value.endDate}
                  onChange={(e) => onChange({ ...value, endDate: e.target.value })}
                  className="w-full text-xs py-2 px-3"
                  style={{ fontSize: "11px" }}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  onChange({ startDate: "", endDate: "" });
                  setOpen(false);
                }}
                className="flex-1 text-xs font-medium py-2 rounded-lg transition-all"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                }}
              >
                Limpar
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 btn-primary text-xs py-2 rounded-lg"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Utility: filter an array of items by date range */
export function filterByDateRange<T>(
  items: T[],
  dateRange: DateRange,
  getDate: (item: T) => string | Date
): T[] {
  if (!dateRange.startDate && !dateRange.endDate) return items;

  return items.filter((item) => {
    const d = new Date(getDate(item));
    if (dateRange.startDate) {
      const start = new Date(dateRange.startDate);
      start.setHours(0, 0, 0, 0);
      if (d < start) return false;
    }
    if (dateRange.endDate) {
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  });
}
