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

function programNameCell(page: Page, name: string) {
  return page.getByRole("cell", { name: new RegExp(esc(name)) }).first();
}

function programRow(page: Page, name: string) {
  return programRowsByName(page, name);
}

function programRowsByName(page: Page, name: string) {
  return page.getByRole("row", { name: new RegExp(esc(name)) });
}

function programNameParagraph(page: Page, name: string) {
  return programRowsByName(page, name).first().getByRole("cell").first().locator("p").first();
}

function programDescParagraph(page: Page, name: string) {
  return programRowsByName(page, name).first().getByRole("cell").first().locator("p").nth(1);
}

async function createProgram(page: Page, name: string, description = "") {
  await page.goto(`${BASE_URL}/programs`);
  await page.getByRole("button", { name: "+ New Program" }).click();
  const modal = page.getByRole("dialog", { name: "New Program" });
  await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
  if (description) {
    await modal.getByRole("textbox", { name: "Description" }).fill(description);
  }
  await modal.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("dialog", { name: "New Program" })).not.toBeVisible();
  await expect(programNameCell(page, name).first()).toBeVisible();
}

async function getRelativeOrder(page: Page, names: string[]) {
  const positions = await Promise.all(
    names.map(async (name) => ({
      name,
      y: (await programRowsByName(page, name).first().boundingBox())?.y ?? -1,
    }))
  );
  return positions
    .filter((entry) => entry.y >= 0)
    .sort((a, b) => a.y - b.y)
    .map((entry) => entry.name);
}

