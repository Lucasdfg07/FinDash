import { test, expect } from './fixtures';

test.describe('Authentication Flow', () => {
  test('deve fazer login com sucesso', async ({ loginPage, mockInterAPI }) => {
    await loginPage.navigate();

    // Para testes, use credenciais de teste (você pode criar uma seed no banco)
    // Por enquanto vamos assumir que existe um usuário de teste
    await loginPage.login('test@example.com', 'password123');

    expect(await loginPage.isLoggedIn()).toBeTruthy();
  });

  test('deve rejeitar login com credenciais inválidas', async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.login('test@example.com', 'wrongpassword');

    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('credenciais');
  });

  test('deve manter sessão após login', async ({ loginPage, page }) => {
    await loginPage.navigate();
    await loginPage.login('test@example.com', 'password123');

    // Navegar para outra página
    await page.goto('/categories');

    // Deve permanecer logado
    expect(await page.url()).toContain('/categories');
    expect(await page.locator('text=Sair').isVisible()).toBeTruthy();
  });

  test('deve fazer logout com sucesso', async ({ loginPage, page } ) => {
    await loginPage.navigate();
    await loginPage.login('test@example.com', 'password123');

    // Fazer logout
    await page.click('text=Sair');

    // Deve ser redirecionado para login
    expect(await page.url()).toContain('/login');
  });
});
