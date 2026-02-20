import { test, expect } from './fixtures';

test.describe('Inter Synchronization Flow', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.login('test@example.com', 'password123');
  });

  test('deve sincronizar com Inter com sucesso', async ({ syncPage, mockInterAPI }) => {
    await syncPage.navigate();
    await syncPage.clickSyncButton();

    // Esperar conclusão
    await syncPage.waitForSyncComplete();

    const status = await syncPage.getSyncStatus();
    expect(status).toContain('Sincronização concluída');
  });

  test('deve exibir contagem de transações após sync', async ({ syncPage, mockInterAPI }) => {
    await syncPage.navigate();
    await syncPage.clickSyncButton();

    await syncPage.waitForSyncComplete();

    const count = await syncPage.getTransactionCount();
    expect(count).toBeGreaterThan(0);
  });

  test('deve exibir erro se sync falhar', async ({ syncPage, page }) => {
    // Mock erro na API
    await page.context().addInitScript(() => {
      (window as any).fetch = async (url: string) => {
        if (url.includes('/api/inter/sync')) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Certificado digital não encontrado',
            }),
            { status: 500 }
          );
        }
        return fetch(url);
      };
    });

    await syncPage.navigate();
    await syncPage.clickSyncButton();

    await syncPage.page.waitForTimeout(2000);
    expect(await syncPage.isErrorDisplayed()).toBeTruthy();
  });

  test('deve permitir deduplicar transações', async ({ syncPage, mockInterAPI } ) => {
    await syncPage.navigate();

    // Fazer sync primeiro
    await syncPage.clickSyncButton();
    await syncPage.waitForSyncComplete();

    // Clicar em deduplicar
    await syncPage.page.click('button:has-text("Desduplicar")');

    // Esperar feedback
    await syncPage.page.waitForSelector('text=/\\d+ duplicatas removidas/', { timeout: 5000 });
  });
});
