import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Ambiente de teste
    environment: 'jsdom',

    // Globais: describe, it, expect sem import
    globals: true,

    // Setup files
    setupFiles: ['./vitest.setup.ts'],

    // Cobertura de testes
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'vitest.setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
      ],
    },

    // Padrão de arquivos de teste
    include: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],

    // Timeout padrão
    testTimeout: 10000,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
