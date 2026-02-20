import { test as base, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { SyncPage } from './pages/SyncPage';
import { CategoriesPage } from './pages/CategoriesPage';

export const test = base.extend({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  syncPage: async ({ page }, use) => {
    const syncPage = new SyncPage(page);
    await use(syncPage);
  },

  categoriesPage: async ({ page }, use) => {
    const categoriesPage = new CategoriesPage(page);
    await use(categoriesPage);
  },

  // Setup mock para Inter API
  mockInterAPI: async ({ context }, use) => {
    await context.addInitScript(() => {
      // Mock fetch para chamadas ao Inter
      const originalFetch = window.fetch;
      (window as any).fetch = async (url: string, options?: RequestInit) => {
        if (url.includes('/api/inter/sync')) {
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Sincronização concluída com sucesso',
              extrato: 5,
              faturas: 3,
              saldo: 1500.50,
            }),
            { status: 200 }
          );
        }

        if (url.includes('/api/inter/status')) {
          return new Response(
            JSON.stringify({
              connected: true,
              configured: true,
              lastSync: new Date().toISOString(),
              saldo: 1500.50,
              stats: {
                transacoesImportadas: 25,
                faturasImportadas: 8,
              },
            }),
            { status: 200 }
          );
        }

        if (url.includes('/api/inter/dedup')) {
          return new Response(
            JSON.stringify({
              success: true,
              totalAnalyzed: 25,
              duplicatesRemoved: 3,
              details: [],
            }),
            { status: 200 }
          );
        }

        return originalFetch(url, options);
      };
    });

    await use({});
  },
});

export { expect };
