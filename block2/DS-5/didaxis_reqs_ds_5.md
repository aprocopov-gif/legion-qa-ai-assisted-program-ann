
## Role
You are a senior QA engineer reviewing the feature described below.

## Task
Write Playwright tests for the program list display on Didaxis Studio.

## App context (from manual inspection)
- Login page: https://test.didaxis.studio/login
  - Email field: `getByRole('textbox', { name: 'Email' })`
  - Password field: `getByRole('textbox', { name: 'Password' })`
  - Sign In button: `getByRole('button', { name: 'Sign In' })`
- Programs page: /programs
  - New Program button: `getByRole('button', { name: '+ New Program' })`
- New Program modal: `getByRole('dialog', { name: 'New Program' })`
  - Program Name field: `getByRole('textbox', { name: 'Program Name' })`
  - Description field: `getByRole('textbox', { name: 'Description' })`
  - Create button: `getByRole('button', { name: 'Create' })`
  - Cancel button: `getByRole('button', { name: 'Cancel' })`
- Programs table: `getByRole('table')`
  - Column headers: "Program" (single column; no separate "Description" header)
  - Each row: `getByRole('row', { name: /programName/ })`
  - **Name + description share a single cell** — two stacked `<p>` tags:
    - Name paragraph (first):
      `page.getByRole('row', { name: /programName/ }).getByRole('cell').first().locator('p').first()`
    - Description paragraph (second):
      `page.getByRole('row', { name: /programName/ }).getByRole('cell').first().locator('p').nth(1)`
  - To assert description text is visible anywhere on the page: `page.getByText('description text')`
  - Action cell: `getByRole('cell', { name: /✏️ 🗑/ })`
    - Edit button: `getByRole('button', { name: '✏️' })`
    - Delete button: `getByRole('button', { name: '🗑' })`

## Empty state (no programs)
- When the program list is empty, observe the page content
- The exact empty-state message wording is not confirmed; assert flexibly:
  `expect(await page.getByRole('table').isVisible()).toBe(false)` OR
  `expect(page.getByText(/no programs|create your first/i)).toBeVisible()`

## Credentials
Use dotenv. Read email and password from process.env:

- process.env.DIDAXIS_EMAIL
- process.env.DIDAXIS_PASSWORD
Do NOT hardcode credentials in the test file.

## Helper functions
Use shared helpers defined outside `test.describe`:

```ts
async function createProgram(page, name, description = '') {
  await page.goto(`${BASE_URL}/programs`);
  await page.getByRole('button', { name: '+ New Program' }).click();
  const modal = page.getByRole('dialog', { name: 'New Program' });
  await modal.getByRole('textbox', { name: 'Program Name' }).fill(name);
  if (description) {
    await modal.getByRole('textbox', { name: 'Description' }).fill(description);
  }
  await modal.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('cell', { name: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })).toBeVisible();
}

async function deleteProgram(page, name) {
  await page.goto(`${BASE_URL}/programs`);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('row', { name: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
    .first()
    .getByRole('button', { name: '🗑' })
    .click();
}
```

## Test plan
See block2/DS-5/agent_output.md for all test cases (TC-001 through TC-020).

## Requirements
- TypeScript
- Use Playwright locators (getByRole, getByText, locator('p'))
- Login in beforeEach; each test is independent
- Use unique test data with Date.now() suffix to avoid collisions
- Escape special regex characters when using program names in `new RegExp()`:
  `name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`
- For TC-002 (empty state): assert either the table is not visible OR an empty-state text is shown;
  NOTE — cannot guarantee the system is truly empty (other tests may have created programs),
  so create a program then delete it and observe the result if only that one existed,
  OR simply skip this test with a note that it requires a clean environment
- For TC-007 (unauthenticated): navigate to /programs without logging in and check redirect to /login
- For TC-008 (non-admin): use `test.skip` if `DIDAXIS_NONADMIN_EMAIL`/`DIDAXIS_NONADMIN_PASSWORD` are not set
- For TC-009 (multi-org isolation): use `test.skip` — requires a second organisation account
- For TC-017 (large list performance): create 10 programs and measure `page.goto` timing as a proxy;
  skip bulk creation of 200 programs to keep suite fast
- For TC-019 (duplicate names): create two programs with the same name and assert both rows are visible
- Save as tests/ds5-program-list-display.spec.ts
