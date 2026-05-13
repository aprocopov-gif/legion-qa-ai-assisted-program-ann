
## Role
You are a senior QA engineer reviewing the feature described below.

## Task
Write Playwright tests for program name validation and duplicate prevention on Didaxis Studio.

## App context (from manual inspection)
- Login page: https://test.didaxis.studio/login
  - Email field: `getByRole('textbox', { name: 'Email' })`
  - Password field: `getByRole('textbox', { name: 'Password' })`
  - Sign In button: `getByRole('button', { name: 'Sign In' })`
- Programs page: /programs
  - New Program button: `getByRole('button', { name: '+ New Program' })`
- New Program modal: `getByRole('dialog', { name: 'New Program' })`
  - Program Name field: `getByRole('textbox', { name: 'Program Name' })`
    - placeholder: `e.g. Computer Science BSc`
    - required field — Create button is disabled when empty or whitespace-only
  - Description field: `getByRole('textbox', { name: 'Description' })`
    - placeholder: `Brief description`
    - optional field
  - Create button: `getByRole('button', { name: 'Create' })` — disabled until Program Name is non-empty
  - Cancel button: `getByRole('button', { name: 'Cancel' })`
- Programs table: `getByRole('table')`
  - Each row: `getByRole('row', { name: /programName/ })`
  - Program name cell: `getByRole('cell', { name: /programName/ })`

## Credentials
Use dotenv. Read email and password from process.env:

- process.env.DIDAXIS_EMAIL
- process.env.DIDAXIS_PASSWORD
Do NOT hardcode credentials in the test file.

## Test plan
See block2/DS-3/agent_output.md for all test cases (TC-001 through TC-020).

## Requirements
- TypeScript
- Use Playwright locators (getByRole, getByText)
- Login in beforeEach; each test is independent
- Use unique test data with Date.now() suffix to avoid collisions
- Scope all modal interactions inside `page.getByRole('dialog', { name: 'New Program' })`
- For duplicate-name tests: create the first program programmatically in the same test before opening the form a second time
- Escape special regex characters when using program names in `new RegExp()`:
  `name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`
- Save as tests/ds3-program-name-validation.spec.ts
