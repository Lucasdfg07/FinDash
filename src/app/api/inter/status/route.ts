import { NextRequest, NextResponse } from "next/server";
import { checkConnection } from "@/lib/inter-api";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireAuthMiddleware } from "@/lib/auth-utils";
import { auditSuccess, auditAuthFailure, auditRateLimitExceeded } from "@/lib/audit-logger";

const ENDPOINT = "/api/inter/status";

export async function GET(request: NextRequest) {
  try {
    // 1. ✅ Verificar autenticação (NOVO)
    const authError = await requireAuthMiddleware(request);
    if (authError) {
      await auditAuthFailure(request, "Authentication middleware rejected");
      return authError;
    }

    // 2. ✅ Verificar rate limit (NOVO)
    const { allowed, resetIn } = await checkRateLimit(request, ENDPOINT);
    if (!allowed) {
      await auditRateLimitExceeded(request, ENDPOINT);
      return NextResponse.json(
        {
          error: "Too many requests",
          message: `Rate limit exceeded. Try again in ${Math.ceil(resetIn / 1000)} seconds.`,
        },
        { status: 429 }
      );
    }

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
      where: { source: "bank_extract" },
    });

    const interCardTransactions = await prisma.cardTransaction.count({
      where: { source: "card_invoice" },
    });

    const responseData = {
      ...status,
      lastSync: lastSyncSetting?.value || null,
      saldo: saldoSetting ? JSON.parse(saldoSetting.value) : null,
      stats: {
        transacoesImportadas: interTransactions,
        faturasImportadas: interCardTransactions,
      },
    };

    // Log successful status check
    await auditSuccess(request, "sync_status_checked", ENDPOINT, {
      status: status.connected,
    });

    return NextResponse.json(responseData);
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
