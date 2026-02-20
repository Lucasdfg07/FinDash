import { Page } from '@playwright/test';

export class CategoriesPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/categories');
  }

  async createCategory(name: string, color: string = '#FF5733', icon: string = 'folder') {
    await this.page.click('button:has-text("Nova Categoria")');
    await this.page.waitForSelector('input[placeholder*="Nome"]');

    await this.page.fill('input[placeholder*="Nome"]', name);
    await this.page.fill('input[type="color"]', color);
    await this.page.fill('input[placeholder*="ícone"]', icon);

    await this.page.click('button:has-text("Salvar")');
    await this.page.waitForSelector(`text=${name}`, { timeout: 5000 });
  }

  async deleteCategory(name: string) {
    await this.page.locator(`[data-testid="category-${name}"]`).locator('button[aria-label="Deletar"]').click();
    await this.page.click('button:has-text("Confirmar")');
  }

  async getCategoryCount() {
    const items = await this.page.locator('[data-testid^="category-"]').count();
    return items;
  }

  async categoryExists(name: string) {
    return await this.page.locator(`text=${name}`).isVisible();
  }
}
