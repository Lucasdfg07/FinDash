import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build date filter
    const dateFilter: { date?: { gte?: Date; lte?: Date } } = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.date.lte = end;
      }
    }

    // Buscar todas as transações bancárias
    const transactions = await prisma.transaction.findMany({
      include: { category: true },
      orderBy: { date: "desc" },
      where: dateFilter,
    });

    // Buscar todas as transações do cartão
    const cardTransactions = await prisma.cardTransaction.findMany({
      include: { category: true },
      orderBy: { date: "desc" },
      where: dateFilter,
    });

    // Buscar custos fixos
    const fixedCosts = await prisma.fixedCost.findMany({
      include: { category: true },
      where: { active: true },
    });

    // Buscar categorias
    const categories = await prisma.category.findMany();

    // ====== CÁLCULOS ======

    // Receita total (entradas no extrato)
    const totalRevenue = transactions
      .filter((t) => t.amount > 0 && t.type === "pix_received")
      .reduce((sum, t) => sum + t.amount, 0);

    // Receita da Launch Pad
    const launchPadRevenue = transactions
      .filter((t) => t.amount > 0 && t.recipient?.includes("Launch Pad"))
      .reduce((sum, t) => sum + t.amount, 0);

    // Total gastos banco (saídas no extrato, excluindo pagamentos cartão e investimentos)
    const totalBankExpenses = transactions
      .filter((t) => t.amount < 0 && t.type !== "payment" && t.type !== "application")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Gastos Meta Ads (cartão)
    const metaAdsSpend = cardTransactions
      .filter((t) => t.description.toUpperCase().includes("FACEBK") || t.description.toUpperCase().includes("META"))
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Gastos Google Ads (cartão)
    const googleAdsSpend = cardTransactions
      .filter((t) => t.description.toUpperCase().includes("GOOGLE ADS"))
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Total Ads
    const totalAdsSpend = metaAdsSpend + googleAdsSpend;

    // ROAS = Receita / Investimento em Ads
    const roas = totalAdsSpend > 0 ? totalRevenue / totalAdsSpend : 0;

    // Custos fixos mensais totais
    const monthlyFixedCosts = fixedCosts
      .filter((c) => c.recurrence === "monthly")
      .reduce((sum, c) => sum + c.amount, 0);

    // Custos fixos anuais rateados
    const annualFixedCostsMonthly = fixedCosts
      .filter((c) => c.recurrence === "annual")
      .reduce((sum, c) => sum + c.amount / 12, 0);

    const totalMonthlyFixedCosts = monthlyFixedCosts + annualFixedCostsMonthly;

    // ====== DADOS MENSAIS ======
    const monthlyData: Record<string, {
      month: string;
      revenue: number;
      expenses: number;
      metaAds: number;
      googleAds: number;
      fixedCosts: number;
      cardExpenses: number;
    }> = {};

    // Coletar meses dinamicamente a partir das transações
    const monthSet = new Set<string>();
    for (const t of transactions) {
      monthSet.add(`${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`);
    }
    for (const t of cardTransactions) {
      monthSet.add(`${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`);
    }
    const months = Array.from(monthSet).sort();
    for (const m of months) {
      monthlyData[m] = {
        month: m,
        revenue: 0,
        expenses: 0,
        metaAds: 0,
        googleAds: 0,
        fixedCosts: totalMonthlyFixedCosts,
        cardExpenses: 0,
      };
    }

    // Preencher com transações bancárias
    for (const t of transactions) {
      const month = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyData[month]) continue;
      if (t.amount > 0 && t.type === "pix_received") {
        monthlyData[month].revenue += t.amount;
      } else if (t.amount < 0 && t.type !== "payment" && t.type !== "application") {
        monthlyData[month].expenses += Math.abs(t.amount);
      }
    }

    // Preencher com transações do cartão
    for (const t of cardTransactions) {
      const month = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyData[month]) continue;
      if (t.amount < 0) {
        monthlyData[month].cardExpenses += Math.abs(t.amount);
        const desc = t.description.toUpperCase();
        if (desc.includes("FACEBK") || desc.includes("META")) {
          monthlyData[month].metaAds += Math.abs(t.amount);
        } else if (desc.includes("GOOGLE ADS")) {
          monthlyData[month].googleAds += Math.abs(t.amount);
        }
      }
    }

    // ====== TOP GASTOS ======
    const expenseByRecipient: Record<string, number> = {};
    for (const t of transactions) {
      if (t.amount < 0 && t.recipient) {
        expenseByRecipient[t.recipient] = (expenseByRecipient[t.recipient] || 0) + Math.abs(t.amount);
      }
    }
    const topExpenses = Object.entries(expenseByRecipient)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // ====== TOP ENTRADAS ======
    const incomeByRecipient: Record<string, number> = {};
    for (const t of transactions) {
      if (t.amount > 0 && t.type === "pix_received" && t.recipient) {
        incomeByRecipient[t.recipient] = (incomeByRecipient[t.recipient] || 0) + t.amount;
      }
    }
    const topIncome = Object.entries(incomeByRecipient)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // ====== GASTOS POR CATEGORIA ======
    const expenseByCategory: Record<string, { name: string; amount: number; color: string }> = {};
    for (const t of [...transactions.filter(tx => tx.amount < 0), ...cardTransactions.filter(tx => tx.amount < 0)]) {
      const catName = t.category?.name || "Sem Categoria";
      const catColor = t.category?.color || "#64748b";
      if (!expenseByCategory[catName]) {
        expenseByCategory[catName] = { name: catName, amount: 0, color: catColor };
      }
      expenseByCategory[catName].amount += Math.abs(t.amount);
    }
    const categoryBreakdown = Object.values(expenseByCategory)
      .sort((a, b) => b.amount - a.amount);

    // Saldo atual
    const currentBalance = transactions.length > 0 ? transactions[0].balance || 0 : 0;

    return NextResponse.json({
      summary: {
        totalRevenue,
        launchPadRevenue,
        totalBankExpenses,
        metaAdsSpend,
        googleAdsSpend,
        totalAdsSpend,
        roas,
        totalMonthlyFixedCosts,
        currentBalance,
      },
      monthlyData: Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)),
      topExpenses,
      topIncome,
      categoryBreakdown,
      fixedCosts,
      categories,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Erro ao carregar dados" }, { status: 500 });
  }
}
