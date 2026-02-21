import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit } from './rate-limit';

// Mock NextRequest (simplificado para testes)
const createMockRequest = (ip: string = '127.0.0.1'): any => {
  return {
    ip,
    headers: {
      get: (key: string) => {
        if (key === 'x-forwarded-for') return ip;
        if (key === 'x-real-ip') return null;
        return null;
      },
    },
    nextUrl: {
      pathname: '/api/test',
    },
  };
};

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Limpar store de rate limit entre testes
    vi.clearAllMocks();
  });

  it('deve permitir primeira requisição', async () => {
    const request = createMockRequest();
    const result = await checkRateLimit(request, '/api/inter/sync');

    expect(result.allowed).toBe(true);
  });

  it('deve rejeitar se limite foi excedido', async () => {
    const request = createMockRequest('192.168.1.1');
    const endpoint = '/api/inter/sync'; // 5 req/hora

    // Fazer 5 requisições (limite)
    for (let i = 0; i < 5; i++) {
      const result = await checkRateLimit(request, endpoint);
      expect(result.allowed).toBe(true);
    }

    // 6ª requisição deve ser rejeitada
    const result = await checkRateLimit(request, endpoint);
    expect(result.allowed).toBe(false);
    expect(result.resetIn).toBeGreaterThan(0);
  });

  it('deve ter diferentes limites para diferentes endpoints', async () => {
    const request = createMockRequest('192.168.1.2');

    // /api/transactions tem limite de 100 req/min
    // Deve permitir múltiplas requisições
    let allAllowed = true;
    for (let i = 0; i < 10; i++) {
      const result = await checkRateLimit(request, '/api/transactions');
      if (!result.allowed) {
        allAllowed = false;
        break;
      }
    }

    expect(allAllowed).toBe(true);
  });

  it('deve diferenciar por IP', async () => {
    const endpoint = '/api/inter/sync';

    // IP 1 faz requisições
    const request1 = createMockRequest('192.168.1.10');
    const result1a = await checkRateLimit(request1, endpoint);
    expect(result1a.allowed).toBe(true);

    // IP 2 faz requisições independentemente
    const request2 = createMockRequest('192.168.1.11');
    const result2a = await checkRateLimit(request2, endpoint);
    expect(result2a.allowed).toBe(true);

    // IPs devem ter contadores independentes
    expect(result1a.allowed && result2a.allowed).toBe(true);
  });

  it('deve retornar resetIn válido', async () => {
    const request = createMockRequest('192.168.1.20');
    const endpoint = '/api/inter/sync';

    // Exceder limite
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(request, endpoint);
    }

    const result = await checkRateLimit(request, endpoint);
    expect(result.allowed).toBe(false);
    expect(result.resetIn).toBeGreaterThan(0);
    expect(result.resetIn).toBeLessThanOrEqual(3600000); // 1 hora em ms
  });
});
