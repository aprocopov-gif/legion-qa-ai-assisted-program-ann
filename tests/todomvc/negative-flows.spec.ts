/**
 * Negative flows — TC-009..TC-013
 *
 * AC1: Create a TODO list
 * AC2: Add items (4)
 * AC3: Finish item. Expect to be finished
 * AC4: Remove item from the list. Expected to be removed
 */

import { expect, test } from '@playwright/test';
import { TodoApp } from './todo-app';

test.describe('Negative flows', () => {
  let app: TodoApp;

  test.beforeEach(async ({ page }) => {
    app = new TodoApp(page);
    await app.goto();
  });

  test(
    'TC-009 (AC2 negative) — Empty input + Enter does NOT create a todo',
    { tag: '@high' },
    async () => {
      await app.newTodo.focus();
      await app.newTodo.press('Enter');

      await expect(app.items).toHaveCount(0);
      await expect(app.toggleAll).toBeHidden();
      await expect(app.counter).toBeHidden();
      expect(await app.readStorage()).toBeNull();
    },
  );

  test(
    'TC-010 (AC2 negative) — Whitespace-only input does NOT create a todo',
    { tag: '@high' },
    async () => {
      await app.addTodo('   ');

      await expect(app.items).toHaveCount(0);
      await expect(app.toggleAll).toBeHidden();
      await expect(app.counter).toBeHidden();
      expect(await app.readStorage()).toBeNull();
    },
  );

  test(
    'TC-011 (AC3 negative) — Toggling a finished item back unfinishes it',
    { tag: '@medium' },
    async () => {
      await app.addMany(['Buy milk', 'Walk the dog']);
      await app.toggle('Buy milk');
      await expect(app.counter).toHaveText('1 item left');

      await app.toggle('Buy milk');

      await expect(app.item('Buy milk')).not.toHaveClass(/completed/);
      await expect(app.counter).toHaveText('2 items left');
      await expect(app.clearCompleted).toBeHidden();

      const stored = await app.readStorage();
      expect(stored!.every((s) => s.completed === false)).toBe(true);
    },
  );

  test(
    'TC-012 (AC4 negative) — Removing one item must NOT remove other items',
    { tag: '@high' },
    async () => {
      const titles = ['Buy milk', 'Walk the dog', 'Write tests', 'Read book'];
      await app.addMany(titles);
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
      expect(after!.find((s) => s.title === 'Walk the dog')).toBeUndefined();
    },
  );

  test(
    'TC-013 (AC3 + AC4 negative) — Finished+removed item does not leak completed state to remaining items',
    { tag: '@medium' },
    async () => {
      await app.addMany(['Buy milk', 'Walk the dog', 'Write tests']);
      await app.toggle('Buy milk');
      await expect(app.counter).toHaveText('2 items left');
      await expect(app.clearCompleted).toBeVisible();

      await app.destroy('Buy milk');

      await expect(app.items).toHaveCount(2);
      await expect(app.item('Walk the dog')).not.toHaveClass(/completed/);
      await expect(app.item('Write tests')).not.toHaveClass(/completed/);
      await expect(app.counter).toHaveText('2 items left');
      await expect(app.clearCompleted).toBeHidden();

      const stored = await app.readStorage();
      expect(stored!.every((s) => s.completed === false)).toBe(true);
    },
  );
});
