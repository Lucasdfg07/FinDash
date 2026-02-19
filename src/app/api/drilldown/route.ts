import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Drilldown API — returns bank + card transactions matching a chart click.
 *
 * Query params:
 *   type   = revenue | expenses | metaAds | googleAds | category | recipient_expense | recipient_income
 *   month  = YYYY-MM   (optional, filters by month)
 *   category = string  (required when type=category)
 *   recipient = string (required when type=recipient_expense or recipient_income)
 *   startDate / endDate = YYYY-MM-DD (optional global date range)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const month = searchParams.get("month");
    const category = searchParams.get("category");
    const recipient = searchParams.get("recipient");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (!type) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }

    // Build date range for the month filter
    let monthStart: Date | undefined;
    let monthEnd: Date | undefined;
    if (month) {
      const [year, mon] = month.split("-").map(Number);
      monthStart = new Date(year, mon - 1, 1);
      monthEnd = new Date(year, mon, 0, 23, 59, 59, 999);
    }

    // Global date range filter
    let globalStart: Date | undefined;
    let globalEnd: Date | undefined;
    if (startDateParam) globalStart = new Date(startDateParam);
    if (endDateParam) {
      globalEnd = new Date(endDateParam);
      globalEnd.setHours(23, 59, 59, 999);
    }

    // Use the most restrictive date range
    const effectiveStart = monthStart || globalStart;
    const effectiveEnd = monthEnd || globalEnd;

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (effectiveStart) dateFilter.gte = effectiveStart;
    if (effectiveEnd) dateFilter.lte = effectiveEnd;
    const dateWhere = Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {};

    interface UnifiedTransaction {
      id: string;
      date: string;
      description: string;
      detail: string | null;
      amount: number;
      category: { name: string; color: string } | null;
      source: "bank" | "card";
    }

    let results: UnifiedTransaction[] = [];

    // ---- Revenue: bank transactions amount > 0 and type = pix_received ----
    if (type === "revenue") {
      const txs = await prisma.transaction.findMany({
        where: {
          ...dateWhere,
          amount: { gt: 0 },
          type: "pix_received",
        },
        include: { category: true },
        orderBy: { date: "desc" },
      });
      results = txs.map((t) => ({
        id: t.id,
        date: t.date.toISOString(),
        description: t.description,
        detail: t.recipient,
        amount: t.amount,
        category: t.category ? { name: t.category.name, color: t.category.color } : null,
        source: "bank" as const,
      }));
    }

    // ---- Expenses: bank (amount < 0, not payment/application) + card (amount < 0) ----
    if (type === "expenses") {
      const bankTxs = await prisma.transaction.findMany({
        where: {
          ...dateWhere,
          amount: { lt: 0 },
          type: { notIn: ["payment", "application"] },
        },
        include: { category: true },
        orderBy: { date: "desc" },
      });
      const cardTxs = await prisma.cardTransaction.findMany({
        where: {
          ...dateWhere,
          amount: { lt: 0 },
        },
        include: { category: true },
        orderBy: { date: "desc" },
      });
      results = [
        ...bankTxs.map((t) => ({
          id: t.id,
          date: t.date.toISOString(),
          description: t.description,
          detail: t.recipient,
          amount: t.amount,
          category: t.category ? { name: t.category.name, color: t.category.color } : null,
          source: "bank" as const,
        })),
        ...cardTxs.map((t) => ({
          id: t.id,
          date: t.date.toISOString(),
          description: t.description,
          detail: t.card ? `Cartão •••• ${t.card}` : null,
          amount: t.amount,
          category: t.category ? { name: t.category.name, color: t.category.color } : null,
          source: "card" as const,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    // ---- Meta Ads: card transactions with FACEBK or META ----
    if (type === "metaAds") {
      const cardTxs = await prisma.cardTransaction.findMany({
        where: {
          ...dateWhere,
          amount: { lt: 0 },
          OR: [
            { description: { contains: "FACEBK" } },
            { description: { contains: "META" } },
          ],
        },
        include: { category: true },
        orderBy: { date: "desc" },
      });
      results = cardTxs.map((t) => ({
        id: t.id,
        date: t.date.toISOString(),
        description: t.description,
        detail: t.card ? `Cartão •••• ${t.card}` : null,
        amount: t.amount,
        category: t.category ? { name: t.category.name, color: t.category.color } : null,
        source: "card" as const,
      }));
    }

    // ---- Google Ads: card transactions with GOOGLE ADS ----
    if (type === "googleAds") {
      const cardTxs = await prisma.cardTransaction.findMany({
        where: {
          ...dateWhere,
          amount: { lt: 0 },
          description: { contains: "GOOGLE ADS" },
        },
        include: { category: true },
        orderBy: { date: "desc" },
      });
      results = cardTxs.map((t) => ({
        id: t.id,
        date: t.date.toISOString(),
        description: t.description,
        detail: t.card ? `Cartão •••• ${t.card}` : null,
        amount: t.amount,
        category: t.category ? { name: t.category.name, color: t.category.color } : null,
        source: "card" as const,
      }));
    }

    // ---- Category: all transactions (bank + card) with that category ----
    if (type === "category" && category) {
      const bankTxs = await prisma.transaction.findMany({
        where: {
          ...dateWhere,
          amount: { lt: 0 },
          category: category === "Sem Categoria" ? null : { name: category },
        },
        include: { category: true },
        orderBy: { date: "desc" },
      });
      const cardTxs = await prisma.cardTransaction.findMany({
        where: {
          ...dateWhere,
          amount: { lt: 0 },
          category: category === "Sem Categoria" ? null : { name: category },
        },
        include: { category: true },
        orderBy: { date: "desc" },
      });
      results = [
        ...bankTxs.map((t) => ({
          id: t.id,
          date: t.date.toISOString(),
          description: t.description,
          detail: t.recipient,
          amount: t.amount,
          category: t.category ? { name: t.category.name, color: t.category.color } : null,
          source: "bank" as const,
        })),
        ...cardTxs.map((t) => ({
          id: t.id,
          date: t.date.toISOString(),
          description: t.description,
          detail: t.card ? `Cartão •••• ${t.card}` : null,
          amount: t.amount,
          category: t.category ? { name: t.category.name, color: t.category.color } : null,
          source: "card" as const,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    // ---- Recipient Expense: bank transactions matching recipient, amount < 0 ----
    if (type === "recipient_expense" && recipient) {
      const txs = await prisma.transaction.findMany({
        where: {
          ...dateWhere,
          amount: { lt: 0 },
          recipient: { contains: recipient },
        },
        include: { category: true },
        orderBy: { date: "desc" },
      });
      results = txs.map((t) => ({
        id: t.id,
        date: t.date.toISOString(),
        description: t.description,
        detail: t.recipient,
        amount: t.amount,
        category: t.category ? { name: t.category.name, color: t.category.color } : null,
        source: "bank" as const,
      }));
    }

    // ---- Recipient Income: bank transactions matching recipient, amount > 0 ----
    if (type === "recipient_income" && recipient) {
      const txs = await prisma.transaction.findMany({
        where: {
          ...dateWhere,
          amount: { gt: 0 },
          type: "pix_received",
          recipient: { contains: recipient },
        },
        include: { category: true },
        orderBy: { date: "desc" },
      });
      results = txs.map((t) => ({
        id: t.id,
        date: t.date.toISOString(),
        description: t.description,
        detail: t.recipient,
        amount: t.amount,
        category: t.category ? { name: t.category.name, color: t.category.color } : null,
        source: "bank" as const,
      }));
    }

    const total = results.reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      transactions: results,
      count: results.length,
      total,
    });
  } catch (error) {
    console.error("Drilldown API error:", error);
    return NextResponse.json({ error: "Erro ao buscar drilldown" }, { status: 500 });
  }
}
