import type { Page } from '@playwright/test';

export class BasePage {
  protected readonly page: Page;
  protected readonly baseUrl: string;

  constructor(page: Page) {
    this.page = page;
    this.baseUrl = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
  }
}
