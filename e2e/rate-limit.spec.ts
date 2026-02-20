import { test, expect } from './fixtures';

test.describe('Rate Limiting', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.login('test@example.com', 'password123');
  });

  test('deve responder com 429 após exceder rate limit no /api/inter/sync', async ({ syncPage, page }) => {
    await syncPage.navigate();

    // Fazer 6 requisições rapidamente (limite é 5 por hora)
    const responses: any[] = [];

    for (let i = 0; i < 6; i++) {
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/inter/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        return { status: res.status, text: await res.text() };
      });
      responses.push(response);
    }

    // As 5 primeiras devem ser 200 ou 500 (erro de negócio), a 6ª deve ser 429
    const lastResponse = responses[5];
    expect(lastResponse.status).toBe(429);
  });

  test('deve exibir mensagem de rate limit ao usuário', async ({ page }) => {
    // Fazer múltiplas requisições
    for (let i = 0; i < 6; i++) {
      await page.evaluate(async () => {
        await fetch('/api/inter/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      });
    }

    // Após o 6º, deve exibir mensagem
    const errorMessage = await page.locator('text=/rate limit|muitas requisições/i').textContent();
    expect(errorMessage).toBeTruthy();
  });

  test('deve incluir header Retry-After em resposta de rate limit', async ({ page }) => {
    // Fazer múltiplas requisições para exceder limite
    for (let i = 0; i < 6; i++) {
      await page.evaluate(async () => {
        await fetch('/api/inter/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      });
    }

    // Verificar header Retry-After
    const retryAfter = await page.evaluate(async () => {
      const res = await fetch('/api/inter/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.headers.get('Retry-After');
    });

    expect(retryAfter).toBeTruthy();
    expect(parseInt(retryAfter || '0')).toBeGreaterThan(0);
  });
});
