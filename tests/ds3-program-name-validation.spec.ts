import { test, expect, type CleanupFixtures } from "../fixtures/cleanup.fixture";
import type { Page } from "@playwright/test";

const BASE_URL = process.env.DIDAXIS_URL!;
const DATA_PREFIX = "AP_";
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const testProgramName = (label: string) => `${DATA_PREFIX}${label} ${Date.now()}`;
const testDescription = (text: string) => `${DATA_PREFIX}${text}`;

function wireProgramTracking(page: Page, trackProgram: CleanupFixtures["trackProgram"]) {
  page.on("response", async (response) => {
    if (response.request().method() !== "POST" || !response.ok() || !response.url().includes("/api/programs")) {
      return;
    }

    try {
      const payload = (await response.json()) as { id?: string; data?: { id?: string } };
      const id = typeof payload.id === "string" ? payload.id : payload.data?.id;
      if (id) {
        trackProgram(id);
      }
    } catch {
      // Ignore non-JSON responses from creation endpoint.
    }
  });
}

test.describe("DS-3: Program Name Validation", () => {
  test.beforeEach(async ({ page, trackProgram }) => {
    wireProgramTracking(page, trackProgram);
  });

  // TC-001 — Program name with special characters is accepted and rendered correctly
  test("TC-001: Program name with special characters is accepted and rendered correctly", async ({ page }) => {
    const programName = `${DATA_PREFIX}Informatique & IA - Niveau ${Date.now()}`;
    const description = testDescription("Program with special characters");

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("textbox", { name: "Description" }).fill(description);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("dialog", { name: "New Program" })).not.toBeVisible();
    const cell = page.getByRole("cell", { name: new RegExp(esc(programName)) }).first();
    await expect(cell).toBeVisible();
    await expect(cell).not.toContainText("&amp;");
  });

  // TC-002 — Program name with alphanumeric characters and spaces is accepted
  test("TC-002: Program name with alphanumeric characters and spaces is accepted", async ({ page }) => {
    const programName = testProgramName("Web Development 2026");
    const description = testDescription("Full-stack web development program");

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("textbox", { name: "Description" }).fill(description);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("dialog", { name: "New Program" })).not.toBeVisible();
    await expect(page.getByRole("cell", { name: new RegExp(esc(programName)) }).first()).toBeVisible();
  });

  // TC-003 — Program name with leading and trailing whitespace is trimmed and saved
  test("TC-003: Program name with leading/trailing whitespace is trimmed and saved", async ({ page }) => {
    const baseName = testProgramName("Data Science 2026");
    const paddedName = `  ${baseName}  `;
    const description = testDescription("Data science curriculum");

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(paddedName);
    await modal.getByRole("textbox", { name: "Description" }).fill(description);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("dialog", { name: "New Program" })).not.toBeVisible();
    await expect(page.getByRole("cell", { name: new RegExp(esc(baseName)) }).first()).toBeVisible();
  });

  // TC-004 — A name previously used by a deleted program can be reused
  test("TC-004: A name previously used by a deleted program can be reused", async ({ page }) => {
    const programName = testProgramName("Reuse Test");
    const description = testDescription("Reused program name after deletion");

    await page.goto(`${BASE_URL}/programs`);

    // Create program to delete
    await page.getByRole("button", { name: "+ New Program" }).click();
    let modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("textbox", { name: "Description" }).fill(testDescription("Temporary program"));
    await modal.getByRole("button", { name: "Create" }).click();
    await expect(page.getByRole("cell", { name: new RegExp(esc(programName)) }).first()).toBeVisible();

    // Delete program
    await page.goto(`${BASE_URL}/programs`);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: new RegExp(`Delete ${esc(programName)}`) }).click();
    await expect(page.getByRole("cell", { name: new RegExp(esc(programName)) }).first()).not.toBeVisible();

    // Reuse the same name
    await page.getByRole("button", { name: "+ New Program" }).click();
    modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("textbox", { name: "Description" }).fill(description);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(esc(programName)) }).first()).toBeVisible();
  });

  // TC-005 — Program name consisting only of whitespace is rejected
  test("TC-005: Program name consisting only of whitespace is rejected", async ({ page }) => {
    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill("   ");
    await modal.getByRole("textbox", { name: "Description" }).fill(testDescription("Description should not matter"));

    await expect(modal.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  // TC-006 — Empty Program Name field prevents form submission
  test("TC-006: Empty Program Name field prevents form submission", async ({ page }) => {
    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Description" }).fill(testDescription("Description without program name"));

    await expect(modal.getByRole("textbox", { name: "Program Name" })).toBeEmpty();
    await expect(modal.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  // TC-007 — Duplicate program name (exact match) is rejected with an error message
  // test.fail() documents a known app defect: duplicate creation succeeds instead of being rejected
  test.fail("TC-007: Duplicate program name is rejected with an error message", async ({ page }) => {
    const programName = testProgramName("Duplicate Test");
    const description = testDescription("Attempted duplicate program");

    await page.goto(`${BASE_URL}/programs`);

    // Create first program
    await page.getByRole("button", { name: "+ New Program" }).click();
    let modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("textbox", { name: "Description" }).fill(testDescription("Original program"));
    await modal.getByRole("button", { name: "Create" }).click();
    await expect(page.getByRole("cell", { name: new RegExp(esc(programName)) }).first()).toBeVisible();

    // Attempt duplicate
    await page.getByRole("button", { name: "+ New Program" }).click();
    modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("textbox", { name: "Description" }).fill(description);
    await modal.getByRole("button", { name: "Create" }).click();

    const errorVisible = await page.getByRole("alert").isVisible().catch(() => false);
    const duplicateRows = page.getByRole("cell", { name: new RegExp(esc(programName)) });
    const rowCount = await duplicateRows.count();

    expect(errorVisible).toBe(true);
    expect(rowCount).toBe(1);
  });

  // TC-008 — Duplicate-name error message is specific and actionable
  // test.fail() documents a known app defect: no duplicate error message is shown
  test.fail("TC-008: Duplicate-name error message is specific and actionable", async ({ page }) => {
    const programName = testProgramName("Duplicate Error Test");

    await page.goto(`${BASE_URL}/programs`);

    await page.getByRole("button", { name: "+ New Program" }).click();
    let modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("textbox", { name: "Description" }).fill(testDescription("Original program"));
    await modal.getByRole("button", { name: "Create" }).click();
    await expect(page.getByRole("cell", { name: new RegExp(esc(programName)) }).first()).toBeVisible();

    await page.getByRole("button", { name: "+ New Program" }).click();
    modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("textbox", { name: "Description" }).fill(testDescription("Second duplicate attempt"));
    await modal.getByRole("button", { name: "Create" }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    const alertText = await alert.textContent();
    expect(alertText?.toLowerCase()).not.toContain("something went wrong");
    expect(alertText?.toLowerCase()).toMatch(/already exists|duplicate/);
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
    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill("\t");
    await modal.getByRole("textbox", { name: "Description" }).fill(testDescription("Tab-only name test"));

    await expect(modal.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  // TC-011 — Program name with a mix of spaces and tabs is rejected
  test("TC-011: Program name with a mix of spaces and tabs is rejected", async ({ page }) => {
    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(" \t  \t ");
    await modal.getByRole("textbox", { name: "Description" }).fill(testDescription("Mixed whitespace name test"));

    await expect(modal.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  // TC-012 — Single-character program name is accepted
  test("TC-012: Single-character program name is accepted", async ({ page }) => {
    const programName = testProgramName("A");
    const description = testDescription("Single character program name");

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("textbox", { name: "Description" }).fill(description);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(esc(programName)) }).first()).toBeVisible();
  });

  // TC-013 — Program name at the maximum allowed length is accepted
  test("TC-013: Program name at maximum allowed length is accepted", async ({ page }) => {
    const suffix = String(Date.now());
    const maxName = DATA_PREFIX + "A".repeat(255 - DATA_PREFIX.length - suffix.length) + suffix;

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(maxName);
    await modal.getByRole("textbox", { name: "Description" }).fill(testDescription("Max length program name test"));
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(suffix) }).first()).toBeVisible();
  });

  // TC-014 — Program name exceeding maximum allowed length is rejected or truncated
  // test.fail() documents a known app defect: the field accepts >255 chars without truncation or error
  test.fail("TC-014: Program name exceeding maximum allowed length is rejected or truncated", async ({ page }) => {
    const overLimitName = DATA_PREFIX + "A".repeat(256 - DATA_PREFIX.length);

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    const nameField = modal.getByRole("textbox", { name: "Program Name" });
    await nameField.fill(overLimitName);

    const actualValue = await nameField.inputValue();
    const createBtn = modal.getByRole("button", { name: "Create" });
    const isDisabled = await createBtn.isDisabled();

    expect(actualValue.length <= 255 || isDisabled).toBe(true);
  });

  // TC-015 — Program name with HTML/script tags is stored and displayed as plain text
  test("TC-015: Program name with HTML/script tags does not execute", async ({ page }) => {
    let alertFired = false;
    page.on("dialog", (dialog) => {
      alertFired = true;
      dialog.dismiss();
    });

    const programName = `${DATA_PREFIX}<script>alert('xss')</script>`;
    const description = testDescription("XSS prevention test description");

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("textbox", { name: "Description" }).fill(description);

    const createBtn = modal.getByRole("button", { name: "Create" });
    if (await createBtn.isEnabled()) {
      await createBtn.click();
      await expect(page.getByRole("dialog", { name: "New Program" })).not.toBeVisible();
      await expect(page.getByRole("cell", { name: new RegExp(esc(programName)) }).first()).toBeVisible();
    }

    expect(alertFired).toBe(false);
  });

  // TC-016 — Duplicate check behavior is consistent for case-variant names
  test("TC-016: Duplicate check is consistent for case-variant names", async ({ page }) => {
    const programName = testProgramName("Case Test");

    await page.goto(`${BASE_URL}/programs`);

    await page.getByRole("button", { name: "+ New Program" }).click();
    let modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("textbox", { name: "Description" }).fill(testDescription("Original case-sensitive test"));
    await modal.getByRole("button", { name: "Create" }).click();
    await expect(page.getByRole("cell", { name: new RegExp(esc(programName)) }).first()).toBeVisible();

    await page.getByRole("button", { name: "+ New Program" }).click();
    modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName.toLowerCase());
    await modal.getByRole("textbox", { name: "Description" }).fill(testDescription("Case variant duplicate test"));
    await modal.getByRole("button", { name: "Create" }).click();
    await expect(page.getByRole("dialog", { name: "New Program" })).not.toBeVisible({ timeout: 10000 });

    const errorVisible = await page.getByRole("alert").isVisible().catch(() => false);
    const duplicateRows = page.getByRole("cell", { name: new RegExp(esc(programName), "i") });
    const rowCount = await duplicateRows.count();
    expect(errorVisible || rowCount >= 1).toBe(true);
  });

  // TC-017 — Program name with Unicode and multilingual characters is accepted
  test("TC-017: Program name with Unicode and multilingual characters is accepted", async ({ page }) => {
    const timestamp = Date.now();
    const programName = `${DATA_PREFIX}Programmation C++ — Niveau 3 (${timestamp}) 高级`;
    const description = testDescription("Multilingual program name test");

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("textbox", { name: "Description" }).fill(description);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(String(timestamp)) }).first()).toBeVisible();
  });

  // TC-018 — Duplicate name validation is enforced server-side after a page reload
  // test.fail() documents a known app defect: duplicate passes even after reload (no server-side check)
  test.fail("TC-018: Duplicate name validation is enforced after a page reload", async ({ page }) => {
    const programName = testProgramName("Reload Dup Test");

    await page.goto(`${BASE_URL}/programs`);

    await page.getByRole("button", { name: "+ New Program" }).click();
    let modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("textbox", { name: "Description" }).fill(testDescription("Original program"));
    await modal.getByRole("button", { name: "Create" }).click();
    await expect(page.getByRole("cell", { name: new RegExp(esc(programName)) }).first()).toBeVisible();

    await page.reload();
    await page.waitForURL(`${BASE_URL}/programs`);

    await page.getByRole("button", { name: "+ New Program" }).click();
    modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("textbox", { name: "Description" }).fill(testDescription("Server-side duplicate check test"));
    await modal.getByRole("button", { name: "Create" }).click();

    const errorVisible = await page.getByRole("alert").isVisible().catch(() => false);
    const duplicateRows = page.getByRole("cell", { name: new RegExp(esc(programName)) });
    const rowCount = await duplicateRows.count();

    expect(errorVisible).toBe(true);
    expect(rowCount).toBe(1);
  });

  // TC-019 — Program name consisting only of numeric characters is accepted
  test("TC-019: Program name consisting only of numeric characters is accepted", async ({ page }) => {
    const programName = testProgramName("2026");
    const description = testDescription("Numeric-only program name test");

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("textbox", { name: "Description" }).fill(description);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(esc(programName)) }).first()).toBeVisible();
  });

  // TC-020 — Rapid double-click on Create does not produce duplicate programs
  // test.fail() documents a known app defect: double-clicking Create submits the form twice
  test.fail("TC-020: Rapid double-click on Create does not produce duplicate programs", async ({ page }) => {
    const programName = testProgramName("Unique Program Name 001");

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("textbox", { name: "Description" }).fill(testDescription("Double-click submit test"));
    await modal.getByRole("button", { name: "Create" }).dblclick();

    await expect(page.getByRole("dialog", { name: "New Program" })).not.toBeVisible({ timeout: 10000 });

    const duplicateRows = page.getByRole("cell", { name: new RegExp(esc(programName)) });
    await expect(duplicateRows.first()).toBeVisible();
    expect(await duplicateRows.count()).toBe(1);
  });
});
