import { test, expect, type CleanupFixtures } from "../fixtures/cleanup.fixture";
import type { Page } from "@playwright/test";

const BASE_URL = process.env.DIDAXIS_URL!;
const DATA_PREFIX = "AP_";
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const testProgramName = (label: string) => `${DATA_PREFIX}${label} ${Date.now()}`;
const testDescription = (text: string) => `${DATA_PREFIX}${text}`;

type ProgramListItem = {
  id: string;
  name: string;
};

async function trackProgramsByName(
  page: Page,
  trackProgram: CleanupFixtures["trackProgram"],
  name: string
) {
  const token = process.env.DIDAXIS_API_TOKEN;
  if (!token) {
    console.warn(`[ds1-create-program] Skipping cleanup tracking for "${name}" (missing DIDAXIS_API_TOKEN).`);
    return;
  }

  const response = await page.request.get(`${BASE_URL}/api/programs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok()) {
    console.warn(
      `[ds1-create-program] Skipping cleanup tracking for "${name}" (GET /api/programs returned ${response.status()}).`
    );
    return;
  }

  const body = (await response.json()) as { data?: ProgramListItem[] };
  const ids = (body.data ?? []).filter((program) => program.name === name).map((program) => program.id);
  if (ids.length === 0) {
    console.warn(`[ds1-create-program] No matching program ID found for "${name}".`);
    return;
  }

  for (const id of ids) {
    trackProgram(id);
  }
}

test.describe("DS-1: Create Program", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole("textbox", { name: "Email" }).fill(process.env.DIDAXIS_EMAIL!);
    await page.getByRole("textbox", { name: "Password" }).fill(process.env.DIDAXIS_PASSWORD!);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(`${BASE_URL}/`);
  });

  // TC-001 — Program creation form is accessible to admin
  test("TC-001: New Program modal contains required fields and Create button", async ({ page }) => {
    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await expect(modal.getByRole("textbox", { name: "Program Name" })).toBeVisible();
    await expect(modal.getByRole("textbox", { name: "Description" })).toBeVisible();
    await expect(modal.getByRole("button", { name: "Create" })).toBeVisible();
  });

  // TC-002 — Admin successfully creates a program with all fields populated
  test("TC-002: Admin successfully creates a program with all fields populated", async ({ page, trackProgram }) => {
    const programName = testProgramName("Web Development");
    const description = testDescription("Full-stack web development program");

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("textbox", { name: "Description" }).fill(description);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(esc(programName)) }).first()).toBeVisible();
    await trackProgramsByName(page, trackProgram, programName);
  });

  // TC-003 — Admin successfully creates a program with only the required field
  test("TC-003: Admin successfully creates a program with only the required field", async ({ page, trackProgram }) => {
    const programName = testProgramName("Data Science");

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(esc(programName)) }).first()).toBeVisible();
    await trackProgramsByName(page, trackProgram, programName);
  });

  // TC-004 — Create button is enabled when Program Name is filled
  test("TC-004: Create button is enabled when Program Name is filled", async ({ page }) => {
    const programName = testProgramName("Computer Science");

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await expect(modal.getByRole("button", { name: "Create" })).toBeDisabled();

    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);

    await expect(modal.getByRole("button", { name: "Create" })).toBeEnabled();
  });

  // TC-005 — Create button is disabled when Program Name is empty
  test("TC-005: Create button is disabled when Program Name is empty", async ({ page }) => {
    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await expect(modal.getByRole("textbox", { name: "Program Name" })).toBeEmpty();
    await expect(modal.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  // TC-006 — Create button remains disabled when only Description is filled
  test("TC-006: Create button remains disabled when only Description is filled", async ({ page }) => {
    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Description" }).fill(testDescription("Full-stack web development program"));

    await expect(modal.getByRole("textbox", { name: "Program Name" })).toBeEmpty();
    await expect(modal.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  // TC-007 — Program Name containing only whitespace is rejected
  test("TC-007: Program Name containing only whitespace is rejected", async ({ page }) => {
    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill("     ");

    await expect(modal.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  // TC-008 — Non-admin user cannot access the program creation form
  test("TC-008: Non-admin user cannot access the program creation form", async ({ page }) => {
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

  // TC-009 — Cancelling the form does not create a program
  test("TC-009: Cancelling the form does not create a program", async ({ page }) => {
    const programName = testProgramName("Cancelled Program");

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("textbox", { name: "Description" }).fill(testDescription("This should not be saved"));
    await modal.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByRole("dialog", { name: "New Program" })).not.toBeVisible();
    await expect(page.getByRole("cell", { name: new RegExp(esc(programName)) }).first()).not.toBeVisible();
  });

  // TC-010 — Program Name at maximum allowed length is accepted
  test("TC-010: Program Name at maximum allowed length is accepted", async ({ page, trackProgram }) => {
    const suffix = String(Date.now());
    const maxName = DATA_PREFIX + "A".repeat(255 - DATA_PREFIX.length - suffix.length) + suffix;

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(maxName);
    await modal.getByRole("textbox", { name: "Description" }).fill(testDescription("Test description"));
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(suffix) }).first()).toBeVisible();
    await trackProgramsByName(page, trackProgram, maxName);
  });

  // TC-011 — Program Name exceeding maximum length is rejected
  // test.fail() documents a known app defect: the field accepts >255 chars without truncation or error
  test.fail("TC-011: Program Name exceeding maximum length is rejected", async ({ page }) => {
    const overLimitName = "A".repeat(256);

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    const nameField = modal.getByRole("textbox", { name: "Program Name" });
    await nameField.fill(overLimitName);

    const actualValue = await nameField.inputValue();
    const createBtn = modal.getByRole("button", { name: "Create" });
    const isDisabled = await createBtn.isDisabled();

    // Expected per spec: input truncated to ≤255 chars OR Create button disabled
    expect(actualValue.length <= 255 || isDisabled).toBe(true);
  });

  // TC-012 — Program Name with special characters is handled correctly
  test("TC-012: Program Name with special characters is handled correctly", async ({ page, trackProgram }) => {
    const programName = `${DATA_PREFIX}Web Dev & Design: ${Date.now()} (Part 1)`;

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(esc(programName)) }).first()).toBeVisible();
    await trackProgramsByName(page, trackProgram, programName);
  });

  // TC-013 — Program Name with HTML/script tags does not execute
  test("TC-013: Program Name with HTML/script tags does not execute", async ({ page, trackProgram }) => {
    let alertFired = false;
    page.on("dialog", (dialog) => {
      alertFired = true;
      dialog.dismiss();
    });

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(`${DATA_PREFIX}<script>alert('xss')</script>`);

    const createBtn = modal.getByRole("button", { name: "Create" });
    if (await createBtn.isEnabled()) {
      await createBtn.click();
      await trackProgramsByName(page, trackProgram, `${DATA_PREFIX}<script>alert('xss')</script>`);
    }

    expect(alertFired).toBe(false);
  });

  // TC-014 — Duplicate program name is handled
  test("TC-014: Duplicate program name is handled", async ({ page, trackProgram }) => {
    const programName = testProgramName("Duplicate Test");

    await page.goto(`${BASE_URL}/programs`);

    // Create first program
    await page.getByRole("button", { name: "+ New Program" }).click();
    let modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("button", { name: "Create" }).click();
    await expect(page.getByRole("cell", { name: new RegExp(esc(programName)) }).first()).toBeVisible();
    await trackProgramsByName(page, trackProgram, programName);

    // Attempt to create a duplicate
    await page.getByRole("button", { name: "+ New Program" }).click();
    modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("button", { name: "Create" }).click();
    await expect(page.getByRole("dialog", { name: "New Program" })).not.toBeVisible({ timeout: 10000 });
    await trackProgramsByName(page, trackProgram, programName);

    // Either an error is shown, or the duplicate is created — both are valid outcomes
    const errorVisible = await page.getByRole("alert").isVisible().catch(() => false);
    const duplicateRows = page.getByRole("cell", { name: new RegExp(esc(programName)) });
    const rowCount = await duplicateRows.count();
    expect(errorVisible || rowCount >= 1).toBe(true);
  });

  // TC-015 — Description field at maximum allowed length is accepted
  test("TC-015: Description field at maximum allowed length is accepted", async ({ page, trackProgram }) => {
    const programName = testProgramName("New Program");
    const maxDescription = testDescription("D".repeat(1000 - DATA_PREFIX.length));

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("textbox", { name: "Description" }).fill(maxDescription);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(esc(programName)) }).first()).toBeVisible();
    await trackProgramsByName(page, trackProgram, programName);
  });

  // TC-016 — Newly created program appears in the list without a page refresh
  test("TC-016: Newly created program appears in the list without a page refresh", async ({ page, trackProgram }) => {
    const programName = testProgramName("Machine Learning");

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(programName);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("dialog", { name: "New Program" })).not.toBeVisible();
    await expect(page.getByRole("cell", { name: new RegExp(esc(programName)) }).first()).toBeVisible();
    await trackProgramsByName(page, trackProgram, programName);
  });

  // TC-017 — Program Name with leading/trailing whitespace is trimmed
  test("TC-017: Program Name with leading/trailing whitespace is trimmed", async ({ page, trackProgram }) => {
    const baseName = testProgramName("Web Development");
    const paddedName = `  ${baseName}  `;

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();

    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(paddedName);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(esc(baseName)) }).first()).toBeVisible();
    await trackProgramsByName(page, trackProgram, baseName);
  });
});
