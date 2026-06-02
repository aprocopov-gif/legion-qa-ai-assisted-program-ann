/**
 * Positive flows — TC-001..TC-008
 *
 * AC1: Create a TODO list
 * AC2: Add items (4)
 * AC3: Finish item. Expect to be finished
 * AC4: Remove item from the list. Expected to be removed
 */

import { expect, test } from '@playwright/test';
import { TodoApp } from './todo-app';

test.describe('Positive flows', () => {
  let app: TodoApp;

  test.beforeEach(async ({ page }) => {
    app = new TodoApp(page);
    await app.goto();
  });

  test(
    'TC-001 (AC1) — Empty TODO list is ready to receive items on first load',
    { tag: '@high' },
    async ({ page }) => {
      await expect(page).toHaveTitle('React • TodoMVC');
      await expect(
        page.getByRole('heading', { level: 1, name: 'todos' }),
      ).toBeVisible();
      await expect(app.newTodo).toHaveAttribute(
        'placeholder',
        'What needs to be done?',
      );
      await expect(app.newTodo).toBeFocused();
      await expect(app.items).toHaveCount(0);
      await expect(app.toggleAll).toBeHidden();
      await expect(app.counter).toBeHidden();
      await expect(page.locator('.footer')).toBeHidden();
    },
  );

  test(
    'TC-002 (AC2) — User adds a single item by pressing Enter',
    { tag: '@high' },
    async () => {
      await app.addTodo('Buy milk');

      await expect(app.items).toHaveCount(1);
      await expect(app.item('Buy milk')).toBeVisible();
      await expect(app.newTodo).toHaveValue('');
      await expect(app.newTodo).toBeFocused();
      await expect(app.counter).toHaveText('1 item left');

      const stored = await app.readStorage();
      expect(stored).toHaveLength(1);
      expect(stored![0]).toMatchObject({ title: 'Buy milk', completed: false });
      expect(stored![0].id).toBeTruthy();
    },
  );

  test(
    'TC-003 (AC2) — User adds exactly 4 items in insertion order',
    { tag: '@high' },
    async () => {
      const titles = ['Buy milk', 'Walk the dog', 'Write tests', 'Read book'];
      await app.addMany(titles);

      await expect(app.items).toHaveCount(4);
      expect(await app.titles()).toEqual(titles);
      await expect(app.counter).toHaveText('4 items left');

      const stored = await app.readStorage();
      expect(stored).toHaveLength(4);
      expect(stored!.map((s) => s.title)).toEqual(titles);
      expect(stored!.every((s) => s.completed === false)).toBe(true);
    },
  );

  test(
    'TC-004 (AC3) — Marking an item as finished updates UI, counter, and storage',
    { tag: '@high' },
    async () => {
      const titles = ['Buy milk', 'Walk the dog', 'Write tests', 'Read book'];
      await app.addMany(titles);
      await expect(app.counter).toHaveText('4 items left');

      await app.toggle('Buy milk');

      await expect(app.item('Buy milk')).toHaveClass(/completed/);
      await expect(app.counter).toHaveText('3 items left');
      await expect(app.clearCompleted).toBeVisible();

      const stored = await app.readStorage();
      const byTitle = (t: string) =>
        stored!.find((s) => s.title === t)!.completed;
      expect(byTitle('Buy milk')).toBe(true);
      expect(byTitle('Walk the dog')).toBe(false);
      expect(byTitle('Write tests')).toBe(false);
      expect(byTitle('Read book')).toBe(false);
    },
  );

  test(
    'TC-005 (AC3) — A finished item stays finished across reload',
    { tag: '@medium' },
    async ({ page }) => {
      const titles = ['Buy milk', 'Walk the dog', 'Write tests', 'Read book'];
      await app.addMany(titles);
      await app.toggle('Buy milk');

      const before = await app.readStorage();

      await page.reload();

      await expect(app.items).toHaveCount(4);
      await expect(app.item('Buy milk')).toHaveClass(/completed/);
      await expect(app.counter).toHaveText('3 items left');

      const after = await app.readStorage();
      expect(after).toEqual(before);
      expect(after!.map((s) => s.id).sort()).toEqual(
        before!.map((s) => s.id).sort(),
      );
    },
  );

  test(
    'TC-006 (AC4) — User removes a single item via the × destroy button',
    { tag: '@high' },
    async () => {
      await app.addMany(['Buy milk', 'Walk the dog']);

      await app.destroy('Walk the dog');

      await expect(app.items).toHaveCount(1);
      await expect(app.item('Walk the dog')).toHaveCount(0);
      await expect(app.item('Buy milk')).toBeVisible();
      await expect(app.counter).toHaveText('1 item left');

      const stored = await app.readStorage();
      expect(stored).toHaveLength(1);
      expect(stored![0].title).toBe('Buy milk');
    },
  );

  test(
    'TC-007 (AC4) — Removing the last item resets the UI to empty state',
    { tag: '@high' },
    async ({ page }) => {
      await app.addTodo('Buy milk');

      await app.destroy('Buy milk');

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
    'TC-008 (AC2 + AC4) — Removing one item from a list of 4 leaves 3 in original order',
    { tag: '@high' },
    async () => {
      await app.addMany([
        'Buy milk',
        'Walk the dog',
        'Write tests',
        'Read book',
      ]);
      const before = await app.readStorage();
      const idsBefore = Object.fromEntries(before!.map((s) => [s.title, s.id]));

      await app.destroy('Walk the dog');

      await expect(app.items).toHaveCount(3);
      expect(await app.titles()).toEqual([
        'Buy milk',
        'Write tests',
        'Read book',
      ]);
      await expect(app.counter).toHaveText('3 items left');

      const after = await app.readStorage();
      expect(after).toHaveLength(3);
      for (const t of ['Buy milk', 'Write tests', 'Read book']) {
        const entry = after!.find((s) => s.title === t)!;
        expect(entry.id).toBe(idsBefore[t]);
        expect(entry.completed).toBe(false);
      }
    },
  );
});
