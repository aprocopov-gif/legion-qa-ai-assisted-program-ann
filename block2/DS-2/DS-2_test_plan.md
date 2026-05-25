# Test Plan: Edit Existing Program Details

> **Test data convention:** All program names and descriptions created during DS-2 testing use the `AP_` prefix so test data is identifiable in Didaxis.

---

## Positive Flows

### TC-001 — Edit form opens pre-populated with the program's current data

**Preconditions:** Admin is logged in; program "AP_Web Development 2026" with description "AP_Full-stack web development program" exists in the program list

**Steps:**
1. Navigate to the Programs page
2. Locate "AP_Web Development 2026" in the program list
3. Click the edit icon on the "AP_Web Development 2026" row

**Expected result:** An edit modal opens with the Program Name field pre-filled with "AP_Web Development 2026" and the Description field pre-filled with "AP_Full-stack web development program"

**Priority:** High

---

### TC-002 — Admin successfully updates the program name

**Preconditions:** Admin has opened the edit form for "AP_Web Development 2026"

**Steps:**
1. Change the Program Name to "AP_Web Development 2026 - Updated"
2. Click the Save button

**Expected result:** The modal closes; the program list immediately shows "AP_Web Development 2026 - Updated" as the program name (replacing the previous name in that row)

**Priority:** High

---

### TC-003 — Program list reflects the updated name immediately without a page reload

**Preconditions:** Admin has opened the edit form for "AP_Web Development 2026"

**Steps:**
1. Change the Program Name to "AP_Web Development 2026 - Updated"
2. Click the Save button
3. Observe the program list after the modal closes without manually reloading the page

**Expected result:** The edit modal closes; "AP_Web Development 2026 - Updated" is visible in the list; "AP_Web Development 2026" no longer appears

**Priority:** High

---

### TC-004 — Editing only the Description preserves the Program Name

**Preconditions:** Admin has opened the edit form for a program named "AP_Web Development 2026" with description "AP_Full-stack web development program"

**Steps:**
1. Leave the Program Name field unchanged ("AP_Web Development 2026")
2. Change the Description to "AP_Updated full-stack curriculum for 2026"
3. Click the Save button

**Expected result:** The modal closes; the program list still shows "AP_Web Development 2026" with the updated description "AP_Updated full-stack curriculum for 2026"; reopening the edit form confirms Name is unchanged and Description reflects the new value

**Priority:** High

---

### TC-005 — Editing only the Name preserves the Description

**Preconditions:** Admin has opened the edit form for "AP_Web Development 2026" with description "AP_Full-stack web development program"

**Steps:**
1. Change the Program Name to "AP_Web Development 2026 - Updated"
2. Leave the Description field unchanged ("AP_Full-stack web development program")
3. Click the Save button

**Expected result:** The modal closes; the list shows "AP_Web Development 2026 - Updated"; reopening the edit form confirms Description is still "AP_Full-stack web development program"

**Priority:** High

---

### TC-006 — Admin successfully updates both Name and Description simultaneously

**Preconditions:** Admin has opened the edit form for "AP_Web Development 2026"

**Steps:**
1. Change the Program Name to "AP_Web Development 2026 - Updated"
2. Change the Description to "AP_Revised full-stack curriculum"
3. Click the Save button

**Expected result:** The modal closes; the list shows "AP_Web Development 2026 - Updated"; reopening the edit form confirms both fields reflect the new values

**Priority:** Medium

---

## Negative Flows

### TC-007 — Save button is disabled when Program Name is cleared

**Preconditions:** Admin has opened the edit form for "AP_Web Development 2026"

**Steps:**
1. Clear the Program Name field so it is empty
2. Observe the state of the Save button

**Expected result:** The Save button is disabled; the form cannot be submitted with an empty name

**Priority:** High

---

### TC-008 — Cancelling the edit form does not apply any changes

**Preconditions:** Admin has opened the edit form for "AP_Web Development 2026"

