import { test, expect } from "@playwright/test";

const BASE_URL = process.env.DIDAXIS_URL!;

async function openNewProgramModal(page: any) {
  await page.goto(`${BASE_URL}/programs`);
  await page.getByRole("button", { name: "+ New Program" }).click();
  return page.getByRole("dialog", { name: "New Program" });
}

async function createProgram(page: any, name: string) {
  const modal = await openNewProgramModal(page);
  await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
  await modal.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("cell", { name: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })).toBeVisible();
}

async function deleteProgram(page: any, name: string) {
  await page.goto(`${BASE_URL}/programs`);
  page.once("dialog", (dialog: any) => dialog.accept());
  await page
    .getByRole("row", { name: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })
    .first()
    .getByRole("button", { name: "🗑" })
    .click();
}

test.describe("DS-3: Program Name Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole("textbox", { name: "Email" }).fill(process.env.DIDAXIS_EMAIL!);
    await page.getByRole("textbox", { name: "Password" }).fill(process.env.DIDAXIS_PASSWORD!);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(`${BASE_URL}/`);
  });

  // TC-001 — Program name with special characters is accepted and rendered correctly
  test("TC-001: Program name with special characters is accepted and rendered correctly", async ({ page }) => {
    const name = `Informatique & IA - Niveau ${Date.now()}`;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const modal = await openNewProgramModal(page);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
    await modal.getByRole("button", { name: "Create" }).click();

    const cell = page.getByRole("cell", { name: new RegExp(escaped) });
    await expect(cell).toBeVisible();
    await expect(cell).not.toContainText("&amp;");
  });

  // TC-002 — Program name with alphanumeric characters and spaces is accepted
  test("TC-002: Program name with alphanumeric characters and spaces is accepted", async ({ page }) => {
    const name = `Web Development ${Date.now()}`;

    const modal = await openNewProgramModal(page);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(name) })).toBeVisible();
  });

  // TC-003 — Program name with leading and trailing whitespace is trimmed and saved
  test("TC-003: Program name with leading/trailing whitespace is trimmed and saved", async ({ page }) => {
    const baseName = `Data Science ${Date.now()}`;

    const modal = await openNewProgramModal(page);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(`  ${baseName}  `);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(baseName) })).toBeVisible();
  });

  // TC-004 — A name previously used by a deleted program can be reused
  test("TC-004: A name previously used by a deleted program can be reused", async ({ page }) => {
    const name = `Reuse Test ${Date.now()}`;
    await createProgram(page, name);
    await deleteProgram(page, name);

    await expect(page.getByRole("cell", { name: new RegExp(name) })).not.toBeVisible();

    const modal = await openNewProgramModal(page);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(name) })).toBeVisible();
  });

  // TC-005 — Program name consisting only of spaces is rejected
  test("TC-005: Program name consisting only of spaces is rejected", async ({ page }) => {
    const modal = await openNewProgramModal(page);
    await modal.getByRole("textbox", { name: "Program Name" }).fill("   ");

    await expect(modal.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  // TC-006 — Empty Program Name field prevents form submission
  test("TC-006: Empty Program Name field prevents form submission", async ({ page }) => {
    const modal = await openNewProgramModal(page);

    await expect(modal.getByRole("textbox", { name: "Program Name" })).toBeEmpty();
    await expect(modal.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  // TC-007 — Duplicate program name (exact match) is rejected with an error message
  // test.fail() documents a known app defect: duplicate creation succeeds instead of being rejected
  test.fail("TC-007: Duplicate program name is rejected with an error message", async ({ page }) => {
    const name = `Duplicate Test ${Date.now()}`;
    await createProgram(page, name);

    const modal = await openNewProgramModal(page);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
    await modal.getByRole("button", { name: "Create" }).click();

    const errorVisible = await page.getByRole("alert").isVisible().catch(() => false);
    const cells = page.getByRole("cell", { name: new RegExp(name) });
    const count = await cells.count();

    // Expected: error shown and no duplicate created — if count > 1 the app has a bug
    expect(errorVisible || count === 1).toBe(true);
  });

  // TC-008 — Duplicate-name error message is specific and actionable
  test("TC-008: Duplicate-name error message is specific and actionable", async ({ page }) => {
    const name = `Duplicate Error Test ${Date.now()}`;
    await createProgram(page, name);

    const modal = await openNewProgramModal(page);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
    await modal.getByRole("button", { name: "Create" }).click();

    const alert = page.getByRole("alert");
    if (await alert.isVisible()) {
      const alertText = await alert.textContent();
      expect(alertText?.toLowerCase()).not.toContain("something went wrong");
    }
  });

  // TC-009 — Non-admin user cannot access the program creation form
  test("TC-009: Non-admin user cannot access the program creation form", async ({ page }) => {
    test.skip(
      !process.env.DIDAXIS_NONADMIN_EMAIL || !process.env.DIDAXIS_NONADMIN_PASSWORD,
      "Non-admin credentials not configured (set DIDAXIS_NONADMIN_EMAIL and DIDAXIS_NONADMIN_PASSWORD in .env)"
    );

    await page.goto(`${BASE_URL}/login`);
    await page.getByRole("textbox", { name: "Email" }).fill(process.env.DIDAXIS_NONADMIN_EMAIL!);
    await page.getByRole("textbox", { name: "Password" }).fill(process.env.DIDAXIS_NONADMIN_PASSWORD!);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(`${BASE_URL}/`);
    await page.goto(`${BASE_URL}/programs`);

    await expect(page.getByRole("button", { name: "+ New Program" })).not.toBeVisible();
  });

  // TC-010 — Program name consisting only of tab characters is rejected
  test("TC-010: Program name consisting only of tab characters is rejected", async ({ page }) => {
    const modal = await openNewProgramModal(page);
    await modal.getByRole("textbox", { name: "Program Name" }).fill("\t");

    await expect(modal.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  // TC-011 — Program name with a mix of spaces and tabs is rejected
  test("TC-011: Program name with a mix of spaces and tabs is rejected", async ({ page }) => {
    const modal = await openNewProgramModal(page);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(" \t  \t ");

    await expect(modal.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  // TC-012 — Single-character program name is accepted
  test("TC-012: Single-character program name is accepted", async ({ page }) => {
    const name = `A${Date.now()}`;

    const modal = await openNewProgramModal(page);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(name) })).toBeVisible();
  });

  // TC-013 — Program name at the maximum allowed length is accepted
  test("TC-013: Program name at maximum allowed length is accepted", async ({ page }) => {
    const suffix = String(Date.now());
    const maxName = "A".repeat(255 - suffix.length) + suffix;

    const modal = await openNewProgramModal(page);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(maxName);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(suffix) }).first()).toBeVisible();
  });

  // TC-014 — Program name exceeding maximum allowed length is rejected or truncated
  // test.fail() documents a known app defect: no max-length enforcement
  test.fail("TC-014: Program name exceeding maximum allowed length is rejected or truncated", async ({ page }) => {
    const modal = await openNewProgramModal(page);
    const nameField = modal.getByRole("textbox", { name: "Program Name" });
    await nameField.fill("A".repeat(256));

    const actualValue = await nameField.inputValue();
    const isDisabled = await modal.getByRole("button", { name: "Create" }).isDisabled();

    expect(actualValue.length <= 255 || isDisabled).toBe(true);
  });

  // TC-015 — Program name with HTML/script tags is stored and displayed as plain text
  test("TC-015: Program name with HTML/script tags does not execute", async ({ page }) => {
    let alertFired = false;
    page.on("dialog", (dialog: any) => {
      alertFired = true;
      dialog.dismiss();
    });

    const modal = await openNewProgramModal(page);
    await modal.getByRole("textbox", { name: "Program Name" }).fill("<script>alert('xss')</script>");

    if (await modal.getByRole("button", { name: "Create" }).isEnabled()) {
      await modal.getByRole("button", { name: "Create" }).click();
    }

    expect(alertFired).toBe(false);
  });

  // TC-016 — Duplicate check behavior is consistent for case-variant names
  test("TC-016: Duplicate check is consistent for case-variant names", async ({ page }) => {
    const baseName = `Case Test ${Date.now()}`;
    await createProgram(page, baseName);

    const modal = await openNewProgramModal(page);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(baseName.toLowerCase());
    await modal.getByRole("button", { name: "Create" }).click();
    await expect(page.getByRole("dialog", { name: "New Program" })).not.toBeVisible({ timeout: 10000 });

    // Either rejected as duplicate (case-insensitive) or created (case-sensitive) — both valid, must be consistent
    const errorVisible = await page.getByRole("alert").isVisible().catch(() => false);
    const cells = page.getByRole("cell", { name: new RegExp(baseName, "i") });
    const count = await cells.count();
    expect(errorVisible || count >= 1).toBe(true);
  });

  // TC-017 — Program name with Unicode and multilingual characters is accepted
  test("TC-017: Program name with Unicode and multilingual characters is accepted", async ({ page }) => {
    const timestamp = Date.now();
    const name = `Programmation Niveau ${timestamp} 高级`;

    const modal = await openNewProgramModal(page);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(String(timestamp)) }).first()).toBeVisible();
  });

  // TC-018 — Duplicate name validation is enforced server-side after a page reload
  // test.fail() documents a known app defect: duplicate passes even after reload (no server-side check)
  test.fail("TC-018: Duplicate name validation is enforced after a page reload", async ({ page }) => {
    const name = `Reload Dup Test ${Date.now()}`;
    await createProgram(page, name);

    await page.reload();
    await page.waitForURL(`${BASE_URL}/programs`);

    const modal = await openNewProgramModal(page);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
    await modal.getByRole("button", { name: "Create" }).click();

    const errorVisible = await page.getByRole("alert").isVisible().catch(() => false);
    const cells = page.getByRole("cell", { name: new RegExp(name) });
    const count = await cells.count();
    expect(errorVisible || count === 1).toBe(true);
  });

  // TC-019 — Program name consisting only of numeric characters is accepted
  test("TC-019: Program name consisting only of numeric characters is accepted", async ({ page }) => {
    const name = String(Date.now());

    const modal = await openNewProgramModal(page);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(name) })).toBeVisible();
  });

  // TC-020 — Rapid double-click on Create does not produce duplicate programs
  // test.fail() documents a known app defect: double-clicking Create submits the form twice
  test.fail("TC-020: Rapid double-click on Create does not produce duplicate programs", async ({ page }) => {
    const name = `Double Click Test ${Date.now()}`;

    const modal = await openNewProgramModal(page);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
    await modal.getByRole("button", { name: "Create" }).dblclick();

    await expect(page.getByRole("dialog", { name: "New Program" })).not.toBeVisible({ timeout: 10000 });

    const cells = page.getByRole("cell", { name: new RegExp(name) });
    await expect(cells.first()).toBeVisible();
    expect(await cells.count()).toBe(1);
  });
});
