import { NextResponse } from "next/server";
import { checkConnection } from "@/lib/inter-api";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const status = await checkConnection();

    // Busca última sincronização
    const lastSyncSetting = await prisma.setting.findUnique({
      where: { key: "inter_last_sync" },
    });

    // Busca saldo salvo
    const saldoSetting = await prisma.setting.findUnique({
      where: { key: "inter_saldo" },
    });

    // Conta transações importadas do Inter
    const interTransactions = await prisma.transaction.count({
      where: { source: "inter_api" },
    });

    const interCardTransactions = await prisma.cardTransaction.count({
      where: { source: "inter_api" },
    });

    return NextResponse.json({
      ...status,
      lastSync: lastSyncSetting?.value || null,
      saldo: saldoSetting ? JSON.parse(saldoSetting.value) : null,
      stats: {
        transacoesImportadas: interTransactions,
        faturasImportadas: interCardTransactions,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        connected: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
