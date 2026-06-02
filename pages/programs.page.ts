import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { AppNavigation } from './components/app-navigation';
import { EditProgramModal } from './components/edit-program.modal';
import { NewProgramModal } from './components/new-program.modal';

export class ProgramsPage extends BasePage {
  readonly navigation: AppNavigation;
  readonly newProgramModal: NewProgramModal;
  readonly editProgramModal: EditProgramModal;

  readonly heading: Locator;
  readonly newProgramButton: Locator;
  readonly createProgramEmptyStateButton: Locator;
  readonly programColumnHeader: Locator;
  readonly table: Locator;
  readonly alert: Locator;
  readonly emptyStateMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.navigation = new AppNavigation(page);
    this.newProgramModal = new NewProgramModal(page);
    this.editProgramModal = new EditProgramModal(page);

    this.heading = page.getByRole('heading', { name: 'Programs' });
    this.newProgramButton = page.getByRole('button', { name: '+ New Program' });
    this.createProgramEmptyStateButton = page.getByRole('button', {
      name: 'Create Program',
    });
    this.programColumnHeader = page.getByRole('columnheader', { name: 'Program' });
    this.table = page.getByRole('table');
    this.alert = page.getByRole('alert');
    this.emptyStateMessage = page.getByText(/no programs|create your first/i);
  }

  async goto() {
    await this.page.goto(`${this.baseUrl}/programs`);
  }

  async openNewProgram() {
    await this.newProgramButton.click();
  }

  row(name: string) {
    return this.page
      .getByRole('row')
      .filter({ has: this.page.getByText(name, { exact: true }) });
  }

  nameCell(name: string) {
    return this.page.getByRole('cell', { name: new RegExp(this.escape(name)) }).first();
  }

  nameCells(name: string) {
    return this.page.getByRole('cell', { name: new RegExp(this.escape(name)) });
  }

  nameCellsByPattern(pattern: RegExp) {
    return this.page.getByRole('cell', { name: pattern });
  }

  nameParagraph(name: string) {
    return this.page.getByText(name, { exact: true }).first();
  }

  descriptionParagraph(name: string) {
    return this.row(name).first().getByRole('cell').first().locator('p').nth(1);
  }

  boldTagsInRow(name: string) {
    return this.row(name).first().locator('b');
  }

  scriptTagsInRow(name: string) {
    return this.row(name).first().locator('script');
  }

  editButton(name: string) {
    return this.page.getByRole('button', { name: `Edit ${name}` });
  }

  deleteButton(name: string) {
    return this.page.getByRole('button', { name: `Delete ${name}` });
  }

  deleteButtons() {
    return this.page.getByRole('button', { name: /^Delete / });
  }

  rows() {
    return this.page.getByRole('row');
  }

  editButtons() {
    return this.page.getByRole('button', { name: /^Edit / });
  }

  dialogByName(name: 'Edit Program' | 'New Program') {
    return this.page.getByRole('dialog', { name });
  }

  async openEditFor(name: string) {
    await this.editButton(name).click();
  }

  private escape(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
