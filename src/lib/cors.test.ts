import { describe, it, expect, beforeEach } from 'vitest';
import { isOriginAllowed } from './cors';

describe('CORS Configuration', () => {
  beforeEach(() => {
    // Reset environment
    process.env.NODE_ENV = 'development';
    delete process.env.ALLOWED_ORIGINS;
  });

  describe('isOriginAllowed', () => {
    it('deve permitir localhost em desenvolvimento', () => {
      process.env.NODE_ENV = 'development';
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
      process.env.NODE_ENV = 'development';
      process.env.ALLOWED_ORIGINS = 'https://example.com,https://app.example.com';

      expect(isOriginAllowed('https://example.com')).toBe(true);
      expect(isOriginAllowed('https://app.example.com')).toBe(true);
    });

    it('deve rejeitar origens não permitidas em produção', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOWED_ORIGINS = 'https://app.example.com';

      expect(isOriginAllowed('http://localhost:3000')).toBe(false);
      expect(isOriginAllowed('https://malicious.com')).toBe(false);
    });

    it('deve permitir origem configurada em produção', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOWED_ORIGINS = 'https://app.example.com';

      expect(isOriginAllowed('https://app.example.com')).toBe(true);
    });

    it('deve trimmar espaços em ALLOWED_ORIGINS', () => {
      process.env.ALLOWED_ORIGINS = '  https://example.com  ,  https://app.example.com  ';
      expect(isOriginAllowed('https://example.com')).toBe(true);
      expect(isOriginAllowed('https://app.example.com')).toBe(true);
    });

    it('deve remover duplicatas de origens', () => {
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:3000';
      // Não deve causar erro, apenas remover duplicata
      expect(isOriginAllowed('http://localhost:3000')).toBe(true);
    });
  });
});
