import type { Locator, Page } from '@playwright/test';

export const APP_URL = 'https://demo.playwright.dev/todomvc/#/';
export const STORAGE_KEY = 'react-todos';

export type StoredTodo = {
  id: string;
  title: string;
  completed: boolean;
};

export class TodoApp {
  readonly page: Page;
  readonly newTodo: Locator;
  readonly toggleAll: Locator;
  readonly items: Locator;
  readonly counter: Locator;
  readonly filterAll: Locator;
  readonly filterActive: Locator;
  readonly filterCompleted: Locator;
  readonly clearCompleted: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newTodo = page.getByPlaceholder('What needs to be done?');
    this.toggleAll = page.locator('#toggle-all');
    this.items = page.locator('.todo-list li');
    this.counter = page.locator('.todo-count');
    this.filterAll = page.getByRole('link', { name: 'All', exact: true });
    this.filterActive = page.getByRole('link', { name: 'Active', exact: true });
    this.filterCompleted = page.getByRole('link', {
      name: 'Completed',
      exact: true,
    });
    this.clearCompleted = page.getByRole('button', { name: 'Clear completed' });
  }

  async goto(opts: { path?: string; preset?: StoredTodo[] } = {}) {
    const { path = '#/', preset } = opts;
    const url = `https://demo.playwright.dev/todomvc/${path}`;
    await this.page.goto(url);
    if (preset) {
      await this.page.evaluate(
        ({ key, preset }) => {
          window.localStorage.setItem(key, JSON.stringify(preset));
        },
        { key: STORAGE_KEY, preset },
      );
      await this.page.reload();
    }
  }

  async addTodo(text: string, { submit = true } = {}) {
    await this.newTodo.fill(text);
    if (submit) await this.newTodo.press('Enter');
  }

  async addMany(texts: string[]) {
    for (const t of texts) await this.addTodo(t);
  }

  item(text: string): Locator {
    return this.items.filter({ hasText: text });
  }

  async toggle(text: string) {
    await this.item(text).getByRole('checkbox').click();
  }

  async destroy(text: string) {
    const li = this.item(text);
    await li.hover();
    await li.locator('.destroy').click();
  }

  async editToValue(
    currentText: string,
    newText: string,
    commit: 'Enter' | 'blur' | 'Escape' = 'Enter',
  ) {
    const li = this.item(currentText);
    await li.locator('label').dblclick();
    const editor = li.locator('input.edit');
    await editor.fill(newText);
    if (commit === 'Enter') await editor.press('Enter');
    else if (commit === 'Escape') await editor.press('Escape');
    else await this.page.locator('body').click({ position: { x: 0, y: 0 } });
  }

  async readStorage(): Promise<StoredTodo[] | null> {
    return this.page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as StoredTodo[]) : null;
    }, STORAGE_KEY);
  }

  async titles(): Promise<string[]> {
    return this.items.locator('label').allTextContents();
  }
}
