
## Role
You are a senior QA engineer reviewing the feature described below.

## Task
Write Playwright tests for editing an existing program on Didaxis Studio.

## App context (from manual inspection)
- Login page: https://test.didaxis.studio/login
  - Email field: `getByRole('textbox', { name: 'Email' })`
  - Password field: `getByRole('textbox', { name: 'Password' })`
  - Sign In button: `getByRole('button', { name: 'Sign In' })`
- Programs page: /programs
  - Edit icon per row: `getByRole('button', { name: '✏️' })` — click the one inside the target row
  - Delete icon per row: `getByRole('button', { name: '🗑' })`
- Edit modal: `getByRole('dialog', { name: 'Edit Program' })`
  - Program Name field (pre-filled): `getByRole('textbox', { name: 'Program Name' })`
  - Description field (pre-filled): `getByRole('textbox', { name: 'Description' })`
  - Save button: `getByRole('button', { name: 'Save' })`
  - Cancel button: `getByRole('button', { name: 'Cancel' })`
  - Close (X) button: the unlabelled active button in the dialog banner

## Credentials
Use dotenv. Read email and password from process.env:

- process.env.DIDAXIS_EMAIL
- process.env.DIDAXIS_PASSWORD
Do NOT hardcode credentials in the test file.

## Test plan
See block2/DS-2/agent_output.md for all test cases (TC-001 through TC-020).

## Requirements
- TypeScript
- Use Playwright locators (getByRole, getByLabel, getByText)
- Login in beforeEach; each test is independent
- Use unique test data with Date.now() suffix
- Scope all modal interactions inside `page.getByRole('dialog', { name: 'Edit Program' })`
- To open the edit form for a specific program, locate its row first:
  `page.getByRole('row', { name: /programName/ }).getByRole('button', { name: '✏️' }).click()`
- Save as tests/ds2-edit-program.spec.ts
