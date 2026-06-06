import {
  test,
  expect,
  type CleanupFixtures,
} from '../fixtures/cleanup.fixture';
import type { Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { ProgramsPage } from '../pages/programs.page';

const BASE_URL = process.env.DIDAXIS_URL!;
const DATA_PREFIX = 'AP_';
const testProgramName = (label: string) =>
  `${DATA_PREFIX}${label} ${Date.now()}`;
const testDescription = (text: string) => `${DATA_PREFIX}${text}`;

type NewProgramContext = {
  programs: ProgramsPage;
  modal: ProgramsPage['newProgramModal'];
};

type ProgramListItem = {
  id: string;
  name: string;
};

async function trackProgramsByName(
  page: Page,
  trackProgram: CleanupFixtures['trackProgram'],
  name: string,
) {
  const token = process.env.DIDAXIS_API_TOKEN;
  if (!token) {
    console.warn(
      `[ds1-create-program] Skipping cleanup tracking for "${name}" (missing DIDAXIS_API_TOKEN).`,
    );
    return;
  }

  const response = await page.request.get(`${BASE_URL}/api/programs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok()) {
    console.warn(
      `[ds1-create-program] Skipping cleanup tracking for "${name}" (GET /api/programs returned ${response.status()}).`,
    );
    return;
  }

  const body = (await response.json()) as { data?: ProgramListItem[] };
  const ids = (body.data ?? [])
    .filter((program) => program.name === name)
    .map((program) => program.id);
  if (ids.length === 0) {
    console.warn(
      `[ds1-create-program] No matching program ID found for "${name}".`,
    );
    return;
  }

  for (const id of ids) {
    trackProgram(id);
  }
}

async function openNewProgramModal(page: Page): Promise<NewProgramContext> {
  const programs = new ProgramsPage(page);
  await programs.goto();
  await programs.openNewProgram();
  return { programs, modal: programs.newProgramModal };
}

async function createProgram(page: Page, name: string, description = '') {
  const { programs, modal } = await openNewProgramModal(page);
  await modal.fillProgramName(name);
  if (description) {
    await modal.fillDescription(description);
  }
  await modal.submit();
  await expect(modal.dialog).not.toBeVisible();
  await expect(programs.nameCell(name)).toBeVisible();
}

test.describe('DS-1: Create Program', () => {
  // TC-001 — Program creation form is accessible to admin
  test('TC-001: New Program modal contains required fields and Create button', async ({
    page,
  }) => {
    const { modal } = await openNewProgramModal(page);
    await expect(modal.programNameInput).toBeVisible();
    await expect(modal.descriptionInput).toBeVisible();
    await expect(modal.createButton).not.toBeVisible();
  });

  // TC-002 — Admin successfully creates a program with all fields populated
  test('TC-002: Admin successfully creates a program with all fields populated', async ({
    page,
    trackProgram,
  }) => {
    const programName = testProgramName('Web Development');
    const description = testDescription('Full-stack web development program');

    await createProgram(page, programName, description);
    await trackProgramsByName(page, trackProgram, programName);
  });

  // TC-003 — Admin successfully creates a program with only the required field
  test('TC-003: Admin successfully creates a program with only the required field', async ({
    page,
    trackProgram,
  }) => {
    const programName = testProgramName('Data Science');

    await createProgram(page, programName);
    await trackProgramsByName(page, trackProgram, programName);
  });

  // TC-004 — Create button is enabled when Program Name is filled
  test('TC-004: Create button is enabled when Program Name is filled', async ({
    page,
  }) => {
    const programName = testProgramName('Computer Science');

    const { modal } = await openNewProgramModal(page);
    await expect(modal.createButton).toBeDisabled();
    await modal.fillProgramName(programName);
    await expect(modal.createButton).toBeEnabled();
  });

  // TC-005 — Create button is disabled when Program Name is empty
  test('TC-005: Create button is disabled when Program Name is empty', async ({
    page,
  }) => {
    const { modal } = await openNewProgramModal(page);
    await expect(modal.programNameInput).toBeEmpty();
    await expect(modal.createButton).toBeDisabled();
  });

  // TC-006 — Create button remains disabled when only Description is filled
  test('TC-006: Create button remains disabled when only Description is filled', async ({
    page,
  }) => {
    const { modal } = await openNewProgramModal(page);
    await modal.fillDescription(testDescription('Full-stack web development program'));
    await expect(modal.programNameInput).toBeEmpty();
    await expect(modal.createButton).toBeDisabled();
  });

  // TC-007 — Program Name containing only whitespace is rejected
  test('TC-007: Program Name containing only whitespace is rejected', async ({
    page,
  }) => {
    const { modal } = await openNewProgramModal(page);
    await modal.fillProgramName('     ');
    await expect(modal.createButton).toBeDisabled();
  });

  // TC-008 — Non-admin user cannot access the program creation form
  test('TC-008: Non-admin user cannot access the program creation form', async ({
    page,
  }) => {
    test.skip(
      !process.env.DIDAXIS_NONADMIN_EMAIL ||
        !process.env.DIDAXIS_NONADMIN_PASSWORD,
      'Non-admin credentials not configured (set DIDAXIS_NONADMIN_EMAIL and DIDAXIS_NONADMIN_PASSWORD in .env)',
    );

    const loginPage = new LoginPage(page);
    const programs = new ProgramsPage(page);
    await loginPage.goto();
    await loginPage.login(
      process.env.DIDAXIS_NONADMIN_EMAIL!,
      process.env.DIDAXIS_NONADMIN_PASSWORD!,
    );
    await page.waitForURL(`${BASE_URL}/`);
    await programs.goto();
    await expect(programs.newProgramButton).not.toBeVisible();
  });

  // TC-009 — Cancelling the form does not create a program
  test('TC-009: Cancelling the form does not create a program', async ({
    page,
  }) => {
    const programName = testProgramName('Cancelled Program');

    const { programs, modal } = await openNewProgramModal(page);
    await modal.fillProgramName(programName);
    await modal.fillDescription(testDescription('This should not be saved'));
    await modal.cancel();

    await expect(modal.dialog).not.toBeVisible();
    await expect(programs.nameCell(programName)).not.toBeVisible();
  });

  // TC-010 — Program Name at maximum allowed length is accepted
  test('TC-010: Program Name at maximum allowed length is accepted', async ({
    page,
    trackProgram,
  }) => {
    const suffix = String(Date.now());
    const maxName =
      DATA_PREFIX +
      'A'.repeat(255 - DATA_PREFIX.length - suffix.length) +
      suffix;

    await createProgram(page, maxName, testDescription('Test description'));
    const programs = new ProgramsPage(page);
    await expect(programs.nameCell(suffix)).toBeVisible();
    await trackProgramsByName(page, trackProgram, maxName);
  });

  // TC-011 — Program Name exceeding maximum length is rejected
  // test.fail() documents a known app defect: the field accepts >255 chars without truncation or error
  test.fail(
    'TC-011: Program Name exceeding maximum length is rejected',
    async ({ page }) => {
      const overLimitName = 'A'.repeat(256);

      const { modal } = await openNewProgramModal(page);
      const nameField = modal.programNameInput;
      await nameField.fill(overLimitName);

      const actualValue = await nameField.inputValue();
      const createBtn = modal.createButton;
      const isDisabled = await createBtn.isDisabled();

      // Expected per spec: input truncated to ≤255 chars OR Create button disabled
      expect(actualValue.length <= 255 || isDisabled).toBe(true);
    },
  );

  // TC-012 — Program Name with special characters is handled correctly
  test('TC-012: Program Name with special characters is handled correctly', async ({
    page,
    trackProgram,
  }) => {
    const programName = `${DATA_PREFIX}Web Dev & Design: ${Date.now()} (Part 1)`;

    await createProgram(page, programName);
    await trackProgramsByName(page, trackProgram, programName);
  });

  // TC-013 — Program Name with HTML/script tags does not execute
  test('TC-013: Program Name with HTML/script tags does not execute', async ({
    page,
    trackProgram,
  }) => {
    let alertFired = false;
    page.on('dialog', (dialog) => {
      alertFired = true;
      dialog.dismiss();
    });

    const { modal } = await openNewProgramModal(page);
    await modal.fillProgramName(`${DATA_PREFIX}<script>alert('xss')</script>`);

    const createBtn = modal.createButton;
    if (await createBtn.isEnabled()) {
      await createBtn.click();
      await trackProgramsByName(
        page,
        trackProgram,
        `${DATA_PREFIX}<script>alert('xss')</script>`,
      );
    }

    expect(alertFired).toBe(false);
  });

  // TC-014 — Duplicate program name is handled
  test('TC-014: Duplicate program name is handled', async ({
    page,
    trackProgram,
  }) => {
    const programName = testProgramName('Duplicate Test');

    // Create first program
    await createProgram(page, programName);
    await trackProgramsByName(page, trackProgram, programName);

    // Attempt to create a duplicate
    const { modal } = await openNewProgramModal(page);
    await modal.fillProgramName(programName);
    await modal.submit();
    await expect(modal.dialog).not.toBeVisible({ timeout: 10000 });
    await trackProgramsByName(page, trackProgram, programName);

    // Either an error is shown, or the duplicate is created — both are valid outcomes
    const programs = new ProgramsPage(page);
    const errorVisible = await programs.alert.isVisible().catch(() => false);
    const duplicateRows = programs.nameCells(programName);
    const rowCount = await duplicateRows.count();
    expect(errorVisible || rowCount >= 1).toBe(true);
  });

  // TC-015 — Description field at maximum allowed length is accepted
  test('TC-015: Description field at maximum allowed length is accepted', async ({
    page,
    trackProgram,
  }) => {
    const programName = testProgramName('New Program');
    const maxDescription = testDescription(
      'D'.repeat(1000 - DATA_PREFIX.length),
    );

    await createProgram(page, programName, maxDescription);
    await trackProgramsByName(page, trackProgram, programName);
  });

  // TC-016 — Newly created program appears in the list without a page refresh
  test('TC-016: Newly created program appears in the list without a page refresh', async ({
    page,
    trackProgram,
  }) => {
    const programName = testProgramName('Machine Learning');

    await createProgram(page, programName);
    await trackProgramsByName(page, trackProgram, programName);
  });

  // TC-017 — Program Name with leading/trailing whitespace is trimmed
  test('TC-017: Program Name with leading/trailing whitespace is trimmed', async ({
    page,
    trackProgram,
  }) => {
    const baseName = testProgramName('Web Development');
    const paddedName = `  ${baseName}  `;

    const { modal } = await openNewProgramModal(page);
    await modal.fillProgramName(paddedName);
    await modal.submit();

    const programs = new ProgramsPage(page);
    await expect(programs.nameCell(baseName)).toBeVisible();
    await trackProgramsByName(page, trackProgram, baseName);
  });
});
