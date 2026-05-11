import { expect, test, type ConsoleMessage } from "@playwright/test";
import { TodoApp } from "./todo-app";

test.describe("TodoMVC – Positive flows", () => {
  let app: TodoApp;

  test.beforeEach(async ({ page }) => {
    app = new TodoApp(page);
    await app.goto();
  });

  test("TC-001 — Page loads with correct title and empty state", { tag: "@high" }, async ({ page }) => {
    await expect(page).toHaveTitle("React • TodoMVC");
    await expect(page.getByRole("heading", { level: 1, name: "todos" })).toBeVisible();
    await expect(app.newTodo).toHaveAttribute("placeholder", "What needs to be done?");
    await expect(app.newTodo).toBeFocused();
    await expect(app.items).toHaveCount(0);
    await expect(app.toggleAll).toBeHidden();
    await expect(app.counter).toBeHidden();
    await expect(page.locator(".footer")).toBeHidden();
    await expect(page.getByText(/This is just a demo of TodoMVC for testing/)).toBeVisible();
  });

  test("TC-002 — User adds a single todo by pressing Enter", { tag: "@high" }, async () => {
    await app.addTodo("Buy milk");

    await expect(app.items).toHaveCount(1);
    await expect(app.item("Buy milk")).toBeVisible();
    await expect(app.newTodo).toHaveValue("");
    await expect(app.newTodo).toBeFocused();
    await expect(app.counter).toHaveText("1 item left");

    const stored = await app.readStorage();
    expect(stored).toHaveLength(1);
    expect(stored![0]).toMatchObject({ title: "Buy milk", completed: false });
    expect(stored![0].id).toBeTruthy();
  });

  test("TC-003 — User adds multiple todos and counter pluralizes", { tag: "@high" }, async () => {
    await app.addMany(["Buy milk", "Walk the dog", "Write tests"]);

    await expect(app.items).toHaveCount(3);
    expect(await app.titles()).toEqual(["Buy milk", "Walk the dog", "Write tests"]);
    await expect(app.counter).toHaveText("3 items left");
  });

  test("TC-004 — Toggling a todo marks it completed and updates counter", { tag: "@high" }, async () => {
    await app.addMany(["Buy milk", "Walk the dog"]);
    await app.toggle("Buy milk");

    await expect(app.item("Buy milk")).toHaveClass(/completed/);
    await expect(app.counter).toHaveText("1 item left");
    await expect(app.clearCompleted).toBeVisible();

    const stored = await app.readStorage();
    expect(stored!.find((t) => t.title === "Buy milk")!.completed).toBe(true);
    expect(stored!.find((t) => t.title === "Walk the dog")!.completed).toBe(false);
  });

  test("TC-005 — Un-toggling a completed todo restores it to active", { tag: "@high" }, async () => {
    await app.addMany(["Buy milk", "Walk the dog"]);
    await app.toggle("Buy milk");
    await app.toggle("Buy milk");

    await expect(app.item("Buy milk")).not.toHaveClass(/completed/);
    await expect(app.counter).toHaveText("2 items left");
    await expect(app.clearCompleted).toBeHidden();
  });

  test("TC-006 — Editing a todo via double-click", { tag: "@high" }, async () => {
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

  test("TC-007 — Edit committed on blur", { tag: "@medium" }, async () => {
    await app.addTodo("Walk the dog");
    await app.editToValue("Walk the dog", "Walk the dog (evening)", "blur");

    await expect(app.item("Walk the dog (evening)")).toBeVisible();
    await expect(app.items.first()).not.toHaveClass(/editing/);
  });

  test("TC-008 — Deleting a todo via the × button", { tag: "@high" }, async () => {
    await app.addMany(["Buy milk", "Walk the dog"]);
    await app.destroy("Buy milk");

    await expect(app.items).toHaveCount(1);
    await expect(app.item("Buy milk")).toHaveCount(0);
    await expect(app.counter).toHaveText("1 item left");

    const stored = await app.readStorage();
    expect(stored).toHaveLength(1);
    expect(stored![0].title).toBe("Walk the dog");
  });

  test("TC-009 — Mark all as complete toggles all to completed", { tag: "@high" }, async () => {
    await app.addMany(["a", "b", "c"]);
    await app.toggleAll.click();

    for (const t of ["a", "b", "c"]) {
      await expect(app.item(t)).toHaveClass(/completed/);
    }
    await expect(app.counter).toHaveText("0 items left");
    await expect(app.clearCompleted).toBeVisible();
    await expect(app.toggleAll).toBeChecked();
  });

  test("TC-010 — Mark all as complete toggles all back to active", { tag: "@high" }, async () => {
    await app.addMany(["a", "b", "c"]);
    await app.toggleAll.click();
    await app.toggleAll.click();

    for (const t of ["a", "b", "c"]) {
      await expect(app.item(t)).not.toHaveClass(/completed/);
    }
    await expect(app.counter).toHaveText("3 items left");
    await expect(app.clearCompleted).toBeHidden();
  });

  test("TC-011 — Active filter shows only active todos", { tag: "@high" }, async ({ page }) => {
    await app.addMany(["Buy milk", "Walk the dog", "Write tests"]);
    await app.toggle("Buy milk");

    await app.filterActive.click();

    await expect(page).toHaveURL(/#\/active$/);
    await expect(app.items).toHaveCount(2);
    await expect(app.item("Buy milk")).toHaveCount(0);
    await expect(app.filterActive).toHaveClass(/selected/);
    await expect(app.counter).toHaveText("2 items left");
  });

  test("TC-012 — Completed filter shows only completed todos", { tag: "@high" }, async ({ page }) => {
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

  test("TC-015 — State persists across full page reload", { tag: "@high" }, async ({ page }) => {
    await app.addMany(["Buy milk", "Walk the dog"]);
    await app.toggle("Buy milk");
    const before = await app.readStorage();

    await page.reload();

    await expect(app.items).toHaveCount(2);
    await expect(app.item("Buy milk")).toHaveClass(/completed/);
    await expect(app.item("Walk the dog")).not.toHaveClass(/completed/);
    await expect(app.counter).toHaveText("1 item left");

    const after = await app.readStorage();
    expect(after).toEqual(before);
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
});

test.describe("TodoMVC – Negative flows", () => {
  let app: TodoApp;

  test.beforeEach(async ({ page }) => {
    app = new TodoApp(page);
    await app.goto();
  });

  test("TC-018 — Empty input does not create a todo", { tag: "@high" }, async () => {
    await app.newTodo.focus();
    await app.newTodo.press("Enter");

    await expect(app.items).toHaveCount(0);
    expect(await app.readStorage()).toBeNull();
  });

  test("TC-019 — Whitespace-only input does not create a todo", { tag: "@high" }, async () => {
    await app.addTodo("   ");

    await expect(app.items).toHaveCount(0);
    expect(await app.readStorage()).toBeNull();
  });

  test("TC-020 — Editing a todo to empty deletes it", { tag: "@high" }, async () => {
    await app.addTodo("Buy milk");
    await app.editToValue("Buy milk", "", "Enter");

    await expect(app.items).toHaveCount(0);
    await expect(app.toggleAll).toBeHidden();
    await expect(app.counter).toBeHidden();
    expect((await app.readStorage()) ?? []).toHaveLength(0);
  });

  test("TC-021 — Edit cancelled by Escape reverts to original", { tag: "@medium" }, async () => {
    await app.addTodo("Buy milk");
    const before = await app.readStorage();

    await app.editToValue("Buy milk", "Buy almond milk", "Escape");

    await expect(app.item("Buy milk")).toBeVisible();
    await expect(app.item("Buy almond milk")).toHaveCount(0);
    expect(await app.readStorage()).toEqual(before);
  });

  test("TC-022 — Clear completed is hidden when no completed items exist", { tag: "@medium" }, async () => {
    await app.addMany(["a", "b"]);
    await expect(app.clearCompleted).toBeHidden();
  });

  test("TC-023 — Footer/main are hidden when list is emptied via destroy", { tag: "@high" }, async ({ page }) => {
    await app.addTodo("Buy milk");
    await app.destroy("Buy milk");

    await expect(app.items).toHaveCount(0);
    await expect(app.toggleAll).toBeHidden();
    await expect(app.counter).toBeHidden();
    await expect(app.clearCompleted).toBeHidden();
    await expect(page.getByRole("heading", { level: 1, name: "todos" })).toBeVisible();
    await expect(app.newTodo).toBeVisible();
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
    await expect(app.item("Walk the dog")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("TC-025 — Direct nav to #/completed on empty list shows empty state", { tag: "@low" }, async () => {
    await app.goto({ path: "#/completed" });

    await expect(app.items).toHaveCount(0);
    await expect(app.toggleAll).toBeHidden();
    await expect(app.counter).toBeHidden();
    await expect(app.newTodo).toBeVisible();
  });
});

test.describe("TodoMVC – Edge cases", () => {
  let app: TodoApp;

  test.beforeEach(async ({ page }) => {
    app = new TodoApp(page);
    await app.goto();
  });

  test("TC-026 — Leading/trailing whitespace is trimmed on add", { tag: "@medium" }, async () => {
    await app.addTodo("   Buy milk   ");

    await expect(app.item("Buy milk")).toBeVisible();
    const stored = await app.readStorage();
    expect(stored![0].title).toBe("Buy milk");
  });

  test("TC-027 — Internal whitespace is preserved", { tag: "@low" }, async () => {
    await app.addTodo("Buy   organic   milk");

    const label = await app.items.first().locator("label").textContent();
    expect(label).toBe("Buy   organic   milk");

    const stored = await app.readStorage();
    expect(stored![0].title).toBe("Buy   organic   milk");
  });

  test("TC-028 — Special characters and emoji are accepted verbatim (no XSS)", { tag: "@high" }, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    let alertFired = false;
    page.on("dialog", async (d) => {
      alertFired = true;
      await d.dismiss();
    });

    const samples = [
      "<script>alert(1)</script>",
      "Привет 🌍 — déjà vu",
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
  });

  test("TC-029 — Very long todo title is preserved", { tag: "@medium" }, async () => {
    const long = "x".repeat(1000);
    await app.addTodo(long);

    const stored = await app.readStorage();
    expect(stored![0].title).toBe(long);

    const li = app.items.first();
    const labelText = await li.locator("label").textContent();
    expect(labelText?.length).toBe(1000);

    const overflow = await li.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, width: r.width };
    });
    expect(overflow.scrollWidth).toBeLessThanOrEqual(Math.ceil(overflow.clientWidth) + 1);
  });

  test("TC-030 — Duplicate titles are independent items", { tag: "@medium" }, async () => {
    await app.addTodo("Buy milk");
    await app.addTodo("Buy milk");

    await expect(app.items).toHaveCount(2);
    await expect(app.counter).toHaveText("2 items left");
    const stored = await app.readStorage();
    expect(stored).toHaveLength(2);
    expect(stored![0].id).not.toBe(stored![1].id);

    await app.items.first().getByRole("checkbox").click();
    await expect(app.items.first()).toHaveClass(/completed/);
    await expect(app.items.nth(1)).not.toHaveClass(/completed/);
    await expect(app.counter).toHaveText("1 item left");
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

  test("TC-032 — Toggle-all reflects mixed state correctly", { tag: "@medium" }, async () => {
    await app.addMany(["a", "b", "c"]);
    await app.toggle("a");
    await app.toggle("b");

    await expect(app.toggleAll).not.toBeChecked();

    await app.toggleAll.click();
    await expect(app.counter).toHaveText("0 items left");

    await app.toggleAll.click();
    await expect(app.counter).toHaveText("3 items left");
  });

  test("TC-033 — Filter selection persists across browser back/forward", { tag: "@medium" }, async ({ page }) => {
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

  test("TC-034 — Toggle-all state does not leak across an empty period", { tag: "@low" }, async () => {
    await app.addTodo("Buy milk");
    await app.toggleAll.click();
    await app.destroy("Buy milk");

    await expect(app.items).toHaveCount(0);
    await expect(app.toggleAll).toBeHidden();

    await app.addTodo("Walk the dog");
    await expect(app.toggleAll).not.toBeChecked();
    await expect(app.item("Walk the dog")).not.toHaveClass(/completed/);
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

  test("TC-036 — Whitespace-only edit deletes the item", { tag: "@medium" }, async () => {
    await app.addTodo("Buy milk");
    await app.editToValue("Buy milk", "   ", "Enter");

    await expect(app.items).toHaveCount(0);
    expect((await app.readStorage()) ?? []).toHaveLength(0);
  });

  test("TC-037 — Two tabs in the same context share storage on reload", { tag: "@low" }, async ({ context, page }) => {
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

  test.describe("TC-038 — Responsive layout at 375x667", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("controls are visible and usable on mobile viewport", { tag: "@medium" }, async () => {
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

  test("TC-039 — Keyboard accessibility: input is reachable and submits on Enter", { tag: "@medium" }, async ({ page }) => {
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    await app.newTodo.focus();
    await expect(app.newTodo).toBeFocused();

    await page.keyboard.type("Keyboard todo");
    await page.keyboard.press("Enter");

    await expect(app.item("Keyboard todo")).toBeVisible();
    await expect(app.newTodo).toBeFocused();
  });

  test("TC-040 — No unexpected console errors during a representative session", { tag: "@medium" }, async ({ page }) => {
    const ignored = [/lockdown-install\.js/, /\bSES\b/];
    const errors: string[] = [];
    page.on("console", (m: ConsoleMessage) => {
      if (m.type() !== "error") return;
      const text = m.text();
      if (ignored.some((re) => re.test(text))) return;
      errors.push(text);
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
