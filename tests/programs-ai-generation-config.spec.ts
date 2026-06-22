import {
  test,
  expect,
  type CleanupFixtures,
} from '../fixtures/cleanup.fixture';
import type { Page } from '@playwright/test';
import { ProgramsPage } from '../pages/programs.page';

const DATA_PREFIX = 'AP_';
const testProgramName = (label: string) =>
  `${DATA_PREFIX}${label} ${Date.now()}`;
const testDescription = (text: string) => `${DATA_PREFIX}${text}`;

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

test.describe('Programs: AI Generation Config', () => {
  test.beforeEach(async ({ page, trackProgram }) => {
    wireProgramTracking(page, trackProgram);
  });

  test('TC-001: Expanding AI Generation Config reveals optional curriculum fields', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    await programs.goto();
    await programs.openNewProgram();

    const modal = programs.newProgramModal;
    await expect(modal.aiConfigToggle).toHaveText(/Show AI Generation Config/i);

    await modal.expandAiConfig();

    await expect(modal.aiConfigToggle).toHaveText(/Hide AI Generation Config/i);
    await expect(modal.totalProgramHoursInput).toBeVisible();
    await expect(modal.defaultSessionHoursInput).toBeVisible();
    await expect(modal.defaultExamHoursInput).toBeVisible();
    await expect(modal.targetAudienceInput).toBeVisible();
    await expect(modal.focusAreasInput).toBeVisible();
    await expect(modal.syncAsyncRatioLabel).toHaveText(
      /Sync\/Async Ratio: 70% sync \/ 30% async/,
    );
  });

  test('TC-002: Collapsing AI Generation Config restores the expand toggle label', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    await programs.goto();
    await programs.openNewProgram();

    const modal = programs.newProgramModal;
    await modal.expandAiConfig();
    await expect(modal.aiConfigToggle).toHaveText(/Hide AI Generation Config/i);

    await modal.collapseAiConfig();

    await expect(modal.aiConfigToggle).toHaveText(/Show AI Generation Config/i);
  });

  test('TC-003: Admin creates a program with AI Generation Config fields populated', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const programName = testProgramName('AI Curriculum');
    const description = testDescription('Program with AI generation settings');
    const targetAudience = testDescription('Career changers entering QA');
    const focusAreas = testDescription('Playwright, API testing, Accessibility');

    await programs.goto();
    await programs.openNewProgram();

    const modal = programs.newProgramModal;
    await modal.fillProgramName(programName);
    await modal.fillDescription(description);
    await modal.expandAiConfig();
    await modal.fillTotalProgramHours('120');
    await modal.fillTargetAudience(targetAudience);
    await modal.fillFocusAreas(focusAreas);
    await modal.submit();

    await expect(modal.dialog).not.toBeVisible();
    await expect(programs.nameParagraph(programName)).toBeVisible();
    await expect(programs.descriptionParagraph(programName)).toHaveText(
      description,
    );
  });
});
