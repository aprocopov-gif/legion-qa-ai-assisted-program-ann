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

test.describe('DS-3: Program Name Validation', () => {
  test.beforeEach(async ({ page, trackProgram }) => {
    wireProgramTracking(page, trackProgram);
  });

  // TC-001 — Program name with special characters is accepted and rendered correctly
  test('TC-001: Program name with special characters is accepted and rendered correctly', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const programName = `${DATA_PREFIX}Informatique & IA - Niveau ${Date.now()}`;
    const description = testDescription('Program with special characters');

    await createProgram(page, programName, description);
    const cell = programs.nameCell(programName);
    await expect(cell).toBeVisible();
    await expect(cell).not.toContainText('&amp;');
  });

  // TC-002 — Program name with alphanumeric characters and spaces is accepted
  test('TC-002: Program name with alphanumeric characters and spaces is accepted', async ({
    page,
  }) => {
    const programName = testProgramName('Web Development 2026');
    const description = testDescription('Full-stack web development program');
    await createProgram(page, programName, description);
  });

  // TC-003 — Program name with leading and trailing whitespace is trimmed and saved
  test('TC-003: Program name with leading/trailing whitespace is trimmed and saved', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const baseName = testProgramName('Data Science 2026');
    const paddedName = `  ${baseName}  `;
    const description = testDescription('Data science curriculum');

    const { modal } = await openNewProgramModal(page);
    await modal.fillProgramName(paddedName);
    await modal.fillDescription(description);
    await modal.submit();
    await expect(modal.dialog).not.toBeVisible();
    await expect(programs.nameCell(baseName)).toBeVisible();
    await expect(programs.nameCell(paddedName)).not.toBeVisible();
  });

  // TC-004 — A name previously used by a deleted program can be reused
  test('TC-004: A name previously used by a deleted program can be reused', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const programName = testProgramName('Reuse Test');
    const description = testDescription('Reused program name after deletion');

    // Create program to delete
    await createProgram(page, programName, testDescription('Temporary program'));

    // Delete program
    await programs.goto();
    page.once('dialog', (dialog) => dialog.accept());
    await programs.deleteButton(programName).click();
    await expect(programs.nameCell(programName)).not.toBeVisible();

    // Reuse the same name
    await programs.openNewProgram();
    const modal = programs.newProgramModal;
    await modal.fillProgramName(programName);
    await modal.fillDescription(description);
    await modal.submit();

    await expect(programs.nameCell(programName)).toBeVisible();
  });

  // TC-005 — Program name consisting only of whitespace is rejected
  test('TC-005: Program name consisting only of whitespace is rejected', async ({
    page,
  }) => {
    const { modal } = await openNewProgramModal(page);
    await modal.fillProgramName('   ');
    await modal.fillDescription(testDescription('Description should not matter'));
    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
  });

  // TC-006 — Empty Program Name field prevents form submission
  test('TC-006: Empty Program Name field prevents form submission', async ({
    page,
  }) => {
    const { modal } = await openNewProgramModal(page);
    await modal.fillDescription(testDescription('Description without program name'));
    await expect(modal.programNameInput).toBeEmpty();
    await expect(modal.createButton).toBeDisabled();
  });

  // TC-007 — Duplicate program name (exact match) is rejected with an error message
  // test.fail() documents a known app defect: duplicate creation succeeds instead of being rejected
  test.fail(
    'TC-007: Duplicate program name is rejected with an error message',
    async ({ page }) => {
      const programName = testProgramName('Duplicate Test');
      const description = testDescription('Attempted duplicate program');
      const programs = new ProgramsPage(page);

      // Create first program
      await createProgram(page, programName, testDescription('Original program'));

      // Attempt duplicate
      await programs.openNewProgram();
      const modal = programs.newProgramModal;
      await modal.fillProgramName(programName);
      await modal.fillDescription(description);
      await modal.submit();

      const errorVisible = await programs.alert.isVisible().catch(() => false);
      const duplicateRows = programs.nameCells(programName);
      const rowCount = await duplicateRows.count();

      expect(errorVisible).toBe(true);
      expect(rowCount).toBe(1);
    },
  );

  // TC-008 — Duplicate-name error message is specific and actionable
  // test.fail() documents a known app defect: no duplicate error message is shown
  test.fail(
    'TC-008: Duplicate-name error message is specific and actionable',
    async ({ page }) => {
      const programName = testProgramName('Duplicate Error Test');
      const programs = new ProgramsPage(page);

      await createProgram(page, programName, testDescription('Original program'));

      await programs.openNewProgram();
      const modal = programs.newProgramModal;
      await modal.fillProgramName(programName);
      await modal.fillDescription(testDescription('Second duplicate attempt'));
      await modal.submit();

      const alert = programs.alert;
      await expect(alert).toBeVisible();
      const alertText = await alert.textContent();
      expect(alertText?.toLowerCase()).not.toContain('something went wrong');
      expect(alertText?.toLowerCase()).toMatch(/already exists|duplicate/);
    },
  );

  // TC-009 — Non-admin user cannot access the program creation form
  test('TC-009: Non-admin user cannot access the program creation form', async ({
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

  // TC-010 — Program name consisting only of tab characters is rejected
  test('TC-010: Program name consisting only of tab characters is rejected', async ({
    page,
  }) => {
    const { modal } = await openNewProgramModal(page);
    await modal.fillProgramName('\t');
    await modal.fillDescription(testDescription('Tab-only name test'));

    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
  });

  // TC-011 — Program name with a mix of spaces and tabs is rejected
  test('TC-011: Program name with a mix of spaces and tabs is rejected', async ({
    page,
  }) => {
    const { modal } = await openNewProgramModal(page);
    await modal.fillProgramName(' \t  \t ');
    await modal.fillDescription(testDescription('Mixed whitespace name test'));

    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
  });

  // TC-012 — Single-character program name is accepted
  test('TC-012: Single-character program name is accepted', async ({
    page,
  }) => {
    const programName = `${DATA_PREFIX}A${Date.now()}`;
    const description = testDescription('Single character program name');
    await createProgram(page, programName, description);
  });

  // TC-013 — Program name at the maximum allowed length is accepted
  test('TC-013: Program name at maximum allowed length is accepted', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const suffix = String(Date.now());
    const maxName =
      DATA_PREFIX +
      'A'.repeat(255 - DATA_PREFIX.length - suffix.length) +
      suffix;

    await createProgram(page, maxName, testDescription('Max length program name test'));

    await expect(programs.nameCell(maxName)).toBeVisible();
    expect(maxName.length).toBe(255);
  });

  // TC-014 — Program name exceeding maximum allowed length is rejected or truncated
  // test.fail() documents a known app defect: the field accepts >255 chars without truncation or error
  test.fail(
    'TC-014: Program name exceeding maximum allowed length is rejected or truncated',
    async ({ page }) => {
      const overLimitName = DATA_PREFIX + 'A'.repeat(256 - DATA_PREFIX.length);
      const { modal } = await openNewProgramModal(page);
      const nameField = modal.programNameInput;
      await nameField.fill(overLimitName);

      const actualValue = await nameField.inputValue();
      const createBtn = modal.createButton;
      const isDisabled = await createBtn.isDisabled();

      expect(actualValue.length <= 255 || isDisabled).toBe(true);
    },
  );

  // TC-015 — Program name with HTML/script tags is stored and displayed as plain text
  test('TC-015: Program name with HTML/script tags does not execute', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    let alertFired = false;
    page.on('dialog', (dialog) => {
      alertFired = true;
      dialog.dismiss();
    });

    const programName = `${DATA_PREFIX}<script>alert('xss')</script>`;
    const description = testDescription('XSS prevention test description');

    const { modal } = await openNewProgramModal(page);
    await modal.fillProgramName(programName);
    await modal.fillDescription(description);

    const createBtn = modal.createButton;
    if (await createBtn.isEnabled()) {
      await createBtn.click();
      await expect(modal.dialog).not.toBeVisible();
      await expect(programs.nameCell(programName)).toBeVisible();
    }

    expect(alertFired).toBe(false);
  });

  // TC-016 — Duplicate check behavior is consistent for case-variant names
  test('TC-016: Duplicate check is consistent for case-variant names', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const programName = testProgramName('Case Test');
    const caseVariant = programName.toLowerCase();
    await createProgram(page, programName, testDescription('Original case-sensitive test'));

    async function attemptCaseVariantDuplicate() {
      await programs.openNewProgram();
      const modal = programs.newProgramModal;
      await modal.fillProgramName(caseVariant);
      await modal.fillDescription(testDescription('Case variant duplicate test'));
      await modal.submit();
      await expect(modal.dialog).not.toBeVisible({ timeout: 10000 });

      const errorVisible = await programs.alert.isVisible().catch(() => false);
      const duplicateRows = programs.nameCellsByPattern(new RegExp(programName, 'i'));
      const rowCount = await duplicateRows.count();
      return { errorVisible, rowCount };
    }

    const firstAttempt = await attemptCaseVariantDuplicate();
    expect(firstAttempt.errorVisible || firstAttempt.rowCount >= 1).toBe(true);

    const secondAttempt = await attemptCaseVariantDuplicate();
    expect(firstAttempt.errorVisible).toBe(secondAttempt.errorVisible);
  });

  // TC-017 — Program name with Unicode and multilingual characters is accepted
  test('TC-017: Program name with Unicode and multilingual characters is accepted', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const programName = `${DATA_PREFIX}Programmation C++ — Niveau 3 (${Date.now()}) 高级`;
    const description = testDescription('Multilingual program name test');

    await createProgram(page, programName, description);
    const cell = programs.nameCell(programName);
    await expect(cell).toBeVisible();
    await expect(cell).not.toContainText('?');
  });

  // TC-018 — Duplicate name validation is enforced server-side after a page reload
  // test.fail() documents a known app defect: duplicate passes even after reload (no server-side check)
  test.fail(
    'TC-018: Duplicate name validation is enforced after a page reload',
    async ({ page }) => {
      const programName = testProgramName('Reload Dup Test');
      const programs = new ProgramsPage(page);
      await createProgram(page, programName, testDescription('Original program'));

      await page.reload();
      await page.waitForURL(`${BASE_URL}/programs`);

      await programs.openNewProgram();
      const modal = programs.newProgramModal;
      await modal.fillProgramName(programName);
      await modal.fillDescription(testDescription('Server-side duplicate check test'));
      await modal.submit();

      const errorVisible = await programs.alert.isVisible().catch(() => false);
      const duplicateRows = programs.nameCells(programName);
      const rowCount = await duplicateRows.count();

      expect(errorVisible).toBe(true);
      expect(rowCount).toBe(1);
    },
  );

  // TC-019 — Program name consisting only of numeric characters is accepted
  test('TC-019: Program name consisting only of numeric characters is accepted', async ({
    page,
  }) => {
    const programName = `${DATA_PREFIX}2026${Date.now()}`;
    const description = testDescription('Numeric-only program name test');
    await createProgram(page, programName, description);
  });

  // TC-020 — Rapid double-click on Create does not produce duplicate programs
  // test.fail() documents a known app defect: double-clicking Create submits the form twice
  test.fail(
    'TC-020: Rapid double-click on Create does not produce duplicate programs',
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      const programName = testProgramName('Unique Program Name 001');
      const { modal } = await openNewProgramModal(page);
      await modal.fillProgramName(programName);
      await modal.fillDescription(testDescription('Double-click submit test'));
      await modal.createButton.dblclick();

      await expect(modal.dialog).not.toBeVisible({ timeout: 10000 });

      const duplicateRows = programs.nameCells(programName);
      await expect(duplicateRows.first()).toBeVisible();
      expect(await duplicateRows.count()).toBe(1);
    },
  );
});
