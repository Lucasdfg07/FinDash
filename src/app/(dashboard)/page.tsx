"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Megaphone,
  PiggyBank,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { RevenueExpenseChart } from "@/components/charts/RevenueExpenseChart";
import { AdsSpendChart } from "@/components/charts/AdsSpendChart";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { TopExpensesChart } from "@/components/charts/TopExpensesChart";
import { FixedVsVariableChart } from "@/components/charts/FixedVsVariableChart";
import DateRangeFilter, { DateRange, getPresetRange } from "@/components/shared/DateRangeFilter";
import DrillDownPanel, { DrillDownFilter } from "@/components/shared/DrillDownPanel";
import PageLoading from "@/components/shared/PageLoading";

interface DashboardData {
  summary: {
    totalRevenue: number;
    launchPadRevenue: number;
    totalBankExpenses: number;
    metaAdsSpend: number;
    googleAdsSpend: number;
    totalAdsSpend: number;
    roas: number;
    totalMonthlyFixedCosts: number;
    currentBalance: number;
  };
  monthlyData: Array<{
    month: string;
    revenue: number;
    expenses: number;
    metaAds: number;
    googleAds: number;
    fixedCosts: number;
    cardExpenses: number;
  }>;
  topExpenses: Array<{ name: string; amount: number }>;
  topIncome: Array<{ name: string; amount: number }>;
  categoryBreakdown: Array<{ name: string; amount: number; color: string }>;
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor,
  trend,
  large,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  accentColor: string;
  trend?: "up" | "down";
  large?: boolean;
}) {
  return (
    <div className="stat-card animate-fade-in group" role="region" aria-label={title}>
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl transition-transform duration-300 group-hover:scale-110"
          style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}18` }}
        >
          <Icon size={18} style={{ color: accentColor }} strokeWidth={2} />
        </div>
        {trend && (
          <div
            className="flex items-center gap-1 text-xs font-bold font-mono rounded-full px-2.5 py-1"
            style={{
              color: trend === "up" ? "var(--success)" : "var(--danger)",
              background: trend === "up" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${trend === "up" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
            }}
          >
            {trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          </div>
        )}
      </div>
      <p
        className="text-[11px] font-semibold mb-1.5 tracking-[0.12em] uppercase font-mono"
        style={{ color: "var(--muted)" }}
      >
        {title}
      </p>
      <p
        className={`font-bold tracking-tight ${large ? "text-3xl" : "text-2xl"}`}
        style={{ color: accentColor }}
      >
        {value}
      </p>
      {subtitle && (
        <p className="text-[11px] mt-2 font-medium leading-relaxed" style={{ color: "var(--muted)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetRange(-1));
  const [drillDown, setDrillDown] = useState<DrillDownFilter | null>(null);

  const fetchData = useCallback((range: DateRange) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (range.startDate) params.set("startDate", range.startDate);
    if (range.endDate) params.set("endDate", range.endDate);
    const qs = params.toString();
    fetch(`/api/dashboard${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData(dateRange);
  }, [dateRange, fetchData]);

  // Close drilldown when date range changes
  useEffect(() => {
    setDrillDown(null);
  }, [dateRange]);

  // Helper to open drilldown in a specific section
  const openDrillDown = (filter: DrillDownFilter) => {
    setDrillDown(filter);
  };

  // ---- Chart click handlers ----
  const handleRevenueExpenseClick = (params: { month: string; type: "revenue" | "expenses"; label: string }) => {
    openDrillDown({
      type: params.type,
      month: params.month,
      label: params.label,
      section: "row1",
    });
  };

  const handleAdsClick = (params: { month: string; type: "metaAds" | "googleAds"; label: string }) => {
    openDrillDown({
      type: params.type,
      month: params.month,
      label: params.label,
      section: "row1",
    });
  };

  const handleCategoryClick = (params: { category: string; label: string }) => {
    openDrillDown({
      type: "category",
      category: params.category,
      label: params.label,
      section: "row2",
    });
  };

  const handleTopExpenseClick = (params: { recipient: string; label: string }) => {
    openDrillDown({
      type: "recipient_expense",
      recipient: params.recipient,
      label: params.label,
      section: "row3",
    });
  };

  const handleTopIncomeClick = (params: { recipient: string; label: string }) => {
    openDrillDown({
      type: "recipient_income",
      recipient: params.recipient,
      label: params.label,
      section: "row3",
    });
  };

  // Render drill-down panel for a specific section
  const renderDrillDown = (section: "row1" | "row2" | "row3") => {
    if (!drillDown || drillDown.section !== section) return null;
    return (
      <DrillDownPanel
        filter={drillDown}
        onClose={() => setDrillDown(null)}
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
      />
    );
  };

  if (loading) {
    return <PageLoading message="Carregando dashboard..." />;
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <p style={{ color: "var(--muted)" }}>Erro ao carregar dados</p>
      </div>
    );
  }

  const { summary } = data;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard <span className="gradient-text">Financeiro</span>
          </h1>
          <p className="text-sm mt-1 font-medium" style={{ color: "var(--muted)" }}>
            {dateRange.startDate ? "Período filtrado" : "Todo o período"} — Dados do Banco Inter
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter value={dateRange} onChange={setDateRange} align="left" />
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{
              background: "rgba(209, 245, 23, 0.06)",
              border: "1px solid rgba(209, 245, 23, 0.15)",
              boxShadow: "0 2px 8px rgba(209, 245, 23, 0.05), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <Zap size={14} style={{ color: "var(--primary)" }} />
            <span className="text-xs font-mono font-bold" style={{ color: "var(--primary)" }}>
              LIVE DATA
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards - Main Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="ROAS Total"
          value={`${summary.roas.toFixed(2)}x`}
          subtitle={`Para cada R$1 investido, retorna R$${summary.roas.toFixed(2)}`}
          icon={Target}
          accentColor="var(--primary)"
          trend="up"
          large
        />
        <KpiCard
          title="Receita Total"
          value={formatCurrency(summary.totalRevenue)}
          subtitle={`Launch Pad: ${formatCurrency(summary.launchPadRevenue)}`}
          icon={TrendingUp}
          accentColor="var(--success)"
          trend="up"
        />
        <KpiCard
          title="Investimento Ads"
          value={formatCurrency(summary.totalAdsSpend)}
          subtitle={`Meta: ${formatCurrency(summary.metaAdsSpend)} · Google: ${formatCurrency(summary.googleAdsSpend)}`}
          icon={Megaphone}
          accentColor="var(--info)"
        />
        <KpiCard
          title="Saldo Atual"
          value={formatCurrency(summary.currentBalance)}
          subtitle="Conta corrente Inter"
          icon={Wallet}
          accentColor="var(--purple)"
        />
      </div>

      {/* KPI Cards - Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <KpiCard
          title="Custos Fixos / Mês"
          value={formatCurrency(summary.totalMonthlyFixedCosts)}
          subtitle="Funcionários + Ferramentas"
          icon={PiggyBank}
          accentColor="var(--warning)"
        />
        <KpiCard
          title="Saídas Banco"
          value={formatCurrency(summary.totalBankExpenses)}
          subtitle="Excl. cartão e investimentos"
          icon={TrendingDown}
          accentColor="var(--danger)"
        />
        <KpiCard
          title="Lucro Líquido"
          value={formatCurrency(summary.totalRevenue - summary.totalBankExpenses - summary.totalMonthlyFixedCosts)}
          subtitle="Receita − Despesas − Custos Fixos"
          icon={DollarSign}
          accentColor={summary.totalRevenue - summary.totalBankExpenses - summary.totalMonthlyFixedCosts >= 0 ? "var(--success)" : "var(--danger)"}
          trend={summary.totalRevenue - summary.totalBankExpenses - summary.totalMonthlyFixedCosts >= 0 ? "up" : "down"}
        />
      </div>

      {/* Charts Row 1: Revenue/Expenses + Ads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueExpenseChart data={data.monthlyData} onBarClick={handleRevenueExpenseClick} />
        <AdsSpendChart data={data.monthlyData} onBarClick={handleAdsClick} />
      </div>

      {/* Drill-down for Row 1 (appears below Revenue/Expenses and Ads charts) */}
      {renderDrillDown("row1")}

      {/* Charts Row 2: Category + Fixed vs Variable */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart data={data.categoryBreakdown} onCategoryClick={handleCategoryClick} />
        <FixedVsVariableChart data={data.monthlyData} />
      </div>

      {/* Drill-down for Row 2 (appears below Category and Fixed/Variable charts) */}
      {renderDrillDown("row2")}

      {/* Charts Row 3: Top Expenses + Top Income */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopExpensesChart
          data={data.topExpenses}
          title="MAIORES SAÍDAS (EXTRATO)"
          color="#ef4444"
          onBarClick={handleTopExpenseClick}
        />
        <TopExpensesChart
          data={data.topIncome}
          title="MAIORES ENTRADAS"
          color="#22c55e"
          onBarClick={handleTopIncomeClick}
        />
      </div>

      {/* Drill-down for Row 3 (appears below Top Expenses and Top Income charts) */}
      {renderDrillDown("row3")}

      {/* ROAS Detail Card */}
      <div className="glass-card relative overflow-hidden" style={{ padding: 32 }}>
        {/* Glow background */}
        <div
          className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-[0.04]"
          style={{ background: "var(--primary)" }}
        />

        <h3
          className="text-[11px] font-bold mb-6 tracking-[0.18em] uppercase font-mono relative z-10"
          style={{ color: "var(--muted)" }}
        >
          DETALHAMENTO DO ROAS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          <div>
            <p className="text-[11px] font-bold mb-2 tracking-[0.12em] uppercase font-mono" style={{ color: "var(--muted)" }}>
              Receita Total (Período)
            </p>
            <p className="text-3xl font-bold tracking-tight" style={{ color: "var(--success)" }}>
              {formatCurrency(summary.totalRevenue)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold mb-2 tracking-[0.12em] uppercase font-mono" style={{ color: "var(--muted)" }}>
              Investimento em Ads
            </p>
            <p className="text-3xl font-bold tracking-tight" style={{ color: "var(--info)" }}>
              {formatCurrency(summary.totalAdsSpend)}
            </p>
            <div className="flex gap-4 mt-3">
              <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
                Meta: <span style={{ color: "var(--info)" }} className="font-bold">{formatCurrency(summary.metaAdsSpend)}</span>
              </span>
              <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
                Google: <span style={{ color: "var(--danger)" }} className="font-bold">{formatCurrency(summary.googleAdsSpend)}</span>
              </span>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold mb-2 tracking-[0.12em] uppercase font-mono" style={{ color: "var(--muted)" }}>
              ROAS = Receita ÷ Ads
            </p>
            <p className="text-5xl font-bold gradient-text tracking-tight">
              {summary.roas.toFixed(2)}x
            </p>
            <p className="text-xs mt-3 font-medium leading-relaxed" style={{ color: "var(--muted)" }}>
              Para cada R$1 investido, retorna{" "}
              <span style={{ color: "var(--primary)" }} className="font-bold">R${summary.roas.toFixed(2)}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
