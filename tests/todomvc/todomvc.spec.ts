/**
 * Extended TodoMVC tests — unique scenarios not covered by
 * positive-flows.spec.ts, negative-flows.spec.ts, or edge-cases.spec.ts.
 *
 * Covers: inline editing, filter navigation, clear-completed,
 * toggle-all state machine, routing edge cases, persistence,
 * responsive layout, keyboard access, and console health.
 */

import { expect, test, type ConsoleMessage } from "@playwright/test";
import { TodoApp } from "./todo-app";

// ─── Inline editing ──────────────────────────────────────────────────────────

test.describe("Inline editing", () => {
  let app: TodoApp;

  test.beforeEach(async ({ page }) => {
    app = new TodoApp(page);
    await app.goto();
  });

  test("TC-006 — Edit committed on Enter preserves id and completed state", { tag: "@high" }, async () => {
    await app.addTodo("Buy milk");
    const before = (await app.readStorage())![0];

    await app.editToValue("Buy milk", "Buy oat milk", "Enter");

    await expect(app.item("Buy oat milk")).toBeVisible();
    await expect(app.item("Buy milk")).toHaveCount(0);

    const after = (await app.readStorage())![0];
    expect(after.id).toBe(before.id);
    expect(after.completed).toBe(before.completed);
    expect(after.title).toBe("Buy oat milk");
  });

  test("TC-007 — Edit committed on blur updates the item", { tag: "@medium" }, async () => {
    await app.addTodo("Walk the dog");
    await app.editToValue("Walk the dog", "Walk the dog (evening)", "blur");

    await expect(app.item("Walk the dog (evening)")).toBeVisible();
    await expect(app.items.first()).not.toHaveClass(/editing/);
  });

  test("TC-020 — Editing a todo to empty string deletes it", { tag: "@high" }, async () => {
    await app.addTodo("Buy milk");
    await app.editToValue("Buy milk", "", "Enter");

    await expect(app.items).toHaveCount(0);
    await expect(app.toggleAll).toBeHidden();
    await expect(app.counter).toBeHidden();
    expect((await app.readStorage()) ?? []).toHaveLength(0);
  });

  test("TC-021 — Edit cancelled by Escape reverts to original value", { tag: "@medium" }, async () => {
    await app.addTodo("Buy milk");
    const before = await app.readStorage();

    await app.editToValue("Buy milk", "Buy almond milk", "Escape");

    await expect(app.item("Buy milk")).toBeVisible();
    await expect(app.item("Buy almond milk")).toHaveCount(0);
    expect(await app.readStorage()).toEqual(before);
  });

  test("TC-036 — Whitespace-only edit deletes the item", { tag: "@medium" }, async () => {
    await app.addTodo("Buy milk");
    await app.editToValue("Buy milk", "   ", "Enter");

    await expect(app.items).toHaveCount(0);
    expect((await app.readStorage()) ?? []).toHaveLength(0);
  });
});

// ─── Filters ─────────────────────────────────────────────────────────────────

