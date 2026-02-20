import { NextRequest, NextResponse } from "next/server";
import { fullSync } from "@/lib/inter-sync";
import { format, subMonths } from "date-fns";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireAuthMiddleware } from "@/lib/auth-utils";
import { interSyncSchema } from "@/lib/schemas";
import { ZodError } from "zod";
import {
  auditSuccess,
  auditAuthFailure,
  auditRateLimitExceeded,
  auditInvalidInput,
} from "@/lib/audit-logger";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const ENDPOINT = "/api/inter/sync";

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
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(resetIn / 1000).toString(),
          },
        }
      );
    }

    // 3. ✅ Validar input com Zod (NOVO)
    const body = await request.json().catch(() => ({}));
    let validated;
    try {
      validated = interSyncSchema.parse({
        dataInicio: body.dataInicio || format(subMonths(new Date(), 3), "yyyy-MM-dd"),
        dataFim: body.dataFim || format(new Date(), "yyyy-MM-dd"),
      });
    } catch (validationError) {
      await auditInvalidInput(request, ENDPOINT, (validationError as any).issues || validationError);
      throw validationError;
    }

    console.log(`[Inter Sync] Iniciando sincronização: ${validated.dataInicio} → ${validated.dataFim}`);

    const result = await fullSync(validated.dataInicio, validated.dataFim);

    console.log(`[Inter Sync] Concluído em ${result.duration}ms:`, {
      extrato: result.extrato,
      faturas: result.faturas,
      saldo: result.saldo,
    });

    // Log successful sync
    const session = await getServerSession(authOptions);
    await auditSuccess(request, "sync_initiated", ENDPOINT, {
      dataInicio: validated.dataInicio,
      dataFim: validated.dataFim,
      extrato: result.extrato,
      faturas: result.faturas,
    });

    return NextResponse.json({
      success: true,
      message: "Sincronização concluída com sucesso",
      ...result,
    });
  } catch (error) {
    console.error("[Inter Sync] Erro:", error);

    // Tratamento específico de erro de validação
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: (error as any).issues || "Validation failed",
        },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Erro desconhecido na sincronização";

    // Mensagens amigáveis para erros comuns
    let userMessage = message;
    if (message.includes("Certificado")) {
      userMessage =
        "Certificado digital não encontrado. Configure INTER_CERT_PEM e INTER_KEY_PEM no .env";
    } else if (message.includes("401") || message.includes("403")) {
      userMessage =
        "Credenciais inválidas ou sem permissão. Verifique o Client ID e Client Secret.";
    } else if (message.includes("ECONNREFUSED")) {
      userMessage =
        "Não foi possível conectar à API do Inter. Verifique sua conexão com a internet.";
    }

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
        details: message,
      },
      { status: 500 }
    );
  }
}
