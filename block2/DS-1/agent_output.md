# Test Plan: Create New Academic Program

---

## Positive Flows

### TC-001 — Program creation form is accessible to admin

**Preconditions:** User is logged in as admin

**Steps:**
1. Navigate to the Programs page
2. Click the "+ New Program" button

**Expected result:** A modal/form appears containing a "Program Name" field and a "Description" field

**Priority:** High

---

### TC-002 — Admin successfully creates a program with all fields populated

**Preconditions:** Admin is on the program creation form

**Steps:**
1. Enter "Web Development 2026" in the Program Name field
2. Enter "Full-stack web development program" in the Description field
3. Click the Create button

**Expected result:** The modal closes; the program list displays a new entry titled "Web Development 2026"

**Priority:** High

---

### TC-003 — Admin successfully creates a program with only the required field

**Preconditions:** Admin is on the program creation form

**Steps:**
1. Enter "Data Science 2026" in the Program Name field
2. Leave the Description field empty
3. Click the Create button

**Expected result:** The modal closes; the program list displays a new entry titled "Data Science 2026"

**Priority:** High

---

### TC-004 — Create button is enabled when Program Name is filled

**Preconditions:** Admin is on the program creation form with Program Name empty

**Steps:**
1. Enter "Computer Science" in the Program Name field

**Expected result:** The Create button becomes enabled/clickable

**Priority:** High

---

## Negative Flows

### TC-005 — Create button is disabled when Program Name is empty

**Preconditions:** Admin is on the program creation form

**Steps:**
1. Leave the Program Name field empty
2. Observe the state of the Create button

**Expected result:** The Create button is disabled; form cannot be submitted

**Priority:** High

---

### TC-006 — Create button remains disabled when only Description is filled

**Preconditions:** Admin is on the program creation form

**Steps:**
1. Leave the Program Name field empty
2. Enter "Full-stack web development program" in the Description field
3. Observe the state of the Create button

**Expected result:** The Create button remains disabled

**Priority:** High

---

### TC-007 — Program Name containing only whitespace is rejected

**Preconditions:** Admin is on the program creation form

**Steps:**
1. Enter five space characters ("     ") in the Program Name field
2. Observe the state of the Create button (or submit and observe behavior)

**Expected result:** The Create button is disabled or a validation error is shown; a blank-name program is not created

**Priority:** Medium

---

### TC-008 — Non-admin user cannot access the program creation form

**Preconditions:** User is logged in with a non-admin role (e.g., instructor or student)

**Steps:**
1. Navigate to the Programs page
2. Observe whether the "+ New Program" button is present
3. If present, click it

**Expected result:** The "+ New Program" button is hidden or disabled; the creation form is not accessible

**Priority:** High

---

### TC-009 — Cancelling the form does not create a program

**Preconditions:** Admin is on the program creation form

**Steps:**
1. Enter "Cancelled Program" in the Program Name field
2. Enter "This should not be saved" in the Description field
3. Close the modal (via Cancel button, X icon, or pressing Escape)

**Expected result:** The modal closes; "Cancelled Program" does not appear in the program list

**Priority:** Medium

---

## Edge Cases

### TC-010 — Program Name at maximum allowed length is accepted

**Preconditions:** Admin is on the program creation form (max length assumed 255 characters)

**Steps:**
1. Enter a 255-character string (e.g., "A" repeated 255 times) in the Program Name field
2. Enter "Test description" in the Description field
3. Click the Create button

**Expected result:** The program is created successfully and appears in the list with the full name

**Priority:** Medium

---

### TC-011 — Program Name exceeding maximum length is rejected

**Preconditions:** Admin is on the program creation form

**Steps:**
1. Paste a 256-character string into the Program Name field
2. Observe field behavior

**Expected result:** Input is truncated to the maximum length, or a validation message is shown; the excess characters are not accepted

**Priority:** Medium

---

### TC-012 — Program Name with special characters is handled correctly

**Preconditions:** Admin is on the program creation form

**Steps:**
1. Enter `Web Dev & Design: 2026 (Part 1)` in the Program Name field
2. Click the Create button

**Expected result:** The program is created and the name renders correctly in the list without encoding artifacts

**Priority:** Medium

---

### TC-013 — Program Name with HTML/script tags does not execute

**Preconditions:** Admin is on the program creation form

**Steps:**
1. Enter `<script>alert('xss')</script>` in the Program Name field
2. Click the Create button (if enabled)

**Expected result:** Input is stored and displayed as plain text; no script executes; no alert dialog appears

**Priority:** High

---

### TC-014 — Duplicate program name is handled

**Preconditions:** A program named "Web Development 2026" already exists in the list

**Steps:**
1. Open the program creation form
2. Enter "Web Development 2026" in the Program Name field
3. Click the Create button

**Expected result:** Either (a) an error message informs the admin that a program with this name already exists, or (b) the duplicate is created if duplicates are permitted — behavior should be consistent with system design

**Priority:** Medium

---

### TC-015 — Description field at maximum allowed length is accepted

**Preconditions:** Admin is on the program creation form (max length assumed 1000 characters)

**Steps:**
1. Enter "New Program" in the Program Name field
2. Paste a 1000-character string into the Description field
3. Click the Create button

**Expected result:** The program is created successfully

**Priority:** Low

---

### TC-016 — Newly created program appears in the list without a page refresh

**Preconditions:** Admin is on the Programs page with at least one existing program

**Steps:**
1. Click "+ New Program"
2. Enter "Machine Learning 2026" in the Program Name field
3. Click the Create button

**Expected result:** The modal closes and "Machine Learning 2026" appears in the program list immediately, without requiring a manual page reload

**Priority:** Medium

---

### TC-017 — Program Name with leading/trailing whitespace is trimmed

**Preconditions:** Admin is on the program creation form

**Steps:**
1. Enter "  Web Development 2026  " (with leading and trailing spaces) in the Program Name field
2. Click the Create button

**Expected result:** The program is created and appears in the list as "Web Development 2026" with whitespace trimmed

**Priority:** Low

---

## Ambiguities and Gaps in the Acceptance Criteria

| # | Gap / Ambiguity |
|---|----------------|
| 1 | **Maximum field lengths** — No max length is specified for Program Name or Description. Tests TC-010–011 and TC-015 assume 255 and 1000 characters respectively; actual limits need confirmation. |
| 2 | **Duplicate names** — The ACs do not state whether duplicate program names are allowed. TC-014 cannot have a definitive expected result without this decision. |
| 3 | **Description field requirement** — The ACs imply Description is optional (it is listed as a field but not validated), but this is never stated explicitly. |
| 4 | **Cancel / dismiss behavior** — There is no AC for what happens when the user cancels or closes the form mid-entry. |
| 5 | **Role-based access** — The ACs only describe admin behavior. It is unclear whether the "+ New Program" button should be hidden, disabled, or redirect non-admins. |
| 6 | **Program list behavior after creation** — The AC states the list "shows" the new program but does not specify sort order (e.g., top of list, alphabetical, by creation date). |
| 7 | **Input sanitization** — No mention of how special characters or HTML in fields should be handled (relevant to TC-012 and TC-013). |
| 8 | **Form accessibility** — No AC covers keyboard navigation, screen reader support, or focus management after modal opens/closes. |
| 9 | **Concurrent submissions** — No AC covers what happens if the Create button is clicked multiple times rapidly (double-submit protection). |
| 10 | **Error handling for server failures** — No AC describes the user experience if the creation API call fails (network error, server error). |
