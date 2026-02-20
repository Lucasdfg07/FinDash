import { Page } from '@playwright/test';

export class SyncPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/sync');
  }

  async clickSyncButton() {
    await this.page.click('button:has-text("Sincronizar")');
  }

  async waitForSyncComplete() {
    await this.page.waitForSelector('[role="status"]:has-text("Sincronização concluída")', {
      timeout: 30000,
    });
  }

  async getSyncStatus() {
    return await this.page.locator('[role="status"]').textContent();
  }

  async getTransactionCount() {
    const text = await this.page.locator('text=/\\d+ transações/').textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async isErrorDisplayed() {
    return await this.page.locator('[role="alert"]').isVisible();
  }

  async getErrorText() {
    return await this.page.locator('[role="alert"]').textContent();
  }
}
