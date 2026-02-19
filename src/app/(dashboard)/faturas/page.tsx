"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Filter,
  CreditCard,
} from "lucide-react";
import { formatCurrency, formatDate, formatMonthYear } from "@/lib/utils";
import DateRangeFilter, { DateRange, filterByDateRange, getPresetRange } from "@/components/shared/DateRangeFilter";
import PageLoading from "@/components/shared/PageLoading";

interface CardTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  card: string | null;
  cardCategory: string | null;
  type: string | null;
  invoiceMonth: string;
  category: { id: string; name: string; color: string } | null;
}

export default function FaturasPage() {
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetRange(-1));

  useEffect(() => {
    fetch("/api/card-transactions")
      .then((r) => r.json())
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, []);

  const availableMonths = [...new Set(transactions.map((t) => t.invoiceMonth))].sort();

  const filtered = filterByDateRange(transactions, dateRange, (t) => t.date).filter((t) => {
    const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase());
    const matchMonth = monthFilter === "all" || t.invoiceMonth === monthFilter;
    return matchSearch && matchMonth;
  });

  const grouped: Record<string, CardTransaction[]> = {};
  for (const t of filtered) {
    if (!grouped[t.invoiceMonth]) grouped[t.invoiceMonth] = [];
    grouped[t.invoiceMonth].push(t);
  }

  const totalDebits = filtered
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const metaTotal = filtered
    .filter((t) => t.description.toUpperCase().includes("FACEBK") && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const googleTotal = filtered
    .filter((t) => t.description.toUpperCase().includes("GOOGLE ADS") && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  if (loading) {
    return <PageLoading message="Carregando faturas..." />;
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Faturas do <span className="gradient-text">Cartão</span>
          </h1>
          <p className="text-sm mt-1 font-medium" style={{ color: "var(--muted)" }}>
            {dateRange.startDate ? "Período filtrado —" : ""} Transações do cartão de crédito Inter
          </p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="stat-card">
          <p className="text-[10px] font-bold mb-2 tracking-[0.15em] uppercase font-mono" style={{ color: "var(--muted)" }}>TOTAL DÉBITOS</p>
          <p className="text-2xl font-bold" style={{ color: "var(--danger)" }}>
            {formatCurrency(totalDebits)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-[10px] font-bold mb-2 tracking-[0.15em] uppercase font-mono" style={{ color: "var(--muted)" }}>META ADS (FACEBK)</p>
          <p className="text-2xl font-bold" style={{ color: "#3b82f6" }}>
            {formatCurrency(metaTotal)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-[10px] font-bold mb-2 tracking-[0.15em] uppercase font-mono" style={{ color: "var(--muted)" }}>GOOGLE ADS</p>
          <p className="text-2xl font-bold" style={{ color: "#ef4444" }}>
            {formatCurrency(googleTotal)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-[10px] font-bold mb-2 tracking-[0.15em] uppercase font-mono" style={{ color: "var(--muted)" }}>OUTROS GASTOS</p>
          <p className="text-2xl font-bold" style={{ color: "var(--warning)" }}>
            {formatCurrency(totalDebits - metaTotal - googleTotal)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descrição..."
            className="w-full pl-10"
            aria-label="Buscar transações do cartão"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} style={{ color: "var(--muted)" }} />
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} aria-label="Filtrar por fatura">
            <option value="all">Todas as faturas</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>Fatura {formatMonthYear(m)}</option>
            ))}
          </select>
        </div>
        <span className="badge" style={{ color: "var(--primary)", background: "rgba(209,245,23,0.08)", border: "1px solid rgba(209,245,23,0.15)" }}>
          {filtered.length} transações
        </span>
      </div>

      {/* Grouped Tables */}
      {Object.entries(grouped)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([month, items]) => {
          const monthDebit = items
            .filter((t) => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
          const monthMeta = items
            .filter((t) => t.description.toUpperCase().includes("FACEBK") && t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

          return (
            <div key={month} className="glass-card overflow-hidden">
              <div className="flex items-center gap-3 flex-wrap" style={{ borderBottom: "1px solid var(--border)", padding: "20px 24px" }}>
                <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: "rgba(209,245,23,0.1)", border: "1px solid rgba(209,245,23,0.2)" }}>
                  <CreditCard size={14} style={{ color: "var(--primary)" }} />
                </div>
                <h3 className="text-sm font-bold tracking-tight">
                  Fatura {formatMonthYear(month)}
                </h3>
                <span className="text-[10px] font-mono font-bold ml-auto" style={{ color: "var(--muted)" }}>
                  Total: <span style={{ color: "var(--danger)" }}>{formatCurrency(monthDebit)}</span>
                  {monthMeta > 0 && (
                    <> | Meta: <span style={{ color: "#3b82f6" }}>{formatCurrency(monthMeta)}</span></>
                  )}
                </span>
              </div>
              <div className="table-container" style={{ maxHeight: "500px" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Cartão</th>
                      <th>Categoria</th>
                      <th>Tipo</th>
                      <th className="text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((t) => (
                      <tr key={t.id}>
                        <td className="whitespace-nowrap text-xs font-mono" style={{ color: "var(--muted)" }}>
                          {formatDate(t.date)}
                        </td>
                        <td className="text-sm font-medium">{t.description}</td>
                        <td className="text-xs font-mono" style={{ color: "var(--muted)" }}>
                          •••• {t.card || "-"}
                        </td>
                        <td>
                          {t.category && (
                            <span
                              className="badge"
                              style={{
                                background: `${t.category.color}15`,
                                color: t.category.color,
                                border: `1px solid ${t.category.color}25`,
                              }}
                            >
                              {t.category.name}
                            </span>
                          )}
                        </td>
                        <td className="text-xs font-mono" style={{ color: "var(--muted)" }}>
                          {t.type || "-"}
                        </td>
                        <td
                          className="text-right font-bold font-mono whitespace-nowrap text-sm"
                          style={{ color: t.amount > 0 ? "var(--success)" : "var(--danger)" }}
                        >
                          {t.amount > 0 ? "+" : ""}
                          {formatCurrency(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
    </div>
  );
}
