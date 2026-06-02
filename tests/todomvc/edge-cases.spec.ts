/**
 * Edge cases — TC-014..TC-022
 *
 * AC1: Create a TODO list
 * AC2: Add items (4)
 * AC3: Finish item. Expect to be finished
 * AC4: Remove item from the list. Expected to be removed
 */

import { expect, test } from '@playwright/test';
import { TodoApp } from './todo-app';

test.describe('Edge cases', () => {
  let app: TodoApp;

  test.beforeEach(async ({ page }) => {
    app = new TodoApp(page);
    await app.goto();
  });

  test(
    'TC-014 (AC2 edge) — Leading/trailing whitespace in a new item is trimmed',
    { tag: '@medium' },
    async () => {
      await app.addTodo('   Buy milk   ');

      await expect(app.item('Buy milk')).toBeVisible();
      const stored = await app.readStorage();
      expect(stored![0].title).toBe('Buy milk');

      const label = await app.items.first().locator('label').textContent();
      expect(label).toBe('Buy milk');
    },
  );

  test(
    'TC-015 (AC2 edge) — Internal multi-space sequences are preserved verbatim',
    { tag: '@low' },
    async () => {
      const text = 'Buy   organic   milk';
      await app.addTodo(text);

      const stored = await app.readStorage();
      expect(stored![0].title).toBe(text);

      const label = await app.items.first().locator('label').textContent();
      expect(label).toBe(text);
    },
  );

  test(
    'TC-016 (AC2 edge) — Special characters and emoji are accepted as plain text (no XSS)',
    { tag: '@high' },
    async ({ page }) => {
      let alertFired = false;
      page.on('dialog', async (d) => {
        alertFired = true;
        await d.dismiss();
      });
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));

      const samples = [
        '<script>alert(1)</script>',
        'Привет 🌍 — déjà vu',
        '"quotes" & ampersands',
      ];
      for (const t of samples) await app.addTodo(t);

      for (const t of samples) {
        await expect(app.item(t)).toBeVisible();
      }
      expect(alertFired).toBe(false);
      expect(errors).toEqual([]);

      const stored = await app.readStorage();
      expect(stored!.map((s) => s.title)).toEqual(samples);
    },
  );

  test(
    'TC-017 (AC2 edge) — Very long title (1000 chars) is preserved without breaking layout',
    { tag: '@medium' },
    async () => {
      const long = 'x'.repeat(1000);
      await app.addTodo(long);

      const stored = await app.readStorage();
      expect(stored![0].title).toBe(long);

      const li = app.items.first();
      const labelText = await li.locator('label').textContent();
      expect(labelText?.length).toBe(1000);

      const overflow = await li.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(
        Math.ceil(overflow.clientWidth) + 1,
      );

      await li.hover();
      await expect(li.locator('.destroy')).toBeVisible();
    },
  );

  test(
    'TC-018 (AC2 edge) — Duplicate titles are stored as independent items',
    { tag: '@medium' },
    async () => {
      await app.addTodo('Buy milk');
      await app.addTodo('Buy milk');

      await expect(app.items).toHaveCount(2);
      await expect(app.counter).toHaveText('2 items left');

      const stored = await app.readStorage();
      expect(stored).toHaveLength(2);
      expect(stored![0].id).not.toBe(stored![1].id);

      await app.items.first().getByRole('checkbox').click();

      await expect(app.items.first()).toHaveClass(/completed/);
      await expect(app.items.nth(1)).not.toHaveClass(/completed/);
      await expect(app.counter).toHaveText('1 item left');
    },
  );

  test(
    'TC-019 (AC2 boundary) — Adding 4 items in rapid succession produces exactly 4 entries',
    { tag: '@medium' },
    async ({ page }) => {
      const titles = ['task 1', 'task 2', 'task 3', 'task 4'];
      await page.evaluate((items) => {
        const input = document.querySelector('.new-todo') as HTMLInputElement;
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )!.set!;
        for (const t of items) {
          setter.call(input, t);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(
            new KeyboardEvent('keydown', {
              key: 'Enter',
              keyCode: 13,
              bubbles: true,
            }),
          );
        }
      }, titles);

      await expect(app.items).toHaveCount(4);
      expect(await app.titles()).toEqual(titles);
      await expect(app.counter).toHaveText('4 items left');

      const stored = await app.readStorage();
      expect(stored).toHaveLength(4);
      expect(stored!.map((s) => s.title)).toEqual(titles);
      expect(new Set(stored!.map((s) => s.id)).size).toBe(4);
    },
  );

  test(
    'TC-020 (AC4 boundary) — Removing all 4 items one by one returns the app to empty state',
    { tag: '@high' },
    async ({ page }) => {
      const titles = ['Buy milk', 'Walk the dog', 'Write tests', 'Read book'];
      await app.addMany(titles);
      await expect(app.counter).toHaveText('4 items left');

      let expected = 4;
      for (const t of titles) {
        await app.destroy(t);
        expected -= 1;
        if (expected > 0) {
          await expect(app.items).toHaveCount(expected);
          await expect(app.counter).toHaveText(
            `${expected} ${expected === 1 ? 'item' : 'items'} left`,
          );
        }
      }

      await expect(app.items).toHaveCount(0);
      await expect(app.toggleAll).toBeHidden();
      await expect(app.counter).toBeHidden();
      await expect(app.clearCompleted).toBeHidden();
      await expect(
        page.getByRole('heading', { level: 1, name: 'todos' }),
      ).toBeVisible();
      await expect(app.newTodo).toBeVisible();

      const stored = (await app.readStorage()) ?? [];
      expect(stored).toHaveLength(0);
    },
  );

  test(
    'TC-021 (AC3 edge) — Toggle-all marks every item finished; counter shows 0 left',
    { tag: '@medium' },
    async () => {
      const titles = ['Buy milk', 'Walk the dog', 'Write tests', 'Read book'];
      await app.addMany(titles);
      await expect(app.counter).toHaveText('4 items left');

      await app.toggleAll.click();

      for (const t of titles) {
        await expect(app.item(t)).toHaveClass(/completed/);
      }
      await expect(app.counter).toHaveText('0 items left');
      await expect(app.clearCompleted).toBeVisible();

      const stored = await app.readStorage();
      expect(stored!.every((s) => s.completed === true)).toBe(true);
    },
  );

  test(
    'TC-022 (AC3 edge) — A finished item appears under /completed filter and is hidden under /active filter',
    { tag: '@medium' },
    async () => {
      await app.addMany(['Buy milk', 'Walk the dog']);
      await app.toggle('Buy milk');

      await app.goto({ path: '#/active' });
      await expect(app.items).toHaveCount(1);
      await expect(app.item('Walk the dog')).toBeVisible();
      await expect(app.item('Buy milk')).toHaveCount(0);

      await app.goto({ path: '#/completed' });
      await expect(app.items).toHaveCount(1);
      await expect(app.item('Buy milk')).toBeVisible();
      await expect(app.item('Walk the dog')).toHaveCount(0);
    },
  );
});
