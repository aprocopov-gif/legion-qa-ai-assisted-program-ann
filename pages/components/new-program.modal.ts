import type { Locator, Page } from '@playwright/test';

export class NewProgramModal {
  readonly dialog: Locator;
  readonly programNameInput: Locator;
  readonly descriptionInput: Locator;
  readonly cancelButton: Locator;
  readonly createButton: Locator;
  readonly aiConfigToggle: Locator;
  readonly totalProgramHoursInput: Locator;
  readonly defaultSessionHoursInput: Locator;
  readonly defaultExamHoursInput: Locator;
  readonly targetAudienceInput: Locator;
  readonly focusAreasInput: Locator;
  readonly syncAsyncRatioLabel: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'New Program' });
    this.programNameInput = this.dialog.getByRole('textbox', {
      name: 'Program Name',
    });
    this.descriptionInput = this.dialog.getByRole('textbox', {
      name: 'Description',
    });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.createButton = this.dialog.getByRole('button', {
      name: 'Create',
      exact: true,
    });
    this.aiConfigToggle = this.dialog.getByRole('button', {
      name: /AI Generation Config/i,
    });
    this.totalProgramHoursInput = this.dialog.getByLabel('Total Program Hours');
    this.defaultSessionHoursInput = this.dialog.getByLabel(
      'Default Session Hours',
    );
    this.defaultExamHoursInput = this.dialog.getByLabel('Default Exam Hours');
    this.targetAudienceInput = this.dialog.getByLabel('Target Audience');
    this.focusAreasInput = this.dialog.getByLabel('Focus Areas');
    this.syncAsyncRatioLabel = this.dialog.getByText(/Sync\/Async Ratio/i);
  }

  async fillProgramName(name: string) {
    await this.programNameInput.fill(name);
  }

  async fillDescription(description: string) {
    await this.descriptionInput.fill(description);
  }

  async submit() {
    await this.createButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async dismissWithEscape() {
    await this.page.keyboard.press('Escape');
  }

  async expandAiConfig() {
    if ((await this.aiConfigToggle.textContent())?.includes('Show')) {
      await this.aiConfigToggle.click();
    }
  }

  async collapseAiConfig() {
    if ((await this.aiConfigToggle.textContent())?.includes('Hide')) {
      await this.aiConfigToggle.click();
    }
  }

  async fillTotalProgramHours(hours: string) {
    await this.totalProgramHoursInput.fill(hours);
  }

  async fillTargetAudience(audience: string) {
    await this.targetAudienceInput.fill(audience);
  }

  async fillFocusAreas(areas: string) {
    await this.focusAreasInput.fill(areas);
  }
}
