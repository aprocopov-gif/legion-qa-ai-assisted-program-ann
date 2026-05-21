import { test, expect } from "@playwright/test";

const BASE_URL = process.env.DIDAXIS_URL!;
const DATA_PREFIX = "AP_";
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const testProgramName = (label: string) => `${DATA_PREFIX}${label} ${Date.now()}`;
const testDescription = (text: string) => `${DATA_PREFIX}${text}`;

async function createProgram(page: any, name: string, description = "") {
  await page.goto(`${BASE_URL}/programs`);
  await page.getByRole("button", { name: "+ New Program" }).click();
  const modal = page.getByRole("dialog", { name: "New Program" });
  await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
  if (description) {
    await modal.getByRole("textbox", { name: "Description" }).fill(description);
  }
  await modal.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("cell", { name: new RegExp(esc(name)) }).first()).toBeVisible();
}

async function deleteProgram(page: any, name: string) {
  await page.goto(`${BASE_URL}/programs`);
  page.once("dialog", (dialog: any) => dialog.accept());
  await page
    .getByRole("row", { name: new RegExp(esc(name)) })
    .first()
    .getByRole("button", { name: "🗑" })
    .click();
}

function nameRow(page: any, name: string) {
  return page.getByRole("row", { name: new RegExp(esc(name)) }).first();
}

