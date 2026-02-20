import { NextRequest, NextResponse } from "next/server";

/**
 * CORS Configuration
 * Gerencia origens permitidas para Cross-Origin Resource Sharing
 */

// Origens permitidas baseadas em ambiente
const getAllowedOrigins = (): string[] => {
  const env = process.env.NODE_ENV || "development";
  const customOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : [];

  const defaults = {
    development: ["http://localhost:3000", "http://localhost:3001"],
    production: [
      process.env.NEXT_PUBLIC_APP_URL || "https://findash.com",
    ].filter(Boolean),
  };

  const baseOrigins = defaults[env as keyof typeof defaults] || defaults.development;
  return [...new Set([...baseOrigins, ...customOrigins])]; // Remove duplicatas
};

/**
 * Verificar se origem é permitida
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  const allowedOrigins = getAllowedOrigins();

  // Verificação exata de origem
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Permitir localhost em desenvolvimento
  if (process.env.NODE_ENV === "development" && origin.includes("localhost")) {
    return true;
  }

  return false;
}

/**
 * Middleware CORS para requisições OPTIONS (preflight)
 */
export async function handleCORS(request: NextRequest): Promise<NextResponse | null> {
  const origin = request.headers.get("origin");

  // Requisições OPTIONS (preflight)
  if (request.method === "OPTIONS") {
    if (!isOriginAllowed(origin)) {
      return new NextResponse(null, { status: 403 });
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin!,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400", // 24 horas
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  return null;
}

/**
 * Adicionar headers CORS a resposta
 */
export function addCORSHeaders(
  response: NextResponse,
  origin: string | null
): NextResponse {
  if (isOriginAllowed(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin!);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return response;
}

/**
 * Log de tentativas CORS falhadas
 */
export async function logCORSRejection(request: NextRequest, origin: string | null) {
  console.warn(`[CORS] Origem rejeitada: ${origin || "undefined"} em ${request.nextUrl.pathname}`);
}
