import { NextRequest, NextResponse } from "next/server";

// ═══════════════════════════════════════════════════
// RATE LIMITING - Proteção contra DoS
// ═══════════════════════════════════════════════════

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // em milisegundos
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Store em memória (desenvolvimento)
// Em produção, usar Upstash Redis
const memoryStore: RateLimitStore = {};

// Configurações por endpoint
const RATE_LIMITS: { [key: string]: RateLimitConfig } = {
  // Endpoints críticos de Inter - muito restritivo
  "/api/inter/sync": { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 por hora
  "/api/inter/status": { maxRequests: 30, windowMs: 60 * 1000 }, // 30 por minuto
  "/api/inter/dedup": { maxRequests: 10, windowMs: 60 * 1000 }, // 10 por minuto

  // Endpoints normais - moderado
  "/api/transactions": { maxRequests: 100, windowMs: 60 * 1000 }, // 100 por minuto
  "/api/categories": { maxRequests: 50, windowMs: 60 * 1000 },
  "/api/fixed-costs": { maxRequests: 50, windowMs: 60 * 1000 },

  // Dashboard - leve (mais leitura)
  "/api/dashboard": { maxRequests: 200, windowMs: 60 * 1000 },
  "/api/drilldown": { maxRequests: 200, windowMs: 60 * 1000 },
};

/**
 * Verificar se requisição excedeu rate limit
 * Usa IP do cliente como chave (ou User-Agent em teste)
 */
export async function checkRateLimit(
  request: NextRequest,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS["default"];
  if (!config) {
    // Sem rate limit definido
    return { allowed: true, remaining: -1, resetIn: 0 };
  }

  // Obter identificador único
  const identifier = getRequestIdentifier(request);

  // Limpar registros expirados
  const now = Date.now();
  if (memoryStore[identifier]) {
    if (now > memoryStore[identifier].resetTime) {
      delete memoryStore[identifier];
    }
  }

  // Inicializar ou incrementar contador
  if (!memoryStore[identifier]) {
    memoryStore[identifier] = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs };
  }

  const entry = memoryStore[identifier];

  if (entry.count >= config.maxRequests) {
    const resetIn = Math.max(0, entry.resetTime - now);
    return { allowed: false, remaining: 0, resetIn };
  }

  entry.count++;
  const remaining = config.maxRequests - entry.count;
  const resetIn = entry.resetTime - now;

  return { allowed: true, remaining, resetIn };
}

/**
 * Middleware para proteger endpoints com rate limit
 */
export function withRateLimit(endpoint: string) {
  return async (request: NextRequest) => {
    const { allowed, remaining, resetIn } = await checkRateLimit(
      request,
      endpoint
    );

    // Adicionar headers de rate limit
    const headers = new Headers();
    headers.set("X-RateLimit-Remaining", remaining.toString());
    headers.set("X-RateLimit-Reset", new Date(Date.now() + resetIn).toISOString());

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests",
          message: `Rate limit exceeded. Try again in ${Math.ceil(resetIn / 1000)} seconds.`,
        }),
        {
          status: 429,
          headers: {
            ...Object.fromEntries(headers.entries()),
            "Retry-After": Math.ceil(resetIn / 1000).toString(),
          },
        }
      );
    }

    return null; // Continue com a requisição
  };
}

/**
 * Obter identificador único do cliente
 * Prefere IP, fallback para User-Agent (testes)
 */
function getRequestIdentifier(request: NextRequest): string {
  // Tentar obter IP real (considera proxies)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cf = request.headers.get("cf-connecting-ip");

  const ip =
    forwardedFor?.split(",")[0].trim() ||
    realIp ||
    cf ||
    "unknown";

  return `rate-limit:${ip}`;
}

/**
 * Reset rate limit para testes
 */
export function resetRateLimit() {
  Object.keys(memoryStore).forEach((key) => {
    delete memoryStore[key];
  });
}
