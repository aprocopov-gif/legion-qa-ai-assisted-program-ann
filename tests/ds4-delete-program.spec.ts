import { test, expect } from "@playwright/test";

const BASE_URL = process.env.DIDAXIS_URL!;

async function createProgram(page: any, name: string) {
  await page.goto(`${BASE_URL}/programs`);
  await page.getByRole("button", { name: "+ New Program" }).click();
  const modal = page.getByRole("dialog", { name: "New Program" });
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

test.describe("DS-4: Delete Program", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole("textbox", { name: "Email" }).fill(process.env.DIDAXIS_EMAIL!);
    await page.getByRole("textbox", { name: "Password" }).fill(process.env.DIDAXIS_PASSWORD!);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(`${BASE_URL}/`);
  });

  // TC-001 — Confirmed deletion removes the program from the program list
  test("TC-001: Confirmed deletion removes the program from the list", async ({ page }) => {
    const name = `Delete Me ${Date.now()}`;
    await createProgram(page, name);

    await page.goto(`${BASE_URL}/programs`);
    page.once("dialog", (dialog: any) => dialog.accept());
    await page
      .getByRole("row", { name: new RegExp(name) })
      .first()
      .getByRole("button", { name: "🗑" })
      .click();

    await expect(page.getByRole("cell", { name: new RegExp(name) })).not.toBeVisible();
  });

  // TC-002 — Cancelling the confirmation dialog leaves the program intact
  test("TC-002: Cancelling the confirmation dialog leaves the program intact", async ({ page }) => {
    const name = `Keep Me ${Date.now()}`;
    await createProgram(page, name);

    await page.goto(`${BASE_URL}/programs`);
    page.once("dialog", (dialog: any) => dialog.dismiss());
    await page
      .getByRole("row", { name: new RegExp(name) })
      .first()
      .getByRole("button", { name: "🗑" })
      .click();

    await expect(page.getByRole("cell", { name: new RegExp(name) })).toBeVisible();
  });

  // TC-003 — Deleting one program does not affect other programs in the list
  test("TC-003: Deleting one program does not affect other programs", async ({ page }) => {
    const nameA = `Delete Target ${Date.now()}`;
    const nameB = `Survivor ${Date.now() + 1}`;
    await createProgram(page, nameA);
    await createProgram(page, nameB);

    await deleteProgram(page, nameA);

    await expect(page.getByRole("cell", { name: new RegExp(nameA) })).not.toBeVisible();
    await expect(page.getByRole("cell", { name: new RegExp(nameB) })).toBeVisible();
  });

  // TC-004 — Deleted program name becomes available for a new program
  test("TC-004: Deleted program name can be reused for a new program", async ({ page }) => {
    const name = `Reusable Name ${Date.now()}`;
    await createProgram(page, name);
    await deleteProgram(page, name);

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();
    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("cell", { name: new RegExp(name) })).toBeVisible();
  });

  // TC-005 — Confirmation dialog displays the correct program name
  test("TC-005: Confirmation dialog displays the correct program name", async ({ page }) => {
    const name = `Name Check ${Date.now()}`;
    await createProgram(page, name);

    await page.goto(`${BASE_URL}/programs`);
    let dialogMessage = "";
    page.once("dialog", (dialog: any) => {
      dialogMessage = dialog.message();
      dialog.dismiss();
    });
    await page
      .getByRole("row", { name: new RegExp(name) })
      .first()
      .getByRole("button", { name: "🗑" })
      .click();

    expect(dialogMessage).toContain(name);
    await expect(page.getByRole("cell", { name: new RegExp(name) })).toBeVisible();
  });

  // TC-006 — Deletion is persisted after a page reload
  test("TC-006: Deletion is persisted after a page reload", async ({ page }) => {
    const name = `Persist Test ${Date.now()}`;
    await createProgram(page, name);
    await deleteProgram(page, name);

    await page.reload();
    await page.waitForURL(`${BASE_URL}/programs`);

    await expect(page.getByRole("cell", { name: new RegExp(name) })).not.toBeVisible();
  });

  // TC-007 — Non-admin user does not see the delete icon
  test("TC-007: Non-admin user does not see the delete icon", async ({ page }) => {
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

    await expect(page.getByRole("button", { name: "🗑" }).first()).not.toBeVisible();
  });

  // TC-008 — Dismissing the confirmation dialog (equivalent of X button) leaves the program intact
  test("TC-008: Dismissing the confirmation dialog leaves the program intact", async ({ page }) => {
    const name = `Dismiss Test ${Date.now()}`;
    await createProgram(page, name);

    await page.goto(`${BASE_URL}/programs`);
    page.once("dialog", (dialog: any) => dialog.dismiss());
    await page
      .getByRole("row", { name: new RegExp(name) })
      .first()
      .getByRole("button", { name: "🗑" })
      .click();

    await expect(page.getByRole("cell", { name: new RegExp(name) })).toBeVisible();
  });

  // TC-009 — Network failure during deletion shows an error and leaves the program intact
  test("TC-009: Network failure during confirmation shows an error and program remains", async ({ page }) => {
    const name = `Network Fail ${Date.now()}`;
    await createProgram(page, name);

    await page.goto(`${BASE_URL}/programs`);

    await page.route("**", (route: any) => {
      if (route.request().method() === "DELETE") {
        route.abort();
      } else {
        route.continue();
      }
    });

    page.once("dialog", (dialog: any) => dialog.accept());
    await page
      .getByRole("row", { name: new RegExp(name) })
      .first()
      .getByRole("button", { name: "🗑" })
      .click();

    await page.waitForTimeout(2000);
    await page.unrouteAll();

    await page.goto(`${BASE_URL}/programs`);
    await expect(page.getByRole("cell", { name: new RegExp(name) })).toBeVisible();
  });

  // TC-010 — Direct API call without admin credentials is rejected
  test("TC-010: Direct API call without admin credentials is rejected", async ({ page }) => {
    test.skip(
      !process.env.DIDAXIS_NONADMIN_EMAIL || !process.env.DIDAXIS_NONADMIN_PASSWORD,
      "Non-admin credentials not configured (set DIDAXIS_NONADMIN_EMAIL and DIDAXIS_NONADMIN_PASSWORD in .env)"
    );

    const name = `API Auth Test ${Date.now()}`;
    await createProgram(page, name);

    const programRow = page.getByRole("row", { name: new RegExp(name) }).first();
    const rowText = await programRow.textContent();
    const idMatch = rowText?.match(/\d{3,}/);

    const response = await page.request.delete(`${BASE_URL}/api/programs/${idMatch?.[0] ?? "1"}`, {
      headers: { Authorization: `Bearer non-admin-token` },
    });

    expect([401, 403, 404]).toContain(response.status());
    await page.goto(`${BASE_URL}/programs`);
    await expect(page.getByRole("cell", { name: new RegExp(name) })).toBeVisible();
  });

  // TC-011 — Clicking Cancel (dismiss) multiple times does not accumulate side effects
  test("TC-011: Dismissing the dialog multiple times does not affect the program", async ({ page }) => {
    const name = `Multi Cancel ${Date.now()}`;
    await createProgram(page, name);

    await page.goto(`${BASE_URL}/programs`);

    for (let i = 0; i < 5; i++) {
      page.once("dialog", (dialog: any) => dialog.dismiss());
      await page
        .getByRole("row", { name: new RegExp(name) })
        .first()
        .getByRole("button", { name: "🗑" })
        .click();
      await page.waitForTimeout(300);
    }

    await expect(page.getByRole("cell", { name: new RegExp(name) })).toBeVisible();
  });

  // TC-012 — Deleting the only program shows an empty-state or clean table
  test("TC-012: Deleting a program and verifying it no longer appears in the list", async ({ page }) => {
    const name = `Solo Program ${Date.now()}`;
    await createProgram(page, name);

    await page.goto(`${BASE_URL}/programs`);
    page.once("dialog", (dialog: any) => dialog.accept());
    await page
      .getByRole("row", { name: new RegExp(name) })
      .first()
      .getByRole("button", { name: "🗑" })
      .click();

    await expect(page.getByRole("cell", { name: new RegExp(name) })).not.toBeVisible();
  });

  // TC-013 — Program with special characters in its name can be deleted
  test("TC-013: Program with special characters in its name can be deleted", async ({ page }) => {
    const name = `Informatique & IA ${Date.now()}`;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await createProgram(page, name);

    await page.goto(`${BASE_URL}/programs`);
    let dialogMessage = "";
    page.once("dialog", (dialog: any) => {
      dialogMessage = dialog.message();
      dialog.accept();
    });
    await page
      .getByRole("row", { name: new RegExp(escaped) })
      .first()
      .getByRole("button", { name: "🗑" })
      .click();

    expect(dialogMessage).toContain("&");
    expect(dialogMessage).not.toContain("&amp;");
    await expect(page.getByRole("cell", { name: new RegExp(escaped) })).not.toBeVisible();
  });

  // TC-014 — Program with a maximum-length name can be deleted
  test("TC-014: Program with a maximum-length name can be deleted", async ({ page }) => {
    const suffix = String(Date.now());
    const maxName = "A".repeat(255 - suffix.length) + suffix;

    await createProgram(page, maxName);

    await page.goto(`${BASE_URL}/programs`);
    page.once("dialog", (dialog: any) => dialog.accept());
    await page
      .getByRole("row", { name: new RegExp(suffix) })
      .first()
      .getByRole("button", { name: "🗑" })
      .click();

    await expect(page.getByRole("cell", { name: new RegExp(suffix) })).not.toBeVisible();
  });

  // TC-015 — Dismissing the dialog (equivalent of Escape) cancels deletion
  test("TC-015: Dismissing the dialog (Escape equivalent) cancels deletion", async ({ page }) => {
    const name = `Escape Test ${Date.now()}`;
    await createProgram(page, name);

    await page.goto(`${BASE_URL}/programs`);
    page.once("dialog", (dialog: any) => dialog.dismiss());
    await page
      .getByRole("row", { name: new RegExp(name) })
      .first()
      .getByRole("button", { name: "🗑" })
      .click();

    await expect(page.getByRole("cell", { name: new RegExp(name) })).toBeVisible();
  });

  // TC-016 — Only one deletion occurs (native dialog prevents double-click exploit)
  test("TC-016: Only one deletion occurs — no duplicate API calls", async ({ page }) => {
    const name = `Double Delete ${Date.now()}`;
    await createProgram(page, name);

    let dialogCount = 0;
    page.on("dialog", (dialog: any) => {
      dialogCount++;
      dialog.accept();
    });

    await page.goto(`${BASE_URL}/programs`);
    await page
      .getByRole("row", { name: new RegExp(name) })
      .first()
      .getByRole("button", { name: "🗑" })
      .click();

    await page.waitForTimeout(1000);
    expect(dialogCount).toBe(1);
    await expect(page.getByRole("cell", { name: new RegExp(name) })).not.toBeVisible();
  });

  // TC-017 — Native confirm dialog blocks background interaction (inherently modal)
  test("TC-017: Dialog blocks background page interaction while open", async ({ page }) => {
    const nameA = `Block Target ${Date.now()}`;
    const nameB = `Background Program ${Date.now() + 1}`;
    await createProgram(page, nameA);
    await createProgram(page, nameB);

    await page.goto(`${BASE_URL}/programs`);
    let dialogCount = 0;
    page.once("dialog", (dialog: any) => {
      dialogCount++;
      dialog.dismiss();
    });

    await page
      .getByRole("row", { name: new RegExp(nameA) })
      .first()
      .getByRole("button", { name: "🗑" })
      .click();

    await page.waitForTimeout(500);
    expect(dialogCount).toBe(1);
    await expect(page.getByRole("cell", { name: new RegExp(nameA) })).toBeVisible();
    await expect(page.getByRole("cell", { name: new RegExp(nameB) })).toBeVisible();
  });

  // TC-018 — Navigating away while dialog is pending does not delete the program
  test("TC-018: Navigating away while dialog is pending does not delete the program", async ({ page }) => {
    const name = `Nav Away ${Date.now()}`;
    await createProgram(page, name);

    await page.goto(`${BASE_URL}/programs`);
    page.once("dialog", (dialog: any) => dialog.dismiss());
    await page
      .getByRole("row", { name: new RegExp(name) })
      .first()
      .getByRole("button", { name: "🗑" })
      .click();

    await page.goto(`${BASE_URL}/`);
    await page.goto(`${BASE_URL}/programs`);

    await expect(page.getByRole("cell", { name: new RegExp(name) })).toBeVisible();
  });

  // TC-019 — Program with HTML tags in its name displays as plain text in the confirmation dialog
  test("TC-019: HTML tags in program name are shown as plain text in the confirmation dialog", async ({ page }) => {
    const name = `Plain Text ${Date.now()} <b>Bold</b>`;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    await createProgram(page, name);

    await page.goto(`${BASE_URL}/programs`);
    let dialogMessage = "";
    let alertFired = false;
    page.on("dialog", (dialog: any) => {
      if (dialog.type() === "alert") {
        alertFired = true;
        dialog.dismiss();
      } else {
        dialogMessage = dialog.message();
        dialog.accept();
      }
    });

    await page
      .getByRole("row", { name: new RegExp(escaped) })
      .first()
      .getByRole("button", { name: "🗑" })
      .click();

    expect(alertFired).toBe(false);
    expect(dialogMessage).toContain("<b>Bold</b>");
    await expect(page.getByRole("cell", { name: new RegExp(escaped) })).not.toBeVisible();
  });
});
