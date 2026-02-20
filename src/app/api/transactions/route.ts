import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/schemas";
import { authOptions } from "@/lib/auth";
import { publishTransactionCreated } from "@/lib/redis-pubsub";

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      include: { category: true },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Erro ao buscar transações" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id || "default";

    const body = await request.json();
    const validatedData = transactionSchema.parse(body);

    const transaction = await prisma.transaction.create({
      data: validatedData,
      include: { category: true },
    });

    // Publish real-time event
    await publishTransactionCreated(userId, {
      ...transaction,
      source: body.source || "manual",
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ error: "Erro ao criar transação" }, { status: 500 });
  }
}
