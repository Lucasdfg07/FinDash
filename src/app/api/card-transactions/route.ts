import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cardTransactions = await prisma.cardTransaction.findMany({
      include: { category: true },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(cardTransactions);
  } catch (error) {
    console.error("Error fetching card transactions:", error);
    return NextResponse.json({ error: "Erro ao buscar faturas" }, { status: 500 });
  }
}
