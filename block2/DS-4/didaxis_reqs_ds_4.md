
## Role
You are a senior QA engineer reviewing the feature described below.

## Task
Write Playwright tests for deleting a program with a confirmation dialog on Didaxis Studio.

## App context (from manual inspection)
- Login page: https://test.didaxis.studio/login
  - Email field: `getByRole('textbox', { name: 'Email' })`
  - Password field: `getByRole('textbox', { name: 'Password' })`
  - Sign In button: `getByRole('button', { name: 'Sign In' })`
- Programs page: /programs
  - New Program button: `getByRole('button', { name: '+ New Program' })`
  - Delete button per row: `getByRole('button', { name: /Delete programName/ })`
    - Accessible name is `Delete {ProgramName}` (trash icon rendered as `<img>`, not 🗑 emoji)
    - To target a specific row:
      `page.getByRole('row', { name: /programName/ }).getByRole('button', { name: /Delete programName/ }).click()`
- Confirmation dialog: **native browser `window.confirm()` dialog** (not a Mantine/React modal)
  - Must be handled with `page.once('dialog', dialog => dialog.accept())` to confirm
  - Must be handled with `page.once('dialog', dialog => dialog.dismiss())` to cancel
  - Dialog message contains the program name; read with `dialog.message()`
  - No visual X button — Escape and dismiss() both act as Cancel
- Programs table: `getByRole('table')`
  - Each row: `getByRole('row', { name: /programName/ })`
  - Program name cell: `getByRole('cell', { name: /programName/ })`

## Credentials
Use dotenv. Read email and password from process.env:

- process.env.DIDAXIS_EMAIL
- process.env.DIDAXIS_PASSWORD
Do NOT hardcode credentials in the test file.

## Helper functions
Use two shared helpers (defined outside `test.describe`):

```ts
async function createProgram(page, name) {
  await page.goto(`${BASE_URL}/programs`);
  await page.getByRole('button', { name: '+ New Program' }).click();
  const modal = page.getByRole('dialog', { name: 'New Program' });
  await modal.getByRole('textbox', { name: 'Program Name' }).fill(name);
  await modal.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('cell', { name: new RegExp(name) })).toBeVisible();
}

async function deleteProgram(page, name) {
  await page.goto(`${BASE_URL}/programs`);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('row', { name: new RegExp(name) })
    .first()
    .getByRole('button', { name: new RegExp(`Delete ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) })
    .click();
}
```

## Test plan
See block2/DS-4/agent_output.md for all test cases (TC-001 through TC-019).

## Requirements
- TypeScript
- Use Playwright locators (getByRole, getByText)
- Login in beforeEach; each test is independent
- Use unique test data with Date.now() suffix to avoid collisions
- Register `page.once('dialog', ...)` BEFORE the click that triggers the dialog
- For TC-007 (non-admin): use `test.skip` if `DIDAXIS_NONADMIN_EMAIL`/`DIDAXIS_NONADMIN_PASSWORD` are not set
- For TC-008 (X button): native browser dialogs have no X; use `dialog.dismiss()` instead and assert the program remains
- For TC-009 (network offline): intercept the DELETE request with `page.route` to simulate a network failure
- For TC-010 (API auth): use `test.skip` if non-admin credentials are not configured
- For TC-015 (Escape): press Escape before Playwright handles the dialog (`page.keyboard.press('Escape')` on the dialog element is not possible; accept that dismiss() is the equivalent)
- For TC-016 (double-click Confirm): native dialogs block double-click; verify only one deletion occurs instead
- Escape special regex characters when using program names in `new RegExp()`:
  `name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`
- Save as tests/ds4-delete-program.spec.ts