**Steps:**
1. Change the Program Name to "AP_Should Not Be Saved"
2. Change the Description to "AP_This description should not persist"
3. Click the Cancel button

**Expected result:** The modal closes; the program list still shows "AP_Web Development 2026" with the original description; no data was changed

**Priority:** High

---

### TC-009 — Program Name containing only whitespace is rejected

**Preconditions:** Admin has opened the edit form for "AP_Web Development 2026"

**Steps:**
1. Clear the Program Name field
2. Enter "     " (five space characters) in the Program Name field
3. Observe the state of the Save button (or attempt to submit)

**Expected result:** The Save button is disabled or a validation error is displayed; the program name is not updated to a blank/whitespace-only value

**Priority:** Medium

---

### TC-010 — Non-admin user cannot access the edit icon

**Preconditions:** User is logged in with a non-admin role (e.g., instructor or student); program "AP_Web Development 2026" exists in the list

**Steps:**
1. Navigate to the Programs page
2. Locate "AP_Web Development 2026" in the list
3. Observe whether an edit icon is present on the row

**Expected result:** The edit icon is hidden or disabled; the edit form is not accessible to non-admin users

**Priority:** High

---

### TC-011 — Navigating away mid-edit without saving discards changes

**Preconditions:** Admin has opened the edit form for "AP_Web Development 2026"

**Steps:**
1. Change the Program Name to "AP_Should Not Be Saved"
2. Without clicking Save, navigate to a different page
3. Return to the Programs page

**Expected result:** "AP_Web Development 2026" still appears in the list; the unsaved change was discarded

**Priority:** Medium

---

## Edge Cases

### TC-012 — Program Name at maximum allowed length is accepted

**Preconditions:** Admin has opened the edit form for "AP_Web Development 2026" (max length assumed 255 characters)

**Steps:**
1. Change the Program Name to a 255-character string starting with "AP_" (e.g., "AP_" followed by "A" repeated to reach 255 characters total)
2. Click the Save button

**Expected result:** The program is saved successfully and the full name is shown in the list

**Priority:** Medium

---

### TC-013 — Program Name exceeding maximum allowed length is rejected

**Preconditions:** Admin has opened the edit form for "AP_Web Development 2026"

**Steps:**
1. Clear the Program Name field
2. Paste a 256-character string starting with "AP_" into the Program Name field
3. Observe the field behavior and the state of the Save button

**Expected result:** Input is truncated to the maximum length or a validation message is shown; the excess characters are not accepted

**Priority:** Medium

---

### TC-014 — Program Name with special characters is saved and rendered correctly

**Preconditions:** Admin has opened the edit form for "AP_Web Development 2026"

**Steps:**
1. Change the Program Name to "AP_Web Dev & Design: 2026 (Part 1)"
2. Click the Save button

**Expected result:** The program is saved and the list displays "AP_Web Dev & Design: 2026 (Part 1)" without encoding artifacts (e.g., `&amp;` is not rendered in place of `&`)

**Priority:** Medium

---

### TC-015 — Program Name with HTML/script tags does not execute

**Preconditions:** Admin has opened the edit form for "AP_Web Development 2026"

**Steps:**
1. Change the Program Name to "AP_<script>alert('xss')</script>"
2. Click the Save button (if enabled)

**Expected result:** The input is stored and rendered as plain text in the list; no script executes and no alert dialog appears

**Priority:** High

---

### TC-016 — Editing to a name that duplicates an existing program is handled

**Preconditions:** Both "AP_Web Development 2026" and "AP_Data Science 2026" exist in the program list; admin has opened the edit form for "AP_Web Development 2026"

**Steps:**
1. Change the Program Name to "AP_Data Science 2026"
2. Click the Save button

**Expected result:** Either (a) an error message informs the admin that a program with this name already exists, or (b) the duplicate is saved if duplicates are permitted — behavior must be consistent with system design

**Priority:** Medium

---

### TC-017 — Program Name with leading/trailing whitespace is trimmed on save

