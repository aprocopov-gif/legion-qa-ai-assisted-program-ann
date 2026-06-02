import type { Locator, Page } from '@playwright/test';

export class EditProgramModal {
  readonly dialog: Locator;
  readonly programNameInput: Locator;
  readonly descriptionInput: Locator;
  readonly cancelButton: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Edit Program' });
    this.programNameInput = this.dialog.getByRole('textbox', {
      name: 'Program Name',
    });
    this.descriptionInput = this.dialog.getByRole('textbox', {
      name: 'Description',
    });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.saveButton = this.dialog.getByRole('button', { name: 'Save' });
  }

  async fillProgramName(name: string) {
    await this.programNameInput.fill(name);
  }

  async fillDescription(description: string) {
    await this.descriptionInput.fill(description);
  }

  async submit() {
    await this.saveButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
