import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { NextRequest, NextResponse } from "next/server";

// ═══════════════════════════════════════════════════
// UTILITÁRIOS DE AUTENTICAÇÃO
// ═══════════════════════════════════════════════════

/**
 * Verificar se requisição está autenticada
 * Retorna session ou null se não autenticado
 */
export async function requireAuth(_request?: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    return session;
  } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
    return null;
  }
}

/**
 * Middleware para proteger rotas que exigem autenticação
 * Uso: async function POST(request: NextRequest) {
 *   const authResponse = await requireAuthMiddleware(request);
 *   if (authResponse) return authResponse;
 *   // ... resto do código
 * }
 */
export async function requireAuthMiddleware(_request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Authentication required. Please log in.",
      },
      { status: 401 }
    );
  }

  return null; // Continue com a requisição
}

/**
 * Extrair user ID da sessão
 */
export async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id || null;
}

/**
 * Extrair email da sessão
 */
export async function getUserEmail(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.email || null;
}
