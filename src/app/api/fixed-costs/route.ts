import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const fixedCosts = await prisma.fixedCost.findMany({
      include: { category: true },
      orderBy: [{ subcategory: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(fixedCosts);
  } catch (error) {
    console.error("Error fetching fixed costs:", error);
    return NextResponse.json({ error: "Erro ao buscar custos fixos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, amount, categoryId, subcategory, recurrence, renewalDate, notes } = body;

    if (!name || !amount || !categoryId) {
      return NextResponse.json({ error: "Nome, valor e categoria são obrigatórios" }, { status: 400 });
    }

    const fixedCost = await prisma.fixedCost.create({
      data: {
        name,
        amount: parseFloat(amount),
        categoryId,
        subcategory: subcategory || null,
        recurrence: recurrence || "monthly",
        renewalDate: renewalDate || null,
        notes: notes || null,
      },
      include: { category: true },
    });

    return NextResponse.json(fixedCost, { status: 201 });
  } catch (error) {
    console.error("Error creating fixed cost:", error);
    return NextResponse.json({ error: "Erro ao criar custo fixo" }, { status: 500 });
  }
}
