import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

// ═══════════════════════════════════════════════════
// AUDIT LOGGING - Rastreamento de Segurança
// ═══════════════════════════════════════════════════

export type AuditAction =
  | "login_attempt"
  | "login_failed"
  | "sync_initiated"
  | "sync_status_checked"
  | "sync_failed"
  | "dedup_executed"
  | "transaction_created"
  | "transaction_deleted"
  | "auth_required_missing"
  | "rate_limit_exceeded"
  | "invalid_input";

export interface AuditLogEntry {
  action: AuditAction;
  resource: string;
  status: "success" | "failure";
  details?: Record<string, any>;
}

/**
 * Logar ação para auditoria
 * Capturas: user, IP, user-agent, timestamp
 */
export async function auditLog(
  request: NextRequest,
  entry: AuditLogEntry
) {
  try {
    // Obter informações de sessão
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || null;

    // Obter IP do cliente
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      request.ip ||
      null;

    const userAgent = request.headers.get("user-agent") || null;

    // Salvar no banco de dados
    await prisma.auditLog.create({
      data: {
        userId,
        action: entry.action,
        resource: entry.resource,
        status: entry.status,
        details: entry.details ? JSON.stringify(entry.details) : null,
        ip,
        userAgent,
      },
    });

    // Log local também
    console.log(
      `[AUDIT] ${entry.action} on ${entry.resource} - ${entry.status}`
    );
  } catch (error) {
    // Não falhar a requisição se o logging falhar
    console.error("[AUDIT ERROR] Failed to log audit entry:", error);
  }
}

/**
 * Logar falha de autenticação
 */
export async function auditAuthFailure(
  request: NextRequest,
  reason: string
) {
  await auditLog(request, {
    action: "login_failed",
    resource: "/api/auth",
    status: "failure",
    details: { reason },
  });
}

/**
 * Logar excesso de rate limit
 */
export async function auditRateLimitExceeded(
  request: NextRequest,
  endpoint: string
) {
  await auditLog(request, {
    action: "rate_limit_exceeded",
    resource: endpoint,
    status: "failure",
    details: { error: "Too many requests" },
  });
}

/**
 * Logar validação falhada
 */
export async function auditInvalidInput(
  request: NextRequest,
  endpoint: string,
  errors: any
) {
  await auditLog(request, {
    action: "invalid_input",
    resource: endpoint,
    status: "failure",
    details: { errors },
  });
}

/**
 * Logar operação bem-sucedida
 */
export async function auditSuccess(
  request: NextRequest,
  action: AuditAction,
  resource: string,
  details?: Record<string, any>
) {
  await auditLog(request, {
    action,
    resource,
    status: "success",
    details,
  });
}

/**
 * Limpar logs antigos (mais de 90 dias)
 * Chamar periodicamente via cron ou manual
 */
export async function cleanupOldAuditLogs(daysToKeep: number = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deleted = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`[AUDIT CLEANUP] Deleted ${deleted.count} old audit logs`);
    return deleted.count;
  } catch (error) {
    console.error("[AUDIT CLEANUP ERROR]", error);
    return 0;
  }
}
