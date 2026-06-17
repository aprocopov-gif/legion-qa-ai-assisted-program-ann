# DS-4 — Delete Program with Confirmation

> **Jira:** [DS-4](https://legionqaschool.atlassian.net/browse/DS-4)
>
> **User story:** As an admin user, I want to delete a program I no longer need, with a confirmation step to prevent accidental deletion.
>
> **Test data convention:** All program names and descriptions use the `AP_` prefix so test data is identifiable in Didaxis.
>
> **Automation:** `tests/ds4-delete-program.spec.ts` (TC-001 through TC-019)
>
> **Gherkin:** `features/DS-4.feature.md`

---

## Positive Flows

### TC-001 — Confirmed deletion removes the program from the program list

**Preconditions:** Admin is logged in; a program named "AP_Test Program" exists in the program list

**Steps:**
1. Navigate to the Programs page
2. Locate "AP_Test Program" in the program list
3. Click the delete icon for "AP_Test Program"
4. Observe that a confirmation dialog appears
5. Confirm deletion in the dialog

**Expected result:** The confirmation dialog closes; "AP_Test Program" is no longer present in the program list; no error message is displayed

**Priority:** High

---

### TC-002 — Cancelling the confirmation dialog leaves the program intact

**Preconditions:** Admin is logged in; a program named "AP_Test Program" exists in the program list

**Steps:**
1. Navigate to the Programs page
2. Locate "AP_Test Program" in the program list
3. Click the delete icon for "AP_Test Program"
4. Observe that a confirmation dialog appears
5. Click Cancel in the confirmation dialog

**Expected result:** The confirmation dialog closes; "AP_Test Program" is still present in the program list with all its details unchanged

**Priority:** High

---

### TC-003 — Deleting one program does not affect other programs in the list

**Preconditions:** Admin is logged in; programs "AP_Test Program" and "AP_Data Science 2026" both exist in the program list

**Steps:**
1. Navigate to the Programs page
2. Click the delete icon for "AP_Test Program"
3. Confirm deletion in the confirmation dialog
4. Inspect the program list after deletion

**Expected result:** "AP_Test Program" is removed; "AP_Data Science 2026" remains in the list with its data unchanged

**Priority:** High

---

### TC-004 — Deleted program name becomes available for a new program

**Preconditions:** Admin is logged in; "AP_Test Program" has just been successfully deleted

**Steps:**
1. Click the "+ New Program" button
2. Enter "AP_Test Program" in the Program Name field
3. Enter "AP_Reused name after deletion" in the Description field
4. Click the Create button

**Expected result:** The new program is created successfully; no duplicate-name error is shown; "AP_Test Program" reappears in the list as a new entry

**Priority:** Medium

---

### TC-005 — Confirmation dialog displays the correct program name before deletion

**Preconditions:** Admin is logged in; programs "AP_Test Program" and "AP_Web Development 2026" both exist

**Steps:**
1. Navigate to the Programs page
2. Click the delete icon for "AP_Web Development 2026"
3. Read the message shown in the confirmation dialog

**Expected result:** The dialog references "AP_Web Development 2026" by name (e.g., `Delete program "AP_Web Development 2026"`); it does not show a different program's name or a generic placeholder

**Priority:** High

---

### TC-006 — Deletion is persisted after a page reload

**Preconditions:** Admin is logged in; "AP_Test Program" exists

**Steps:**
1. Click the delete icon for "AP_Test Program"
2. Confirm deletion in the confirmation dialog
3. Reload the Programs page

**Expected result:** "AP_Test Program" does not reappear after reload; the deletion was committed server-side

**Priority:** High

---

## Negative Flows

### TC-007 — Non-admin user does not see the delete icon

**Preconditions:** Non-admin user is logged in (e.g., instructor or student); "AP_Test Program" exists in the program list

**Steps:**
1. Navigate to the Programs page
2. Inspect each row in the program list for a delete icon

**Expected result:** No delete icon is visible for any program; attempting to access the delete endpoint directly returns an access-denied response

**Priority:** High

---

### TC-008 — Dismissing the confirmation dialog leaves the program intact

**Preconditions:** Admin is logged in; "AP_Test Program" exists

**Steps:**
1. Click the delete icon for "AP_Test Program"
2. Observe the confirmation dialog appears
3. Dismiss the dialog (Cancel button or equivalent dismiss action)

**Expected result:** The dialog closes; "AP_Test Program" remains in the program list; no deletion is triggered

**Priority:** High

---

### TC-009 — Deletion does not proceed when the network is unavailable at confirmation

**Preconditions:** Admin is logged in; "AP_Test Program" exists; network connectivity is disabled or the DELETE request fails after the dialog opens

**Steps:**
1. Click the delete icon for "AP_Test Program"
2. Simulate a network failure (e.g., browser DevTools → Offline mode or request interception)
3. Confirm deletion in the confirmation dialog

**Expected result:** An error message is displayed (e.g., "Failed to delete program. Please try again."); "AP_Test Program" remains in the program list once connectivity is restored and the page is refreshed

**Priority:** Medium

---

### TC-010 — Direct API call to delete endpoint without admin credentials is rejected

**Preconditions:** A non-admin session token is available; "AP_Test Program" exists and its ID is known

**Steps:**
1. Send a DELETE request to the program deletion endpoint with the non-admin token
2. Reload the Programs page in an admin session and inspect the list

**Expected result:** The API returns a 401 or 403 status code; "AP_Test Program" still exists in the program list

**Priority:** High

---

### TC-011 — Cancelling deletion multiple times does not accumulate side effects

**Preconditions:** Admin is logged in; "AP_Test Program" exists

**Steps:**
1. Click the delete icon for "AP_Test Program"
2. Click Cancel in the confirmation dialog
3. Repeat steps 1–2 five more times
4. Verify the program list

**Expected result:** "AP_Test Program" remains in the list after every Cancel action; no ghost state, error, or unintended deletion occurs

**Priority:** Medium

---

## Edge Cases

### TC-012 — Deleting the only program in the list shows an empty-state message

**Preconditions:** Admin is logged in; exactly one program named "AP_Test Program" exists; no other programs are present

**Steps:**
1. Click the delete icon for "AP_Test Program"
2. Confirm deletion in the confirmation dialog

**Expected result:** The program list is now empty; an appropriate empty-state message is displayed (e.g., "No programs yet. Create your first program."); no error or broken layout appears

**Priority:** Medium

---

### TC-013 — Program with a name containing special characters can be deleted

**Preconditions:** Admin is logged in; a program named "AP_Informatique & IA - Niveau 2" exists

**Steps:**
1. Click the delete icon for "AP_Informatique & IA - Niveau 2"
2. Verify the confirmation dialog shows the name correctly (not HTML-encoded)
3. Confirm deletion

**Expected result:** The program is deleted; "AP_Informatique & IA - Niveau 2" no longer appears in the list; the dialog rendered the `&` as a literal ampersand (not `&amp;`)

**Priority:** Medium

---

### TC-014 — Program with a maximum-length name can be deleted and the dialog renders it without overflow

**Preconditions:** Admin is logged in; a program with a 255-character name exists (e.g., `AP_` + "A" repeated to fill remaining characters)

**Steps:**
1. Click the delete icon for the 255-character-name program
2. Inspect the confirmation dialog message
3. Confirm deletion

**Expected result:** The dialog renders the full program name without overflow, truncation artefacts, or broken layout; confirming deletion removes the program successfully

**Priority:** Low

---

### TC-015 — Pressing Escape while the confirmation dialog is open cancels deletion

**Preconditions:** Admin is logged in; "AP_Test Program" exists; the confirmation dialog is open

**Steps:**
1. Click the delete icon for "AP_Test Program"
2. When the confirmation dialog appears, press the Escape key (or dismiss the dialog via the equivalent cancel action)

**Expected result:** The dialog closes; "AP_Test Program" remains in the program list; no deletion is triggered

**Priority:** Medium

---

### TC-016 — Rapid double-click on Confirm does not trigger duplicate deletion requests

**Preconditions:** Admin is logged in; "AP_Test Program" exists; the confirmation dialog is open

**Steps:**
1. Click the delete icon for "AP_Test Program"
2. Attempt to double-click Confirm rapidly in the confirmation dialog

**Expected result:** Exactly one deletion request is sent; "AP_Test Program" is removed once; no duplicate API calls are made; no error appears in the UI

**Priority:** Medium

---

### TC-017 — Confirmation dialog is modal and blocks interaction with the program list behind it

**Preconditions:** Admin is logged in; programs "AP_Test Program" and "AP_Data Science 2026" exist; the confirmation dialog for "AP_Test Program" is open

**Steps:**
1. Click the delete icon for "AP_Test Program"
2. While the confirmation dialog is open, attempt to click another program's delete icon in the list behind the dialog

**Expected result:** Clicks on elements behind the dialog are blocked; no second confirmation dialog opens; no other program is deleted

**Priority:** Medium

---

### TC-018 — Navigating away from the page while the confirmation dialog is open does not delete the program

**Preconditions:** Admin is logged in; "AP_Test Program" exists; the confirmation dialog is open

**Steps:**
1. Click the delete icon for "AP_Test Program"
2. While the dialog is visible, navigate to a different page (e.g., click a nav link or use the browser back button)
3. Return to the Programs page

**Expected result:** "AP_Test Program" still exists in the program list; the navigation away acted as an implicit cancel

**Priority:** Low

---

### TC-019 — Program with a name containing HTML tags shows the name as plain text in the confirmation dialog

**Preconditions:** Admin is logged in; a program named "AP_<b>Bold Program</b>" exists (assuming such a name was allowed at creation or entered via API)

**Steps:**
1. Click the delete icon for the program with the HTML-tag name
2. Inspect the confirmation dialog message

**Expected result:** The dialog displays the literal string `AP_<b>Bold Program</b>` as plain text; no bold formatting is rendered; no script executes

**Priority:** Medium

---

## Ambiguities and Gaps in the Acceptance Criteria

| # | Gap / Ambiguity |
|---|----------------|
| 1 | **Confirmation dialog wording** — The AC states "I see a confirmation dialog" but does not specify the exact copy (title, body text, button labels). Agreed wording is needed for TC-005 and TC-013 to be unambiguously testable. |
| 2 | **Dialog type** — Manual inspection confirms a native browser `window.confirm()` dialog (not a Mantine/React modal). No X button exists; `dialog.dismiss()` is the Cancel equivalent. Escape behavior depends on browser defaults (TC-015). |
| 3 | **Delete control locator** — The AC refers to a "delete icon". Current implementation renders an `<img>` trash icon with accessible name `Delete {ProgramName}`, not the 🗑 emoji character. Playwright locators must target the actual accessible name. |
| 4 | **Cascade behaviour on deletion** — No AC addresses what happens to data associated with a program (e.g., curriculum sessions, enrolled students). It is unclear whether deletion is blocked when associations exist, or whether associated data is cascaded/soft-deleted. |
| 5 | **Soft delete vs. hard delete** — The AC says the program "is removed from the program list" but does not state whether it is permanently deleted or archived/soft-deleted. This affects TC-006 (persistence) and TC-004 (name reuse). |
| 6 | **Access control for delete** — The user story specifies "admin user" but neither AC scenario states the login precondition explicitly. Sub-roles (e.g., read-only admin) are not addressed. TC-007 covers non-admin visibility. |
| 7 | **Confirmation button label** — "Confirm deletion" is used in the AC phrasing, but the actual button label on a native confirm dialog is typically "OK" or "Delete". Exact label must be confirmed. |
| 8 | **Dialog dismissal methods** — The AC describes only Cancel as a way to abort. It is not stated whether pressing Escape, clicking outside the dialog, or navigating away also cancels deletion (TC-015, TC-018). |
| 9 | **UI feedback after successful deletion** — The AC only states the program is removed from the list. There is no mention of a success toast, notification, or any other feedback to the user. |
| 10 | **Undo / restore capability** — No AC mentions whether a deleted program can be restored. If an undo mechanism exists, additional test cases are needed. |
| 11 | **Concurrent deletion** — If two admins attempt to delete the same program simultaneously, the expected behavior (e.g., second request returns 404 gracefully) is not defined (TC-016). |
| 12 | **Admin login precondition** — Neither AC scenario states that the user must be logged in as admin, though the story description requires it. All positive-flow preconditions assume admin access. |
| 13 | **Program creation dependency** — Several test cases (TC-004, TC-011, TC-013, TC-014) require creating programs as setup. Program creation failures block automated execution of those tests. |
| 14 | **Empty-state wording after last delete** — TC-012 expects an empty-state message but the exact copy is not defined in the AC (similar to DS-5 empty-state ambiguity). |
