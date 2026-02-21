import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isOriginAllowed } from './cors';

describe('CORS Configuration', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    delete process.env.ALLOWED_ORIGINS;
  });

  describe('isOriginAllowed', () => {
    it('deve permitir localhost em desenvolvimento', () => {
      vi.stubEnv('NODE_ENV', 'development');
      expect(isOriginAllowed('http://localhost:3000')).toBe(true);
      expect(isOriginAllowed('http://localhost:3001')).toBe(true);
    });

    it('deve rejeitar origem null', () => {
      expect(isOriginAllowed(null)).toBe(false);
    });

    it('deve rejeitar origem undefined', () => {
      expect(isOriginAllowed(undefined as any)).toBe(false);
    });

    it('deve permitir origens customizadas via ALLOWED_ORIGINS', () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('ALLOWED_ORIGINS', 'https://example.com, https://app.example.com');

      expect(isOriginAllowed('https://example.com')).toBe(true);
      expect(isOriginAllowed('https://app.example.com')).toBe(true);
    });

    it('deve rejeitar origens não permitidas em produção', () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('ALLOWED_ORIGINS', 'https://app.example.com');

      expect(isOriginAllowed('http://localhost:3000')).toBe(false);
      expect(isOriginAllowed('https://malicious.com')).toBe(false);
    });

    it('deve permitir origem configurada em produção', () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('ALLOWED_ORIGINS', 'https://app.example.com');

      expect(isOriginAllowed('https://app.example.com')).toBe(true);
    });

    it('deve trimmar espaços em ALLOWED_ORIGINS', () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('ALLOWED_ORIGINS', '  https://example.com  ,  https://test.com  ');

      expect(isOriginAllowed('https://example.com')).toBe(true);
      expect(isOriginAllowed('https://test.com')).toBe(true);
    });

    it('deve remover duplicatas de origens', () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('ALLOWED_ORIGINS', 'https://example.com,https://example.com,https://test.com');

      expect(isOriginAllowed('https://example.com')).toBe(true);
      expect(isOriginAllowed('https://test.com')).toBe(true);
    });
  });
});
