import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import {
  test,
  expect,
  type CleanupFixtures,
} from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/programs.page';

const DATA_PREFIX = 'AP_';
const testProgramName = (label: string) =>
  `${DATA_PREFIX}${label} ${Date.now()}`;

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

async function tabUntilFocused(page: Page, target: Locator, maxTabs = 25) {
  for (let i = 0; i < maxTabs; i += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) {
      return;
    }
    await page.keyboard.press('Tab');
  }
}

test.describe('Programs accessibility', () => {
  test.beforeEach(async ({ page, trackProgram }) => {
    wireProgramTracking(page, trackProgram);
  });

  // TC-A11Y-001 — Programs list page passes automated WCAG scan
  // test.fail() documents known demo-app contrast issues in sidebar and page subtitle
  test.fail(
    'TC-A11Y-001: Programs list page has no WCAG 2.x violations',
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      await programs.goto();
      await expect(programs.heading).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    },
  );

  // TC-A11Y-002 — New Program flow is keyboard operable
  test('TC-A11Y-002: New Program modal opens and submits via keyboard', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const programName = testProgramName('Keyboard Program');
    const modal = programs.newProgramModal;

    await programs.goto();
    await page.keyboard.press('Tab');
    await tabUntilFocused(page, programs.newProgramButton);
    await expect(programs.newProgramButton).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(modal.dialog).toBeVisible();
    await tabUntilFocused(page, modal.programNameInput);
    await expect(modal.programNameInput).toBeFocused();

    await page.keyboard.type(programName);
    await expect(modal.createButton).toBeEnabled();
    await tabUntilFocused(page, modal.createButton);
    await expect(modal.createButton).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(modal.dialog).not.toBeVisible();
    await expect(programs.nameParagraph(programName)).toBeVisible();
  });

  // TC-A11Y-003 — Row actions expose accessible names screen readers can announce
  test('TC-A11Y-003: Program row Edit and Delete buttons have accessible names', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const programName = testProgramName('Accessible Actions');

    await programs.goto();
    await programs.openNewProgram();
    const modal = programs.newProgramModal;
    await modal.fillProgramName(programName);
    await modal.submit();
    await expect(modal.dialog).not.toBeVisible();

    await expect.soft(programs.editButton(programName)).toBeVisible();
    await expect.soft(programs.deleteButton(programName)).toBeVisible();
    await expect.soft(programs.editButton(programName)).toBeEnabled();
    await expect.soft(programs.deleteButton(programName)).toBeEnabled();
  });

  // TC-A11Y-004 — Open New Program modal passes automated WCAG scan
  // test.fail() documents known demo-app bug: modal close button lacks an accessible name
  test.fail(
    'TC-A11Y-004: New Program modal has no WCAG 2.x violations',
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      await programs.goto();
      await programs.openNewProgram();
      await expect(programs.newProgramModal.dialog).toBeVisible();

      const results = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    },
  );
});