test.describe("Filters", () => {
  let app: TodoApp;

  test.beforeEach(async ({ page }) => {
    app = new TodoApp(page);
    await app.goto();
  });

  test("TC-011 — Active filter shows only active todos and updates URL", { tag: "@high" }, async ({ page }) => {
    await app.addMany(["Buy milk", "Walk the dog", "Write tests"]);
    await app.toggle("Buy milk");

    await app.filterActive.click();

    await expect(page).toHaveURL(/#\/active$/);
    await expect(app.items).toHaveCount(2);
    await expect(app.item("Buy milk")).toHaveCount(0);
    await expect(app.filterActive).toHaveClass(/selected/);
    await expect(app.counter).toHaveText("2 items left");
  });

  test("TC-012 — Completed filter shows only completed todos and updates URL", { tag: "@high" }, async ({ page }) => {
    await app.addMany(["Buy milk", "Walk the dog", "Write tests"]);
    await app.toggle("Buy milk");

    await app.filterCompleted.click();

    await expect(page).toHaveURL(/#\/completed$/);
    await expect(app.items).toHaveCount(1);
    await expect(app.item("Buy milk")).toBeVisible();
    await expect(app.filterCompleted).toHaveClass(/selected/);
    await expect(app.clearCompleted).toBeVisible();
  });

  test("TC-013 — All filter restores the full list", { tag: "@medium" }, async ({ page }) => {
    await app.addMany(["Buy milk", "Walk the dog", "Write tests"]);
    await app.toggle("Buy milk");
    await app.filterCompleted.click();
    await app.filterAll.click();

    await expect(page).toHaveURL(/#\/$/);
    await expect(app.items).toHaveCount(3);
    expect(await app.titles()).toEqual(["Buy milk", "Walk the dog", "Write tests"]);
    await expect(app.filterAll).toHaveClass(/selected/);
  });

  test("TC-016 — Direct navigation to #/active filters correctly on first load", { tag: "@medium" }, async () => {
    await app.goto({
      path: "#/active",
      preset: [
        { id: "a", title: "Buy milk", completed: true },
        { id: "b", title: "Walk the dog", completed: false },
      ],
    });

    await expect(app.items).toHaveCount(1);
    await expect(app.item("Walk the dog")).toBeVisible();
    await expect(app.filterActive).toHaveClass(/selected/);
  });

  test("TC-017 — Direct navigation to #/completed filters correctly on first load", { tag: "@medium" }, async () => {
    await app.goto({
      path: "#/completed",
      preset: [
        { id: "a", title: "Buy milk", completed: true },
        { id: "b", title: "Walk the dog", completed: false },
      ],
    });

    await expect(app.items).toHaveCount(1);
    await expect(app.item("Buy milk")).toBeVisible();
    await expect(app.filterCompleted).toHaveClass(/selected/);
    await expect(app.clearCompleted).toBeVisible();
  });

  test("TC-033 — Filter selection persists across browser back and forward", { tag: "@medium" }, async ({ page }) => {
    await app.addMany(["Buy milk", "Walk the dog"]);
    await app.toggle("Buy milk");

    await app.filterCompleted.click();
    await expect(page).toHaveURL(/#\/completed$/);
    await expect(app.items).toHaveCount(1);

    await page.goBack();
    await expect(page).toHaveURL(/#\/$/);
    await expect(app.filterAll).toHaveClass(/selected/);
    await expect(app.items).toHaveCount(2);

    await page.goForward();
    await expect(page).toHaveURL(/#\/completed$/);
    await expect(app.filterCompleted).toHaveClass(/selected/);
    await expect(app.items).toHaveCount(1);
  });
});

// ─── Clear completed ──────────────────────────────────────────────────────────

test.describe("Clear completed", () => {
  let app: TodoApp;

  test.beforeEach(async ({ page }) => {
    app = new TodoApp(page);
    await app.goto();
  });

  test("TC-014 — Clear completed removes only completed todos", { tag: "@high" }, async () => {
    await app.addMany(["Buy milk", "Walk the dog", "Write tests"]);
    await app.toggle("Buy milk");
    await app.toggle("Write tests");

    await app.clearCompleted.click();

    await expect(app.items).toHaveCount(1);
    await expect(app.item("Walk the dog")).toBeVisible();
    await expect(app.counter).toHaveText("1 item left");
    await expect(app.clearCompleted).toBeHidden();

    const stored = await app.readStorage();
    expect(stored).toHaveLength(1);
    expect(stored![0]).toMatchObject({ title: "Walk the dog", completed: false });
  });

  test("TC-022 — Clear completed button is hidden when no completed items exist", { tag: "@medium" }, async () => {
    await app.addMany(["a", "b"]);
    await expect(app.clearCompleted).toBeHidden();
  });
});

// ─── Toggle-all state machine ─────────────────────────────────────────────────

test.describe("Toggle-all state machine", () => {
  let app: TodoApp;

  test.beforeEach(async ({ page }) => {
    app = new TodoApp(page);
    await app.goto();
  });

  test("TC-010 — Toggle-all click a second time restores all items to active", { tag: "@high" }, async () => {
    await app.addMany(["a", "b", "c"]);
    await app.toggleAll.click();
    await app.toggleAll.click();

    for (const t of ["a", "b", "c"]) {
      await expect(app.item(t)).not.toHaveClass(/completed/);
    }
    await expect(app.counter).toHaveText("3 items left");
    await expect(app.clearCompleted).toBeHidden();
  });

  test("TC-032 — Toggle-all reflects mixed completed state correctly", { tag: "@medium" }, async () => {
    await app.addMany(["a", "b", "c"]);
    await app.toggle("a");
    await app.toggle("b");

    await expect(app.toggleAll).not.toBeChecked();

    await app.toggleAll.click();
    await expect(app.counter).toHaveText("0 items left");

    await app.toggleAll.click();
    await expect(app.counter).toHaveText("3 items left");
  });

  test("TC-034 — Toggle-all checked state does not leak after list is emptied and refilled", { tag: "@low" }, async () => {
    await app.addTodo("Buy milk");
    await app.toggleAll.click();
    await app.destroy("Buy milk");

    await expect(app.items).toHaveCount(0);
    await expect(app.toggleAll).toBeHidden();

    await app.addTodo("Walk the dog");
    await expect(app.toggleAll).not.toBeChecked();
    await expect(app.item("Walk the dog")).not.toHaveClass(/completed/);
  });
});

// ─── Routing edge cases ───────────────────────────────────────────────────────

test.describe("Routing edge cases", () => {
  let app: TodoApp;

  test.beforeEach(async ({ page }) => {
    app = new TodoApp(page);
    await app.goto();
  });

  test("TC-024 — Invalid hash route falls through to All without crashing", { tag: "@low" }, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await app.goto({ path: "#/does-not-exist" });
    await app.addTodo("Buy milk");
    await app.addTodo("Walk the dog");
    await app.toggle("Buy milk");

    await expect(app.items).toHaveCount(2);
    await expect(app.item("Buy milk")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("TC-025 — Direct navigation to #/completed on an empty list shows empty state", { tag: "@low" }, async () => {
    await app.goto({ path: "#/completed" });

    await expect(app.items).toHaveCount(0);
    await expect(app.toggleAll).toBeHidden();
    await expect(app.counter).toBeHidden();
    await expect(app.newTodo).toBeVisible();
  });
});

// ─── Persistence and storage ──────────────────────────────────────────────────

test.describe("Persistence and storage", () => {
  let app: TodoApp;

  test.beforeEach(async ({ page }) => {
    app = new TodoApp(page);
    await app.goto();
  });

  test("TC-035 — Corrupted localStorage does not crash the app", { tag: "@low" }, async ({ page }) => {
    test.fail(
      true,
      "Known product gap: invalid JSON in localStorage['react-todos'] is not caught — the React app throws on mount and the input/list never render. Remove this annotation when the app gracefully falls back to an empty list."
    );

    await page.evaluate(() => window.localStorage.setItem("react-todos", "<<not json>>"));
    await page.reload();

    await expect(app.newTodo).toBeVisible({ timeout: 2000 });
    await app.addTodo("Recovery todo");
    await expect(app.item("Recovery todo")).toBeVisible();

    const stored = await app.readStorage();
    expect(Array.isArray(stored)).toBe(true);
    expect(stored![0].title).toBe("Recovery todo");
  });

  test("TC-037 — Two tabs in the same context share localStorage on reload", { tag: "@low" }, async ({ context, page }) => {
    await app.addTodo("Task A");

    const tabB = await context.newPage();
    const appB = new TodoApp(tabB);
    await tabB.goto("https://demo.playwright.dev/todomvc/#/");
    await appB.addTodo("Task B");

    await page.reload();

    const stored = await app.readStorage();
    const titles = stored!.map((t) => t.title).sort();
    expect(titles).toEqual(["Task A", "Task B"].sort());
  });
});

// ─── Scale ────────────────────────────────────────────────────────────────────

test.describe("Scale", () => {
  let app: TodoApp;

  test.beforeEach(async ({ page }) => {
    app = new TodoApp(page);
    await app.goto();
  });

  test("TC-031 — Bulk insertion of 50 items remains responsive", { tag: "@low" }, async () => {
    test.slow();
    const titles = Array.from({ length: 50 }, (_, i) => `task ${i + 1}`);
    for (const t of titles) await app.addTodo(t);

    await expect(app.items).toHaveCount(50);
    await expect(app.counter).toHaveText("50 items left");

    await app.toggle("task 25");
    await expect(app.counter).toHaveText("49 items left");

    await app.destroy("task 50");
    await expect(app.items).toHaveCount(49);
  });
});

// ─── Responsive layout ────────────────────────────────────────────────────────

test.describe("Responsive layout at 375×667", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  let app: TodoApp;

  test.beforeEach(async ({ page }) => {
    app = new TodoApp(page);
    await app.goto();
  });

  test("TC-038 — All controls are visible and usable on a mobile viewport", { tag: "@medium" }, async () => {
    await app.addMany(["a", "b", "c"]);
    await app.toggle("a");

    await expect(app.newTodo).toBeVisible();
    await expect(app.items).toHaveCount(3);
    await expect(app.counter).toBeVisible();
    await expect(app.filterAll).toBeVisible();
    await expect(app.filterActive).toBeVisible();
    await expect(app.filterCompleted).toBeVisible();
    await expect(app.clearCompleted).toBeVisible();

    const overflow = await app.page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollW).toBeLessThanOrEqual(overflow.clientW + 1);
  });
});

// ─── Accessibility ────────────────────────────────────────────────────────────

test.describe("Accessibility", () => {
  let app: TodoApp;

  test.beforeEach(async ({ page }) => {
    app = new TodoApp(page);
    await app.goto();
  });

  test("TC-039 — Keyboard: input is focusable and submits on Enter", { tag: "@medium" }, async ({ page }) => {
    await app.newTodo.focus();
    await expect(app.newTodo).toBeFocused();

    await page.keyboard.type("Keyboard todo");
    await page.keyboard.press("Enter");

    await expect(app.item("Keyboard todo")).toBeVisible();
    await expect(app.newTodo).toBeFocused();
  });
});

// ─── Console health ───────────────────────────────────────────────────────────

test.describe("Console health", () => {
  let app: TodoApp;

  test.beforeEach(async ({ page }) => {
    app = new TodoApp(page);
    await app.goto();
  });

  test("TC-040 — No unexpected console errors during a representative session", { tag: "@medium" }, async ({ page }) => {
    const ignored = [/lockdown-install\.js/, /\bSES\b/];
    const errors: string[] = [];
    page.on("console", (m: ConsoleMessage) => {
      if (m.type() !== "error") return;
      if (ignored.some((re) => re.test(m.text()))) return;
      errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(e.message));

    await app.addMany(["a", "b", "c"]);
    await app.toggle("a");
    await app.editToValue("b", "b-edited", "Enter");
    await app.destroy("c");
    await app.filterActive.click();
    await app.filterCompleted.click();
    await app.filterAll.click();
    await app.clearCompleted.click();

    expect(errors, `Unexpected errors:\n${errors.join("\n")}`).toEqual([]);
  });
});