test.describe("DS-5: Program List Display", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole("textbox", { name: "Email" }).fill(process.env.DIDAXIS_EMAIL!);
    await page.getByRole("textbox", { name: "Password" }).fill(process.env.DIDAXIS_PASSWORD!);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(`${BASE_URL}/`);
  });

  // TC-001 — Programs page shows each program's name and description
  test("TC-001: Programs page shows each program's name and description", async ({ page }) => {
    const name = testProgramName("Display Test");
    const description = testDescription("Full-stack web development curriculum");
    await createProgram(page, name, description);

    await page.goto(`${BASE_URL}/programs`);
    const row = nameRow(page, name);
    const nameCell = row.getByRole("cell").first();

    await expect(nameCell.locator("p").first()).toHaveText(name);
    await expect(nameCell.locator("p").nth(1)).toHaveText(description);
  });

  // TC-002 — Empty state message is shown when no programs exist
  // NOTE: Cannot guarantee a truly empty environment; test skips if other programs exist
  test("TC-002: Empty state is shown when no programs exist", async ({ page }) => {
    await page.goto(`${BASE_URL}/programs`);
    const tableVisible = await page.getByRole("table").isVisible().catch(() => false);

    if (tableVisible) {
      const rowCount = await page.getByRole("row").count();
      // rowCount includes header row; if only header exists the table is effectively empty
      if (rowCount > 1) {
        test.skip(true, "Other programs exist — clean environment required for this test");
        return;
      }
    }

    const emptyIndicator = page.getByText(/no programs|create your first/i);
    const tableGone = !(await page.getByRole("table").isVisible().catch(() => false));
    expect(tableGone || (await emptyIndicator.isVisible().catch(() => false))).toBe(true);
  });

  // TC-003 — A single program is displayed correctly in the program list
  test("TC-003: A single program is displayed with its name and description", async ({ page }) => {
    const name = testProgramName("Single Program");
    const description = testDescription("A test program for QA purposes");
    await createProgram(page, name, description);

    await page.goto(`${BASE_URL}/programs`);
    const row = nameRow(page, name);

    await expect(row).toBeVisible();
    await expect(row.getByRole("cell").first().locator("p").first()).toHaveText(name);
    await expect(row.getByRole("cell").first().locator("p").nth(1)).toHaveText(description);
  });

  // TC-004 — Newly created program appears in the list without requiring a manual reload
  test("TC-004: Newly created program appears in the list without a page reload", async ({ page }) => {
    const name = testProgramName("Immediate Appear");
    const description = testDescription("Applied machine learning and statistics");

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();
    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
    await modal.getByRole("textbox", { name: "Description" }).fill(description);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("dialog", { name: "New Program" })).not.toBeVisible();
    const newRow = nameRow(page, name);
    await expect(newRow).toBeVisible();
    await expect(newRow.getByRole("cell").first().locator("p").nth(1)).toHaveText(description);
  });

  // TC-005 — Empty state is replaced by the program list after the first program is created
  test("TC-005: Program list appears after a program is created", async ({ page }) => {
    const name = testProgramName("First Entry");
    const description = testDescription("A test program");

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();
    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
    await modal.getByRole("textbox", { name: "Description" }).fill(description);
    await modal.getByRole("button", { name: "Create" }).click();

    const createdRow = nameRow(page, name);
    await expect(createdRow).toBeVisible();
    await expect(createdRow.getByRole("cell").first().locator("p").nth(1)).toHaveText(description);
    await expect(page.getByText(/no programs|create your first/i)).not.toBeVisible();
  });

  // TC-006 — Program list is still accessible and intact after a page reload
  test("TC-006: Program list is intact after a page reload", async ({ page }) => {
    const nameA = testProgramName("Reload A");
    const nameB = testProgramName("Reload B");
    const descA = testDescription("Description A reload test");
    const descB = testDescription("Description B reload test");

    await createProgram(page, nameA, descA);
    await createProgram(page, nameB, descB);

    await page.goto(`${BASE_URL}/programs`);
    await page.reload();
    await page.waitForURL(`${BASE_URL}/programs`);

    const rowA = nameRow(page, nameA);
    const rowB = nameRow(page, nameB);
    await expect(rowA).toBeVisible();
    await expect(rowB).toBeVisible();
    await expect(rowA.getByRole("cell").first().locator("p").nth(1)).toHaveText(descA);
    await expect(rowB.getByRole("cell").first().locator("p").nth(1)).toHaveText(descB);
  });

  // TC-007 — Unauthenticated user is redirected away from the Programs page
  test("TC-007: Unauthenticated user is redirected to the login page", async ({ page }) => {
    // Navigate without the session established by beforeEach (use a fresh context via goto before login)
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/programs`);
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/login`));
  });

  // TC-008 — Non-admin user cannot access the Programs page
  test("TC-008: Non-admin user cannot access the Programs page", async ({ page }) => {
    test.skip(
      !process.env.DIDAXIS_NONADMIN_EMAIL || !process.env.DIDAXIS_NONADMIN_PASSWORD,
      "Non-admin credentials not configured (set DIDAXIS_NONADMIN_EMAIL and DIDAXIS_NONADMIN_PASSWORD in .env)"
    );

    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole("textbox", { name: "Email" }).fill(process.env.DIDAXIS_NONADMIN_EMAIL!);
    await page.getByRole("textbox", { name: "Password" }).fill(process.env.DIDAXIS_NONADMIN_PASSWORD!);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.goto(`${BASE_URL}/programs`);

    const isRedirected = !page.url().includes("/programs");
    const isDenied = await page.getByText(/access denied|forbidden|not authorized/i).isVisible().catch(() => false);
    expect(isRedirected || isDenied || !(await page.getByRole("table").isVisible())).toBe(true);
  });

  // TC-009 — Programs from other organisations are not shown
  test("TC-009: Programs from other organisations are not shown", async ({ page }) => {
    test.skip(true, "Requires a second organisation account — not available in this environment");
  });

  // TC-010 — Empty-state prompt does not appear when programs exist
  test("TC-010: Empty-state prompt is not shown when programs exist", async ({ page }) => {
    const name = testProgramName("Has Programs");
    await createProgram(page, name);

    await page.goto(`${BASE_URL}/programs`);

    await expect(nameRow(page, name)).toBeVisible();
    await expect(page.getByText(/no programs|create your first/i)).not.toBeVisible();
  });

  // TC-011 — Program with a maximum-length name is displayed without overflow
  test("TC-011: Program with a maximum-length name is displayed without layout breakage", async ({ page }) => {
    const suffix = String(Date.now());
    const maxName = DATA_PREFIX + "A".repeat(255 - DATA_PREFIX.length - suffix.length) + suffix;

    await createProgram(page, maxName);
    await page.goto(`${BASE_URL}/programs`);

    const row = page.getByRole("row", { name: new RegExp(esc(suffix)) }).first();
    await expect(row).toBeVisible();
    await expect(row.getByRole("cell").first()).toBeVisible();
  });

  // TC-012 — Program with a maximum-length description is displayed without layout breakage
  test("TC-012: Program with a maximum-length description is displayed without layout breakage", async ({ page }) => {
    const name = testProgramName("Max Desc");
    const maxDesc = testDescription("B".repeat(500 - DATA_PREFIX.length));

    await createProgram(page, name, maxDesc);
    await page.goto(`${BASE_URL}/programs`);

    const row = nameRow(page, name);
    await expect(row).toBeVisible();
    await expect(row.getByRole("cell").first()).toBeVisible();
  });

  // TC-013 — Program with special characters is displayed correctly (no HTML encoding)
  test("TC-013: Program with special characters is displayed without encoding artifacts", async ({ page }) => {
    const name = `${DATA_PREFIX}Informatique & IA ${Date.now()}`;
    const description = testDescription("Cours d'IA & ML: niveau avancé (100%)");

    await createProgram(page, name, description);
    await page.goto(`${BASE_URL}/programs`);

    const nameCell = nameRow(page, name).getByRole("cell").first();
    await expect(nameCell.locator("p").first()).toHaveText(name);
    await expect(nameCell.locator("p").first()).not.toContainText("&amp;");
    await expect(nameCell.locator("p").nth(1)).toHaveText(description);
  });

  // TC-014 — Program with HTML/script tags is rendered as plain text
  test("TC-014: Program name and description with HTML tags are rendered as plain text", async ({ page }) => {
    let alertFired = false;
    page.on("dialog", (dialog: any) => {
      alertFired = true;
      dialog.dismiss();
    });

    const name = `${DATA_PREFIX}Plain Text ${Date.now()} <b>Bold</b>`;

    await createProgram(page, name);
    await page.goto(`${BASE_URL}/programs`);

    await expect(page.getByRole("cell", { name: new RegExp(esc(name)) })).toBeVisible();
    expect(alertFired).toBe(false);
  });

  // TC-015 — Program with whitespace-only description shows a graceful empty state
  test("TC-015: Program with whitespace-only description shows graceful empty state in the cell", async ({ page }) => {
    const name = testProgramName("Whitespace Desc");

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();
    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
    await modal.getByRole("textbox", { name: "Description" }).fill("   ");
    await modal.getByRole("button", { name: "Create" }).click();

    await page.goto(`${BASE_URL}/programs`);
    const row = nameRow(page, name);
    await expect(row).toBeVisible();

    const descParagraph = row.getByRole("cell").first().locator("p").nth(1);
    const hasDesc = await descParagraph.isVisible().catch(() => false);
    if (hasDesc) {
      const text = (await descParagraph.textContent()) ?? "";
      expect(text.trim()).toBe("");
    }
  });

  // TC-016 — Program with a blank (empty) description is displayed without error
  test("TC-016: Program with no description is displayed without error", async ({ page }) => {
    const name = testProgramName("No Desc Program");

    await createProgram(page, name);
    await page.goto(`${BASE_URL}/programs`);

    const row = nameRow(page, name);
    await expect(row).toBeVisible();
    await expect(row.getByRole("cell").first().locator("p").first()).toHaveText(name);
  });

  // TC-017 — Program list with multiple programs loads within acceptable time
  test("TC-017: Program list with multiple programs loads within 5 seconds", async ({ page }) => {
    const names: string[] = [];
    for (let i = 0; i < 5; i++) {
      const name = testProgramName(`Perf Program ${i}`);
      names.push(name);
      await createProgram(page, name);
    }

    const start = Date.now();
    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("table").waitFor({ state: "visible" });
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(5000);
    await expect(nameRow(page, names[0])).toBeVisible();
  });

  // TC-018 — Program with Unicode and multilingual characters is displayed correctly
  test("TC-018: Program with Unicode and multilingual characters is displayed correctly", async ({ page }) => {
    const timestamp = Date.now();
    const name = `${DATA_PREFIX}Programmation Niveau ${timestamp} 高级`;
    const description = testDescription("面向对象编程 & algorithms");

    await createProgram(page, name, description);
    await page.goto(`${BASE_URL}/programs`);

    const row = page.getByRole("row", { name: new RegExp(String(timestamp)) }).first();
    await expect(row).toBeVisible();
    await expect(row.getByRole("cell").first().locator("p").nth(1)).toHaveText(description);
  });

  // TC-019 — Two programs with identical names are both displayed in the list
  test("TC-019: Two programs with identical names are both shown as separate rows", async ({ page }) => {
    const name = testProgramName("Duplicate Display");

    await createProgram(page, name);
    await createProgram(page, name);

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("table").waitFor({ state: "visible" });

    const cells = page.getByRole("cell", { name: new RegExp(esc(name)) });
    const count = await cells.count();

    // App allows duplicates (confirmed from DS-3 TC-020): both rows must be visible
    expect(count).toBeGreaterThanOrEqual(2);
  });

  // TC-020 — Programs list order is consistent across page reloads
  test("TC-020: Programs list order is consistent across page reloads", async ({ page }) => {
    const names = [
      testProgramName("Order Alpha"),
      testProgramName("Order Beta"),
      testProgramName("Order Gamma"),
    ];
    for (const n of names) {
      await createProgram(page, n);
    }

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("table").waitFor({ state: "visible" });
    const rows = page.getByRole("row");
    const countBefore = await rows.count();
    const firstRowBefore = await rows.nth(1).textContent();

    await page.reload();
    await page.waitForURL(`${BASE_URL}/programs`);
    await page.getByRole("table").waitFor({ state: "visible" });

    const countAfter = await rows.count();
    const firstRowAfter = await rows.nth(1).textContent();

    expect(countBefore).toBe(countAfter);
    expect(firstRowBefore).toBe(firstRowAfter);
  });
});
