"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  X,
  Search,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  CreditCard,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

/** The filter that triggers a drilldown fetch. */
export interface DrillDownFilter {
  type:
    | "revenue"
    | "expenses"
    | "metaAds"
    | "googleAds"
    | "category"
    | "recipient_expense"
    | "recipient_income";
  month?: string; // YYYY-MM
  category?: string;
  recipient?: string;
  label: string; // e.g. "dez/25 • Entradas"
  /** Which chart section triggered the drilldown */
  section?: "row1" | "row2" | "row3";
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  detail: string | null;
  amount: number;
  category: { name: string; color: string } | null;
  source: "bank" | "card";
}

interface DrillDownPanelProps {
  filter: DrillDownFilter;
  onClose: () => void;
  /** Optional global date range to forward to the API */
  startDate?: string;
  endDate?: string;
}

export default function DrillDownPanel({
  filter,
  onClose,
  startDate,
  endDate,
}: DrillDownPanelProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "bank" | "card">("all");
  const panelRef = useRef<HTMLDivElement>(null);

  // Keyboard dismiss — Esc key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Scroll panel into view when it opens
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    setSearch("");
    setSourceFilter("all");

    const params = new URLSearchParams();
    params.set("type", filter.type);
    if (filter.month) params.set("month", filter.month);
    if (filter.category) params.set("category", filter.category);
    if (filter.recipient) params.set("recipient", filter.recipient);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    fetch(`/api/drilldown?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setTransactions(data.transactions || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter, startDate, endDate]);

  const filtered = transactions.filter((t) => {
    const matchSearch =
      !search ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.detail && t.detail.toLowerCase().includes(search.toLowerCase()));
    const matchSource = sourceFilter === "all" || t.source === sourceFilter;
    return matchSearch && matchSource;
  });

  const filteredTotal = filtered.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div
      ref={panelRef}
      className="glass-card overflow-hidden animate-slide-up"
      role="region"
      aria-label={`Detalhes: ${filter.label}`}
      style={{
        border: "1px solid var(--primary-glow)",
        boxShadow: "0 -4px 32px var(--primary-glow), 0 0 60px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between flex-wrap gap-3"
        style={{ borderBottom: "1px solid var(--border)", padding: 24 }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="text-lg font-bold tracking-tight">Transações</h3>
          <span
            className="badge text-[10px] font-bold font-mono"
            style={{
              background: "var(--primary-glow)",
              color: "var(--primary)",
              border: "1px solid var(--primary-glow)",
            }}
          >
            {filter.label}
          </span>
          {!loading && (
            <span className="text-xs font-mono font-medium" style={{ color: "var(--muted)" }}>
              {filtered.length} transações · Total:{" "}
              <span
                className="font-bold"
                style={{
                  color: filteredTotal >= 0 ? "var(--success)" : "var(--danger)",
                }}
              >
                {formatCurrency(Math.abs(filteredTotal))}
              </span>
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="btn-icon"
          aria-label="Fechar painel"
          title="Fechar (Esc)"
        >
          <X size={16} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap" style={{ borderBottom: "1px solid var(--border)", padding: 24 }}>
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--muted)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar transação..."
            className="w-full pl-9 text-xs py-2"
            aria-label="Buscar transação"
          />
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as "all" | "bank" | "card")}
          className="text-xs py-2"
          aria-label="Filtrar por origem"
        >
          <option value="all">Todos</option>
          <option value="bank">Extrato</option>
          <option value="card">Cartão</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2">
          <Loader2 size={18} className="animate-spin" style={{ color: "var(--primary)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            Carregando transações...
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state py-12">
          <Search size={32} style={{ color: "var(--muted)", opacity: 0.4 }} />
          <p>Nenhuma transação encontrada</p>
        </div>
      ) : (
        <div className="table-container max-h-[420px]">
          <table>
            <thead>
              <tr>
                <th style={{ paddingLeft: 24 }}>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th className="text-right" style={{ paddingRight: 24 }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={`${t.source}-${t.id}`}>
                  <td className="whitespace-nowrap text-xs font-mono" style={{ color: "var(--muted)", paddingLeft: 24 }}>
                    <div className="flex items-center gap-2">
                      {t.source === "bank" ? (
                        <Landmark size={12} style={{ color: "var(--muted)", opacity: 0.5 }} />
                      ) : (
                        <CreditCard size={12} style={{ color: "var(--muted)", opacity: 0.5 }} />
                      )}
                      {formatDate(t.date)}
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className="text-sm font-medium">{t.description}</span>
                      {t.detail && (
                        <p
                          className="text-[10px] mt-0.5 font-mono truncate max-w-[300px]"
                          style={{ color: "var(--muted)" }}
                        >
                          {t.detail}
                        </p>
                      )}
                    </div>
                  </td>
                  <td>
                    {t.category && (
                      <span
                        className="badge text-[10px]"
                        style={{
                          background: `${t.category.color}12`,
                          color: t.category.color,
                          border: `1px solid ${t.category.color}20`,
                        }}
                      >
                        {t.category.name}
                      </span>
                    )}
                  </td>
                  <td
                    className="text-right font-bold font-mono whitespace-nowrap text-sm"
                    style={{
                      color: t.amount > 0 ? "var(--success)" : "var(--danger)",
                      paddingRight: 24,
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {t.amount > 0 ? (
                        <ArrowUpRight size={12} />
                      ) : (
                        <ArrowDownRight size={12} />
                      )}
                      {t.amount > 0 ? "+" : ""}
                      {formatCurrency(t.amount)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
