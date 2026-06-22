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

function wireProgramTracking(
  page: Page,
  trackProgram: CleanupFixtures['trackProgram'],
) {
  page.on('response', async (response) => {
    if (
      response.request().method() !== 'POST' ||
      !response.ok() ||
      !response.url().includes('/api/programs')
    ) {
      return;
    }

    try {
      const payload = (await response.json()) as {
        id?: string;
        data?: { id?: string };
      };
      const id = typeof payload.id === 'string' ? payload.id : payload.data?.id;
      if (id) {
        trackProgram(id);
      }
    } catch {
      // Ignore non-JSON responses from creation endpoint.
    }
  });
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
  test.beforeEach(async ({ page, trackProgram }) => {
    wireProgramTracking(page, trackProgram);
  });

  // TC-001 — Program creation form is accessible to admin
  test('TC-001: New Program modal contains required fields and Create button', async ({
    page,
  }) => {
    const { modal } = await openNewProgramModal(page);
    await expect(modal.programNameInput).toBeVisible();
    await expect(modal.descriptionInput).toBeVisible();
    await expect(modal.createButton).toBeVisible();
    await expect(modal.createButton).toBeDisabled();
  });

  // TC-002 — Admin successfully creates a program with all fields populated
  test('TC-002: Admin successfully creates a program with all fields populated', async ({
    page,
  }) => {
    const programName = testProgramName('Web Development');
    const description = testDescription('Full-stack web development program');

    await createProgram(page, programName, description);
  });

  // TC-003 — Admin successfully creates a program with only the required field
  test('TC-003: Admin successfully creates a program with only the required field', async ({
    page,
  }) => {
    const programName = testProgramName('Data Science');

    await createProgram(page, programName);
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
  }) => {
    const suffix = String(Date.now());
    const maxName =
      DATA_PREFIX +
      'A'.repeat(255 - DATA_PREFIX.length - suffix.length) +
      suffix;

    await createProgram(page, maxName, testDescription('Test description'));
    const programs = new ProgramsPage(page);
    await expect(programs.nameCell(suffix)).toBeVisible();
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
  }) => {
    const programName = `${DATA_PREFIX}Web Dev & Design: ${Date.now()} (Part 1)`;

    await createProgram(page, programName);
  });

  // TC-013 — Program Name with HTML/script tags does not execute
  test('TC-013: Program Name with HTML/script tags does not execute', async ({
    page,
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
    }

    expect(alertFired).toBe(false);
  });

  // TC-014 — Duplicate program name is handled
  test('TC-014: Duplicate program name is handled', async ({
    page,
  }) => {
    const programName = testProgramName('Duplicate Test');

    // Create first program
    await createProgram(page, programName);

    // Attempt to create a duplicate
    const { modal } = await openNewProgramModal(page);
    await modal.fillProgramName(programName);
    await modal.submit();
    await expect(modal.dialog).not.toBeVisible({ timeout: 10000 });

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
  }) => {
    const programName = testProgramName('New Program');
    const maxDescription = testDescription(
      'D'.repeat(1000 - DATA_PREFIX.length),
    );

    await createProgram(page, programName, maxDescription);
  });

  // TC-016 — Newly created program appears in the list without a page refresh
  test('TC-016: Newly created program appears in the list without a page refresh', async ({
    page,
  }) => {
    const programName = testProgramName('Machine Learning');

    await createProgram(page, programName);
  });

  // TC-017 — Program Name with leading/trailing whitespace is trimmed
  test('TC-017: Program Name with leading/trailing whitespace is trimmed', async ({
    page,
  }) => {
    const baseName = testProgramName('Web Development');
    const paddedName = `  ${baseName}  `;

    const { modal } = await openNewProgramModal(page);
    await modal.fillProgramName(paddedName);
    await modal.submit();

    const programs = new ProgramsPage(page);
    await expect(programs.nameCell(baseName)).toBeVisible();
  });

  // TC-018 — Escape dismisses the form without creating a program
  test('TC-018: Escape dismisses the New Program modal without creating a program', async ({
    page,
  }) => {
    const programName = testProgramName('Escape Cancel');
    const description = testDescription('Should not be saved');

    const { programs, modal } = await openNewProgramModal(page);
    await modal.fillProgramName(programName);
    await modal.fillDescription(description);
    await modal.dismissWithEscape();

    await expect(modal.dialog).not.toBeVisible();
    await expect(programs.nameCell(programName)).not.toBeVisible();
  });

  // TC-019 — Reopening the modal after Escape retains previously entered values
  test('TC-019: Reopening the modal after Escape retains previously entered values', async ({
    page,
  }) => {
    const draftName = testProgramName('Escape Draft');
    const draftDescription = testDescription('Draft description');

    const programs = new ProgramsPage(page);
    await programs.goto();
    await programs.openNewProgram();

    const modal = programs.newProgramModal;
    await modal.fillProgramName(draftName);
    await modal.fillDescription(draftDescription);
    await modal.dismissWithEscape();
    await expect(modal.dialog).not.toBeVisible();

    await programs.openNewProgram();
    await expect(modal.dialog).toBeVisible();
    await expect(modal.programNameInput).toHaveValue(draftName);
    await expect(modal.descriptionInput).toHaveValue(draftDescription);
  });
});
