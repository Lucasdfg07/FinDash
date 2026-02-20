/**
 * API Route: Remoção de transações duplicadas
 * POST /api/inter/dedup
 *
 * Remove transações duplicadas importadas pela API do Inter.
 * Critério: mesmo valor + mesmo tipo + mesma fonte + datas dentro de ±2 dias.
 */

import { NextRequest, NextResponse } from "next/server";
import { removeDuplicateTransactions } from "@/lib/inter-sync";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireAuthMiddleware } from "@/lib/auth-utils";
import { auditSuccess, auditAuthFailure, auditRateLimitExceeded } from "@/lib/audit-logger";
import { handleCORS, addCORSHeaders } from "@/lib/cors";

const ENDPOINT = "/api/inter/dedup";

export async function OPTIONS(request: NextRequest) {
  return await handleCORS(request) || new NextResponse(null, { status: 405 });
}

export async function POST(request: NextRequest) {
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

    console.log("[Dedup API] Iniciando remoção de duplicatas...");

    const result = await removeDuplicateTransactions();

    console.log(
      `[Dedup API] Concluído: ${result.duplicatesRemoved} duplicatas removidas de ${result.totalAnalyzed} transações`
    );

    // Log successful dedup execution
    await auditSuccess(request, "dedup_executed", ENDPOINT, {
      totalAnalyzed: result.totalAnalyzed,
      duplicatesRemoved: result.duplicatesRemoved,
    });

    const response = NextResponse.json({
      success: true,
      totalAnalyzed: result.totalAnalyzed,
      duplicatesRemoved: result.duplicatesRemoved,
      details: result.details,
    });

    return addCORSHeaders(response, request.headers.get("origin"));
  } catch (err) {
    console.error("[Dedup API] Erro:", err);
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      },
      { status: 500 }
    );
    return addCORSHeaders(errorResponse, request.headers.get("origin"));
  }
}
