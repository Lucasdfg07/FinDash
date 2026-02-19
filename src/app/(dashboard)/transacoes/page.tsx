"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import DateRangeFilter, { DateRange, filterByDateRange, getPresetRange } from "@/components/shared/DateRangeFilter";
import PageLoading from "@/components/shared/PageLoading";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  balance: number | null;
  type: string;
  recipient: string | null;
  category: { id: string; name: string; color: string } | null;
}

const typeLabels: Record<string, string> = {
  pix_sent: "Pix Enviado",
  pix_received: "Pix Recebido",
  payment: "Pagamento",
  application: "Aplicação",
  tax: "Imposto",
  other: "Outros",
};

export default function TransacoesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetRange(-1));

  useEffect(() => {
    fetch("/api/transactions")
      .then((r) => r.json())
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterByDateRange(transactions, dateRange, (t) => t.date).filter((t) => {
    const matchSearch =
      !search ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.recipient && t.recipient.toLowerCase().includes(search.toLowerCase()));
    const matchType = typeFilter === "all" || t.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalEntradas = filtered
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSaidas = filtered
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  if (loading) {
    return <PageLoading message="Carregando extrato..." />;
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Extrato <span className="gradient-text">Bancário</span>
          </h1>
          <p className="text-sm mt-1 font-medium" style={{ color: "var(--muted)" }}>
            {dateRange.startDate ? "Período filtrado" : "Todas as transações"} da conta corrente Inter
          </p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="stat-card">
          <p className="text-[10px] font-bold mb-2 tracking-[0.15em] uppercase font-mono" style={{ color: "var(--muted)" }}>ENTRADAS</p>
          <p className="text-2xl font-bold" style={{ color: "var(--success)" }}>
            {formatCurrency(totalEntradas)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-[10px] font-bold mb-2 tracking-[0.15em] uppercase font-mono" style={{ color: "var(--muted)" }}>SAÍDAS</p>
          <p className="text-2xl font-bold" style={{ color: "var(--danger)" }}>
            {formatCurrency(totalSaidas)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-[10px] font-bold mb-2 tracking-[0.15em] uppercase font-mono" style={{ color: "var(--muted)" }}>SALDO (LÍQUIDO)</p>
          <p className="text-2xl font-bold" style={{ color: totalEntradas - totalSaidas >= 0 ? "var(--primary)" : "var(--danger)" }}>
            {formatCurrency(totalEntradas - totalSaidas)}
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
            placeholder="Buscar por descrição ou destinatário..."
            className="w-full pl-10"
            aria-label="Buscar transações"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} style={{ color: "var(--muted)" }} />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filtrar por tipo de transação">
            <option value="all">Todos os tipos</option>
            <option value="pix_received">Pix Recebido</option>
            <option value="pix_sent">Pix Enviado</option>
            <option value="payment">Pagamento</option>
            <option value="application">Aplicação</option>
            <option value="tax">Imposto</option>
            <option value="other">Outros</option>
          </select>
        </div>
        <span className="badge" style={{ color: "var(--primary)", background: "rgba(209,245,23,0.08)", border: "1px solid rgba(209,245,23,0.15)" }}>
          {filtered.length} transações
        </span>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="table-container" style={{ maxHeight: "calc(100vh - 320px)" }}>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th className="text-right">Valor</th>
                <th className="text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td className="whitespace-nowrap text-xs font-mono" style={{ color: "var(--muted)" }}>
                    {formatDate(t.date)}
                  </td>
                  <td>
                    <div>
                      <span className="text-sm font-medium">{t.description}</span>
                      {t.recipient && (
                        <p className="text-[10px] mt-0.5 font-mono" style={{ color: "var(--muted)" }}>
                          {t.recipient}
                        </p>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: t.amount > 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                        color: t.amount > 0 ? "var(--success)" : "var(--danger)",
                        border: `1px solid ${t.amount > 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                      }}
                    >
                      {t.amount > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                      {typeLabels[t.type] || t.type}
                    </span>
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
                  <td
                    className="text-right font-bold font-mono whitespace-nowrap text-sm"
                    style={{ color: t.amount > 0 ? "var(--success)" : "var(--danger)" }}
                  >
                    {t.amount > 0 ? "+" : ""}
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="text-right whitespace-nowrap font-mono text-xs" style={{ color: "var(--muted)" }}>
                    {t.balance !== null ? formatCurrency(t.balance) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