**Preconditions:** Admin has opened the edit form for "AP_Web Development 2026"

**Steps:**
1. Change the Program Name to "  AP_Web Development 2026 - Updated  " (with leading and trailing spaces)
2. Click the Save button

**Expected result:** The program is saved and appears in the list as "AP_Web Development 2026 - Updated" with whitespace trimmed

**Priority:** Low

---

### TC-018 — Description field at maximum allowed length is accepted

**Preconditions:** Admin has opened the edit form for "AP_Web Development 2026" (max length assumed 1000 characters)

**Steps:**
1. Change the Description to a 1000-character string starting with "AP_"
2. Click the Save button

**Expected result:** The program is saved successfully; the full description is stored

**Priority:** Low

---

### TC-019 — Rapid double-click on Save does not submit the form twice

**Preconditions:** Admin has opened the edit form for "AP_Web Development 2026"

**Steps:**
1. Change the Program Name to "AP_Web Development 2026 - Updated"
2. Double-click the Save button rapidly (two clicks ~200ms apart, as a user would)

**Expected result:** The program is updated exactly once; no duplicate entries or conflicting updates appear; exactly one PATCH request is sent

**Priority:** Medium

---

### TC-020 — Server error during save displays an appropriate error message

**Preconditions:** Admin has opened the edit form for "AP_Web Development 2026"; network or server is configured to return a 500 error on save

**Steps:**
1. Change the Program Name to "AP_Web Development 2026 - Updated"
2. Click the Save button

**Expected result:** The modal remains open; an error message is displayed informing the admin that the save failed; the program list still shows the original name "AP_Web Development 2026"

**Priority:** Medium

---

## Ambiguities and Gaps in the Acceptance Criteria

| # | Gap / Ambiguity |
|---|----------------|
| 1 | **Maximum field lengths** — No max length is specified for Program Name or Description. TC-012–TC-013 and TC-018 assume 255 and 1000 characters respectively; actual limits need confirmation. |
| 2 | **"Other fields"** — AC 3 mentions "Name and other fields remain unchanged" but never defines what other fields exist beyond Name and Description. If additional fields exist (e.g., AI config fields), they should be listed explicitly. |
| 3 | **Duplicate names** — The ACs do not state whether two programs may share the same name. TC-016 cannot have a definitive expected result without this decision. |
| 4 | **Admin role precondition** — AC 1 does not state that the user must be logged in as admin, though the story description implies admin-only access. TC-010 assumes non-admins cannot edit. |
| 5 | **Edit icon visibility for non-admins** — No AC specifies whether the edit icon should be hidden, disabled, or absent for non-admin roles. |
| 6 | **Cancel / dismiss behavior** — There is no AC covering what happens when the user cancels or closes the edit form mid-change (TC-008). |
| 7 | **Unsaved-changes warning** — No AC addresses whether the system should warn the user before discarding unsaved edits when navigating away or closing the modal (TC-011). |
| 8 | **Program list sort order after edit** — The AC states the list "immediately shows" the updated name but does not specify whether the item's position in the list changes (e.g., alphabetical re-sort vs. staying in place). |
| 9 | **Input sanitization** — No AC describes how special characters or HTML in fields should be handled (relevant to TC-014 and TC-015). |
| 10 | **Concurrent edits** — No AC covers what happens if two admins edit the same program simultaneously (last-write-wins vs. conflict warning). |
| 11 | **Error handling for server failures** — No AC describes the user experience when the save API call fails (network error, server 5xx) (TC-020). |
| 12 | **Empty Description on edit** — AC 3 covers changing Description but does not state whether Description can be cleared entirely while Name remains unchanged. |
| 13 | **Double-submit protection** — No AC addresses rapid double-click on Save (TC-019); known defect DS-43 documents duplicate PATCH requests on double-click. |
| 14 | **Whitespace definition** — No AC clarifies whether tab characters or other Unicode whitespace in Program Name are treated the same as spaces on edit (TC-009). |
