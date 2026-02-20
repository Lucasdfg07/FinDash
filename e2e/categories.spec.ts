import { test, expect } from './fixtures';

test.describe('Categories Management', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.login('test@example.com', 'password123');
  });

  test('deve criar nova categoria', async ({ categoriesPage }) => {
    await categoriesPage.navigate();

    const initialCount = await categoriesPage.getCategoryCount();
    await categoriesPage.createCategory('Teste Categoria', '#FF5733', 'shopping');

    const finalCount = await categoriesPage.getCategoryCount();
    expect(finalCount).toBe(initialCount + 1);
    expect(await categoriesPage.categoryExists('Teste Categoria')).toBeTruthy();
  });

  test('deve validar campos obrigatórios ao criar categoria', async ({ categoriesPage, page }) => {
    await categoriesPage.navigate();
    await page.click('button:has-text("Nova Categoria")');

    // Tentar salvar sem preencher
    await page.click('button:has-text("Salvar")');

    // Deve mostrar erro de validação
    const errorMessage = await page.locator('[role="alert"]').textContent();
    expect(errorMessage).toBeTruthy();
  });

  test('deve editar categoria existente', async ({ categoriesPage, page } ) => {
    await categoriesPage.navigate();

    // Criar uma categoria
    await categoriesPage.createCategory('Original', '#FF5733', 'shopping');

    // Clicar em editar
    await page.click('button[aria-label="Editar"][data-category="Original"]');
    await page.fill('input[placeholder*="Nome"]', 'Editada');
    await page.click('button:has-text("Salvar")');

    expect(await categoriesPage.categoryExists('Editada')).toBeTruthy();
    expect(await categoriesPage.categoryExists('Original')).toBeFalsy();
  });

  test('deve listar todas as categorias', async ({ categoriesPage, page }) => {
    await categoriesPage.navigate();

    // Esperar carregamento da lista
    await page.waitForSelector('[data-testid^="category-"]', { timeout: 5000 });

    const count = await categoriesPage.getCategoryCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
