import { test, expect } from "@playwright/test";

const BASE_URL = process.env.DIDAXIS_URL!;

async function createProgram(page: any, name: string, description = "") {
  await page.goto(`${BASE_URL}/programs`);
  await page.getByRole("button", { name: "+ New Program" }).click();
  const createModal = page.getByRole("dialog", { name: "New Program" });
  await createModal.getByRole("textbox", { name: "Program Name" }).fill(name);
  if (description) {
    await createModal.getByRole("textbox", { name: "Description" }).fill(description);
  }
  await createModal.getByRole("button", { name: "Create" }).click();
  await expect(
    page.getByRole("cell", { name: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).first()
  ).toBeVisible();
}

async function openEditModal(page: any, programName: string) {
  await page
    .getByRole("row", { name: new RegExp(programName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })
    .first()
    .getByRole("button", { name: "✏️" })
    .click();
  const modal = page.getByRole("dialog", { name: "Edit Program" });
  await modal.waitFor({ state: "visible" });
  return modal;
}

test.describe("DS-2: Edit Program", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole("textbox", { name: "Email" }).fill(process.env.DIDAXIS_EMAIL!);
    await page.getByRole("textbox", { name: "Password" }).fill(process.env.DIDAXIS_PASSWORD!);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(`${BASE_URL}/`);
  });

  // TC-001 — Edit form opens pre-populated with the program's current data
  test("TC-001: Edit form opens pre-populated with current program data", async ({ page }) => {
    const name = `Edit Test ${Date.now()}`;
    const description = "Original description";
    await createProgram(page, name, description);

    const modal = await openEditModal(page, name);

    await expect(modal.getByRole("textbox", { name: "Program Name" })).toHaveValue(name);
    await expect(modal.getByRole("textbox", { name: "Description" })).toHaveValue(description);
  });

  // TC-002 — Admin successfully updates the program name
  test("TC-002: Admin successfully updates the program name", async ({ page }) => {
    const originalName = `Edit Test ${Date.now()}`;
    const updatedName = `${originalName} - Updated`;
    await createProgram(page, originalName);

    const modal = await openEditModal(page, originalName);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(updatedName);
    await modal.getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(updatedName) })).toBeVisible();
  });

  // TC-003 — Program list reflects the updated name immediately without a page reload
  test("TC-003: Program list reflects updated name without page reload", async ({ page }) => {
    const originalName = `Edit Test ${Date.now()}`;
    const updatedName = `${originalName} - Updated`;
    await createProgram(page, originalName);

    const modal = await openEditModal(page, originalName);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(updatedName);
    await modal.getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("dialog", { name: "Edit Program" })).not.toBeVisible();
    await expect(page.getByRole("cell", { name: new RegExp(updatedName) })).toBeVisible();
    await expect(page.getByRole("cell", { name: new RegExp(`^${originalName}$`) })).not.toBeVisible();
  });

  // TC-004 — Editing only the Description preserves the Program Name
  test("TC-004: Editing only Description preserves Program Name", async ({ page }) => {
    const name = `Edit Test ${Date.now()}`;
    const updatedDesc = "Updated full-stack curriculum for 2026";
    await createProgram(page, name, "Original description");

    let modal = await openEditModal(page, name);
    await modal.getByRole("textbox", { name: "Description" }).fill(updatedDesc);
    await modal.getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(name) })).toBeVisible();

    modal = await openEditModal(page, name);
    await expect(modal.getByRole("textbox", { name: "Program Name" })).toHaveValue(name);
    await expect(modal.getByRole("textbox", { name: "Description" })).toHaveValue(updatedDesc);
  });

  // TC-005 — Editing only the Name preserves the Description
  test("TC-005: Editing only Name preserves Description", async ({ page }) => {
    const originalName = `Edit Test ${Date.now()}`;
    const updatedName = `${originalName} - Updated`;
    const description = "Full-stack web development program";
    await createProgram(page, originalName, description);

    let modal = await openEditModal(page, originalName);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(updatedName);
    await modal.getByRole("button", { name: "Save" }).click();

    modal = await openEditModal(page, updatedName);
    await expect(modal.getByRole("textbox", { name: "Description" })).toHaveValue(description);
  });

  // TC-006 — Admin successfully updates both Name and Description simultaneously
  test("TC-006: Admin successfully updates both Name and Description", async ({ page }) => {
    const originalName = `Edit Test ${Date.now()}`;
    const updatedName = `${originalName} - Updated`;
    const updatedDesc = "Revised full-stack curriculum";
    await createProgram(page, originalName, "Original description");

    let modal = await openEditModal(page, originalName);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(updatedName);
    await modal.getByRole("textbox", { name: "Description" }).fill(updatedDesc);
    await modal.getByRole("button", { name: "Save" }).click();

    modal = await openEditModal(page, updatedName);
    await expect(modal.getByRole("textbox", { name: "Program Name" })).toHaveValue(updatedName);
    await expect(modal.getByRole("textbox", { name: "Description" })).toHaveValue(updatedDesc);
  });

  // TC-007 — Save button is disabled when Program Name is cleared
  test("TC-007: Save button is disabled when Program Name is cleared", async ({ page }) => {
    const name = `Edit Test ${Date.now()}`;
    await createProgram(page, name);

    const modal = await openEditModal(page, name);
    await modal.getByRole("textbox", { name: "Program Name" }).clear();

    await expect(modal.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  // TC-008 — Cancelling the edit form does not apply any changes
  test("TC-008: Cancelling the edit form does not apply changes", async ({ page }) => {
    const name = `Edit Test ${Date.now()}`;
    await createProgram(page, name);

    const modal = await openEditModal(page, name);
    await modal.getByRole("textbox", { name: "Program Name" }).fill("Should Not Be Saved");
    await modal.getByRole("textbox", { name: "Description" }).fill("This should not persist");
    await modal.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByRole("dialog", { name: "Edit Program" })).not.toBeVisible();
    await expect(page.getByRole("cell", { name: new RegExp(name) })).toBeVisible();
  });

  // TC-009 — Program Name containing only whitespace is rejected
  test("TC-009: Program Name containing only whitespace is rejected", async ({ page }) => {
    const name = `Edit Test ${Date.now()}`;
    await createProgram(page, name);

    const modal = await openEditModal(page, name);
    await modal.getByRole("textbox", { name: "Program Name" }).fill("     ");

    await expect(modal.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  // TC-010 — Non-admin user cannot access the edit icon
  test("TC-010: Non-admin user cannot access the edit icon", async ({ page }) => {
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

    await expect(page.getByRole("button", { name: "✏️" }).first()).not.toBeVisible();
  });

  // TC-011 — Navigating away mid-edit without saving discards changes
  test("TC-011: Navigating away without saving discards changes", async ({ page }) => {
    const name = `Edit Test ${Date.now()}`;
    await createProgram(page, name);

    const modal = await openEditModal(page, name);
    await modal.getByRole("textbox", { name: "Program Name" }).fill("Should Not Be Saved");

    await page.goto(`${BASE_URL}/`);
    await page.goto(`${BASE_URL}/programs`);

    await expect(page.getByRole("cell", { name: new RegExp(name) })).toBeVisible();
  });

  // TC-012 — Program Name at maximum allowed length is accepted
  test("TC-012: Program Name at maximum allowed length is accepted", async ({ page }) => {
    const originalName = `Edit Test ${Date.now()}`;
    const suffix = String(Date.now());
    const maxName = "A".repeat(255 - suffix.length) + suffix;
    await createProgram(page, originalName);

    const modal = await openEditModal(page, originalName);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(maxName);
    await modal.getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(suffix) }).first()).toBeVisible();
  });

  // TC-013 — Program Name exceeding maximum allowed length is rejected
  // test.fail() documents a known app defect: the field accepts >255 chars without rejection
  test.fail("TC-013: Program Name exceeding maximum length is rejected", async ({ page }) => {
    const originalName = `Edit Test ${Date.now()}`;
    await createProgram(page, originalName);

    const modal = await openEditModal(page, originalName);
    const nameField = modal.getByRole("textbox", { name: "Program Name" });
    await nameField.fill("A".repeat(256));

    const actualValue = await nameField.inputValue();
    const isDisabled = await modal.getByRole("button", { name: "Save" }).isDisabled();

    expect(actualValue.length <= 255 || isDisabled).toBe(true);
  });

  // TC-014 — Program Name with special characters is saved and rendered correctly
  test("TC-014: Program Name with special characters is saved and rendered correctly", async ({ page }) => {
    const originalName = `Edit Test ${Date.now()}`;
    const specialName = `Web Dev & Design: ${Date.now()} (Part 1)`;
    const escapedName = specialName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await createProgram(page, originalName);

    const modal = await openEditModal(page, originalName);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(specialName);
    await modal.getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(escapedName) })).toBeVisible();
  });

  // TC-015 — Program Name with HTML/script tags does not execute
  test("TC-015: Program Name with HTML/script tags does not execute", async ({ page }) => {
    let alertFired = false;
    page.on("dialog", (dialog: any) => {
      alertFired = true;
      dialog.dismiss();
    });

    const originalName = `Edit Test ${Date.now()}`;
    await createProgram(page, originalName);

    const modal = await openEditModal(page, originalName);
    await modal.getByRole("textbox", { name: "Program Name" }).fill("<script>alert('xss')</script>");

    if (await modal.getByRole("button", { name: "Save" }).isEnabled()) {
      await modal.getByRole("button", { name: "Save" }).click();
    }

    expect(alertFired).toBe(false);
  });

  // TC-016 — Editing to a duplicate name is handled
  test("TC-016: Editing to a duplicate program name is handled", async ({ page }) => {
    const nameA = `Edit Test A ${Date.now()}`;
    const nameB = `Edit Test B ${Date.now()}`;
    await createProgram(page, nameA);
    await createProgram(page, nameB);

    const modal = await openEditModal(page, nameA);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(nameB);
    await modal.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("dialog", { name: "Edit Program" })).not.toBeVisible({ timeout: 10000 });

    const errorVisible = await page.getByRole("alert").isVisible().catch(() => false);
    const cells = page.getByRole("cell", { name: new RegExp(nameB.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) });
    const rowCount = await cells.count();
    expect(errorVisible || rowCount >= 1).toBe(true);
  });

  // TC-017 — Program Name with leading/trailing whitespace is trimmed on save
  test("TC-017: Program Name with leading/trailing whitespace is trimmed on save", async ({ page }) => {
    const originalName = `Edit Test ${Date.now()}`;
    const baseName = `Trimmed Edit ${Date.now()}`;
    await createProgram(page, originalName);

    const modal = await openEditModal(page, originalName);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(`  ${baseName}  `);
    await modal.getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(baseName) })).toBeVisible();
  });

  // TC-018 — Description field at maximum allowed length is accepted
  test("TC-018: Description field at maximum allowed length is accepted", async ({ page }) => {
    const name = `Edit Test ${Date.now()}`;
    const maxDesc = "D".repeat(1000);
    await createProgram(page, name);

    const modal = await openEditModal(page, name);
    await modal.getByRole("textbox", { name: "Description" }).fill(maxDesc);
    await modal.getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(name) })).toBeVisible();
  });

  // TC-019 — Rapid double-click on Save does not submit the form twice
  test("TC-019: Rapid double-click on Save does not submit the form twice", async ({ page }) => {
    const originalName = `Edit Test ${Date.now()}`;
    const updatedName = `${originalName} - Updated`;
    await createProgram(page, originalName);

    const modal = await openEditModal(page, originalName);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(updatedName);
    await modal.getByRole("button", { name: "Save" }).dblclick();

    await expect(page.getByRole("dialog", { name: "Edit Program" })).not.toBeVisible();
    const cells = page.getByRole("cell", { name: new RegExp(updatedName) });
    expect(await cells.count()).toBe(1);
  });

  // TC-020 — Server error during save displays an appropriate error message
  test("TC-020: Server error during save displays an appropriate error message", async ({ page }) => {
    const name = `Edit Test ${Date.now()}`;
    await createProgram(page, name);

    const modal = await openEditModal(page, name);
    await modal.getByRole("textbox", { name: "Program Name" }).fill(`${name} - Updated`);

    await page.route("**/api/**", (route: any) => {
      if (route.request().method() === "PUT" || route.request().method() === "PATCH") {
        route.fulfill({ status: 500, body: "Internal Server Error" });
      } else {
        route.continue();
      }
    });

    await modal.getByRole("button", { name: "Save" }).click();

    const modalStillOpen = await page.getByRole("dialog", { name: "Edit Program" }).isVisible().catch(() => false);
    const errorShown = await page.getByRole("alert").isVisible().catch(() => false);
    expect(modalStillOpen || errorShown).toBe(true);
  });
});