test.describe("DS-5: Program List Display", () => {
  test.beforeEach(async ({ page, trackProgram }) => {
    wireProgramTracking(page, trackProgram);
  });

  // TC-001 — Programs page shows each program's name and description
  test("TC-001: Programs page shows each program's name and description", async ({ page }) => {
    const nameA = testProgramName("Web Development 2026");
    const nameB = testProgramName("Data Science 2026");
    const descA = testDescription("Full-stack web development curriculum");
    const descB = testDescription("Applied machine learning and statistics");

    await createProgram(page, nameA, descA);
    await createProgram(page, nameB, descB);

    await page.goto(`${BASE_URL}/programs`);

    await expect(programNameParagraph(page, nameA)).toHaveText(nameA);
    await expect(programDescParagraph(page, nameA)).toHaveText(descA);
    await expect(programNameParagraph(page, nameB)).toHaveText(nameB);
    await expect(programDescParagraph(page, nameB)).toHaveText(descB);
  });

  // TC-002 — Empty state message and create prompt are shown when no programs exist
  // NOTE: Cannot guarantee a truly empty environment; skips if other programs exist
  test("TC-002: Empty state is shown when no programs exist", async ({ page }) => {
    await page.goto(`${BASE_URL}/programs`);
    const tableVisible = await page.getByRole("table").isVisible().catch(() => false);

    if (tableVisible) {
      const rowCount = await page.getByRole("row").count();
      if (rowCount > 1) {
        test.skip(true, "Other programs exist — clean environment required for this test");
        return;
      }
    }

    const emptyIndicator = page.getByText(/no programs|create your first/i);
    const tableGone = !(await page.getByRole("table").isVisible().catch(() => false));
    expect(tableGone || (await emptyIndicator.isVisible().catch(() => false))).toBe(true);
    await expect(page.getByRole("button", { name: "+ New Program" })).toBeVisible();
  });

  // TC-003 — A single program is displayed correctly in the program list
  test("TC-003: A single program is displayed with its name and description", async ({ page }) => {
    const name = testProgramName("Test Program");
    const description = testDescription("A test program for QA purposes");
    await createProgram(page, name, description);

    await page.goto(`${BASE_URL}/programs`);

    await expect(programRow(page, name)).toHaveCount(1);
    await expect(programNameParagraph(page, name)).toHaveText(name);
    await expect(programDescParagraph(page, name)).toHaveText(description);
    await expect(page.getByText(/no programs|create your first/i)).not.toBeVisible();
  });

  // TC-004 — Newly created program appears in the list without requiring a manual reload
  test("TC-004: Newly created program appears in the list without a page reload", async ({ page }) => {
    const name = testProgramName("Data Science 2026");
    const description = testDescription("Applied machine learning and statistics");

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();
    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
    await modal.getByRole("textbox", { name: "Description" }).fill(description);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("dialog", { name: "New Program" })).not.toBeVisible();
    await expect(programRow(page, name)).toHaveCount(1);
    await expect(programNameParagraph(page, name)).toHaveText(name);
    await expect(programDescParagraph(page, name)).toHaveText(description);
  });

  // TC-005 — Empty state is replaced by the program list after the first program is created
  test("TC-005: Program list appears after a program is created", async ({ page }) => {
    const name = testProgramName("Test Program");
    const description = testDescription("A test program");

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();
    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
    await modal.getByRole("textbox", { name: "Description" }).fill(description);
    await modal.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("dialog", { name: "New Program" })).not.toBeVisible();
    await expect(programRow(page, name)).toHaveCount(1);
    await expect(programNameParagraph(page, name)).toHaveText(name);
    await expect(programDescParagraph(page, name)).toHaveText(description);
    await expect(page.getByText(/no programs|create your first/i)).not.toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
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

    await expect(programRow(page, nameA)).toHaveCount(1);
    await expect(programRow(page, nameB)).toHaveCount(1);
    await expect(programNameParagraph(page, nameA)).toHaveText(nameA);
    await expect(programNameParagraph(page, nameB)).toHaveText(nameB);
    await expect(programDescParagraph(page, nameA)).toHaveText(descA);
    await expect(programDescParagraph(page, nameB)).toHaveText(descB);
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
    await page.waitForURL(`${BASE_URL}/`);
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

    await expect(programRow(page, name)).toHaveCount(1);
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByText(/no programs|create your first/i)).not.toBeVisible();
  });

  // TC-011 — Program with a maximum-length name is displayed without overflow
  test("TC-011: Program with a maximum-length name is displayed without layout breakage", async ({ page }) => {
    const suffix = String(Date.now());
    const maxName = DATA_PREFIX + "A".repeat(255 - DATA_PREFIX.length - suffix.length) + suffix;
    const description = testDescription("Edge case program");

    await createProgram(page, maxName, description);
    await page.goto(`${BASE_URL}/programs`);

    await expect(programRow(page, maxName)).toHaveCount(1);
    await expect(programNameParagraph(page, maxName)).toHaveText(maxName);
    await expect(programDescParagraph(page, maxName)).toHaveText(description);
    await expect(programRow(page, maxName).first().getByRole("cell").first()).toBeVisible();
  });

  // TC-012 — Program with a maximum-length description is displayed without layout breakage
  test("TC-012: Program with a maximum-length description is displayed without layout breakage", async ({ page }) => {
    const name = testProgramName("Test Program");
    const maxDesc = testDescription("B".repeat(500 - DATA_PREFIX.length));

    await createProgram(page, name, maxDesc);
    await page.goto(`${BASE_URL}/programs`);

    await expect(programRow(page, name)).toHaveCount(1);
    await expect(programDescParagraph(page, name)).toHaveText(maxDesc);
    await expect(programRow(page, name).first().getByRole("cell").first()).toBeVisible();
  });

  // TC-013 — Program with special characters is displayed correctly (no HTML encoding)
  test("TC-013: Program with special characters is displayed without encoding artifacts", async ({ page }) => {
    const name = `${DATA_PREFIX}Informatique & IA - Niveau 2 ${Date.now()}`;
    const description = testDescription("Cours d'IA & ML: niveau avancé (100%)");

    await createProgram(page, name, description);
    await page.goto(`${BASE_URL}/programs`);

    await expect(programNameParagraph(page, name)).toHaveText(name);
    await expect(programNameParagraph(page, name)).not.toContainText("&amp;");
    await expect(programDescParagraph(page, name)).toHaveText(description);
  });

  // TC-014 — Program with HTML/script tags is rendered as plain text
  test("TC-014: Program name and description with HTML tags are rendered as plain text", async ({ page }) => {
    let alertFired = false;
    page.on("dialog", (dialog) => {
      alertFired = true;
      dialog.dismiss();
    });

    const name = `${DATA_PREFIX}<b>Bold Program</b> ${Date.now()}`;
    const description = `<script>alert('xss')</script>`;

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("button", { name: "+ New Program" }).click();
    const modal = page.getByRole("dialog", { name: "New Program" });
    await modal.getByRole("textbox", { name: "Program Name" }).fill(name);
    await modal.getByRole("textbox", { name: "Description" }).fill(description);
    await modal.getByRole("button", { name: "Create" }).click();
    await expect(page.getByRole("dialog", { name: "New Program" })).not.toBeVisible();

    await page.goto(`${BASE_URL}/programs`);
    await expect(programNameCell(page, name).first()).toBeVisible();
    await expect(programNameParagraph(page, name)).toHaveText(name);
    await expect(programDescParagraph(page, name)).toHaveText(description);
    await expect(programRowsByName(page, name).first().locator("b")).toHaveCount(0);
    await expect(programRowsByName(page, name).first().locator("script")).toHaveCount(0);
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
    await expect(page.getByRole("dialog", { name: "New Program" })).not.toBeVisible();

    await page.goto(`${BASE_URL}/programs`);
    await expect(programRow(page, name)).toHaveCount(1);

    const descParagraph = programDescParagraph(page, name);
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

    await expect(programRow(page, name)).toHaveCount(1);
    await expect(programNameParagraph(page, name)).toHaveText(name);

    const descParagraph = programDescParagraph(page, name);
    const hasDesc = await descParagraph.isVisible().catch(() => false);
    if (hasDesc) {
      const text = (await descParagraph.textContent()) ?? "";
      expect(text.trim()).toBe("");
    }
  });

  // TC-017 — Program list with multiple programs loads within acceptable time
  test("TC-017: Program list with multiple programs loads within 5 seconds", async ({ page }) => {
    const names: string[] = [];
    for (let i = 0; i < 10; i++) {
      const name = testProgramName(`Perf Program ${i}`);
      names.push(name);
      await createProgram(page, name);
    }

    const start = Date.now();
    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("table").waitFor({ state: "visible" });
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(5000);
    for (const name of names) {
      await expect(programRow(page, name)).toHaveCount(1);
    }
  });

  // TC-018 — Program with Unicode and multilingual characters is displayed correctly
  test("TC-018: Program with Unicode and multilingual characters is displayed correctly", async ({ page }) => {
    const name = `${DATA_PREFIX}Programmation C++ — Niveau 3 (高级) ${Date.now()}`;
    const description = testDescription("面向对象编程 & algorithms");

    await createProgram(page, name, description);
    await page.goto(`${BASE_URL}/programs`);

    await expect(programRow(page, name)).toHaveCount(1);
    await expect(programNameParagraph(page, name)).toHaveText(name);
    await expect(programDescParagraph(page, name)).toHaveText(description);
  });

  // TC-019 — Two programs with identical names are both displayed in the list
  test("TC-019: Two programs with identical names are both shown as separate rows", async ({ page }) => {
    const name = testProgramName("Data Science 2026");
    const descA = testDescription("First duplicate entry");
    const descB = testDescription("Second duplicate entry");

    await createProgram(page, name, descA);
    await createProgram(page, name, descB);

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("table").waitFor({ state: "visible" });

    const duplicateRows = programRowsByName(page, name);
    await expect(duplicateRows).toHaveCount(2);
    await expect(duplicateRows.filter({ hasText: descA })).toHaveCount(1);
    await expect(duplicateRows.filter({ hasText: descB })).toHaveCount(1);
  });

  // TC-020 — Programs list order is consistent across page reloads
  test("TC-020: Programs list order is consistent across page reloads", async ({ page }) => {
    const names = [
      testProgramName("Order Alpha"),
      testProgramName("Order Beta"),
      testProgramName("Order Gamma"),
    ];
    for (const name of names) {
      await createProgram(page, name);
    }

    await page.goto(`${BASE_URL}/programs`);
    await page.getByRole("table").waitFor({ state: "visible" });
    const orderBefore = await getRelativeOrder(page, names);

    await page.reload();
    await page.waitForURL(`${BASE_URL}/programs`);
    await page.getByRole("table").waitFor({ state: "visible" });

    const orderAfter = await getRelativeOrder(page, names);
    expect(orderBefore).toEqual(orderAfter);
    expect(orderBefore).toHaveLength(3);
  });
});

test.describe("DS-5: Program List Display — unauthenticated access", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  // TC-007 — Unauthenticated user is redirected away from the Programs page
  test("TC-007: Unauthenticated user is redirected to the login page", async ({ page }) => {
    await page.goto(`${BASE_URL}/programs`);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("table")).not.toBeVisible();
  });
});
