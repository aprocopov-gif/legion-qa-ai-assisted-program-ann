# Test Plan: Program Name Validation and Duplicate Prevention

---

## Positive Flows

### TC-001 — Program name with special characters is accepted and rendered correctly

**Preconditions:** User is logged in as admin; the program creation form is open; no program named "Informatique & IA - Niveau 2" exists

**Steps:**
1. Enter "Informatique & IA - Niveau 2" in the Program Name field
2. Fill all other required fields with valid values
3. Click the Create button

**Expected result:** The program is created; the program list displays "Informatique & IA - Niveau 2" without encoding artifacts (e.g., `&amp;` is not rendered in place of `&`)

**Priority:** High

---

### TC-002 — Program name with alphanumeric characters and spaces is accepted

**Preconditions:** User is logged in as admin; the program creation form is open; no program named "Web Development 2026" exists

**Steps:**
1. Enter "Web Development 2026" in the Program Name field
2. Fill all other required fields with valid values
3. Click the Create button

**Expected result:** The program is created successfully and "Web Development 2026" appears in the program list

**Priority:** High

---

### TC-003 — Program name with leading and trailing whitespace is trimmed and saved

**Preconditions:** User is logged in as admin; the program creation form is open; no program named "Data Science 2026" exists

**Steps:**
1. Enter "  Data Science 2026  " (two leading and two trailing spaces) in the Program Name field
2. Fill all other required fields with valid values
3. Click the Create button

**Expected result:** The program is created; the program list displays "Data Science 2026" with whitespace trimmed

**Priority:** Medium

---

### TC-004 — A name previously used by a deleted program can be reused

**Preconditions:** User is logged in as admin; a program named "Web Development 2026" previously existed and has since been deleted; the program creation form is open

**Steps:**
1. Enter "Web Development 2026" in the Program Name field
2. Fill all other required fields with valid values
3. Click the Create button

**Expected result:** The program is created successfully; no duplicate-name error is shown

**Priority:** Medium

---

## Negative Flows

### TC-005 — Program name consisting only of spaces is rejected

**Preconditions:** User is logged in as admin; the program creation form is open

**Steps:**
1. Enter "   " (three spaces) in the Program Name field
2. Fill all other required fields with valid values
3. Click the Create button

**Expected result:** The form is not submitted; a validation error indicates the name cannot be blank; no program is created

**Priority:** High

---

### TC-006 — Empty Program Name field prevents form submission

**Preconditions:** User is logged in as admin; the program creation form is open

**Steps:**
1. Leave the Program Name field empty
2. Fill all other required fields with valid values
3. Observe the state of the Create button (or attempt to click it)

**Expected result:** The Create button is disabled or the form is not submitted; a validation error indicates the name is required

**Priority:** High

---

### TC-007 — Duplicate program name (exact match) is rejected with an error message

**Preconditions:** User is logged in as admin; a program named "Web Development 2026" already exists; the program creation form is open

**Steps:**
1. Enter "Web Development 2026" in the Program Name field
2. Fill all other required fields with valid values
3. Click the Create button

**Expected result:** The form is not submitted; an inline error or toast notification states that a program with this name already exists; no second program is created

**Priority:** High

---

### TC-008 — Duplicate-name error message is specific and actionable

**Preconditions:** User is logged in as admin; a program named "Web Development 2026" already exists; the program creation form is open

**Steps:**
1. Enter "Web Development 2026" in the Program Name field
2. Fill all other required fields with valid values
3. Click the Create button
4. Read the error message displayed

**Expected result:** The error message explicitly references the name conflict (e.g., "A program named 'Web Development 2026' already exists"); a generic "Something went wrong" message is not shown

**Priority:** Medium

---

### TC-009 — Non-admin user cannot access the program creation form

**Preconditions:** User is logged in with a non-admin role (e.g., instructor or student)

**Steps:**
1. Navigate to the Programs page
2. Observe whether a "+ New Program" button or equivalent entry point is present
3. If present, click it

**Expected result:** The "+ New Program" button is hidden or disabled; attempting to access the creation URL directly returns an access-denied response; no program can be created

**Priority:** High

---

## Edge Cases

### TC-010 — Program name consisting only of tab characters is rejected

**Preconditions:** User is logged in as admin; the program creation form is open

**Steps:**
1. Enter a single tab character (`\t`) in the Program Name field
2. Fill all other required fields with valid values
3. Click the Create button

**Expected result:** The tab is treated as whitespace and trimmed to empty; the form is not submitted and a validation error indicates the name cannot be blank

**Priority:** Medium

---

### TC-011 — Program name with a mix of spaces and tabs is rejected

**Preconditions:** User is logged in as admin; the program creation form is open

**Steps:**
1. Enter " \t  \t " (a combination of spaces and tabs only) in the Program Name field
2. Fill all other required fields with valid values
3. Click the Create button

**Expected result:** The input is treated as whitespace-only; the form is not submitted and a validation error is displayed

**Priority:** Low

---

### TC-012 — Single-character program name is accepted

**Preconditions:** User is logged in as admin; the program creation form is open; no program named "A" exists

**Steps:**
1. Enter "A" in the Program Name field
2. Fill all other required fields with valid values
3. Click the Create button

**Expected result:** The program is created successfully with the name "A"

**Priority:** Low

---

### TC-013 — Program name at the maximum allowed length is accepted

**Preconditions:** User is logged in as admin; the program creation form is open (assumed max: 255 characters)

**Steps:**
1. Enter a 255-character string (e.g., "A" repeated 255 times) in the Program Name field
2. Fill all other required fields with valid values
3. Click the Create button

**Expected result:** The program is created successfully; the full 255-character name is stored and displayed in the program list

**Priority:** Medium

---

### TC-014 — Program name exceeding the maximum allowed length is rejected or truncated

**Preconditions:** User is logged in as admin; the program creation form is open

**Steps:**
1. Paste a 256-character string (e.g., "A" repeated 256 times) in the Program Name field
2. Observe whether the field truncates the input automatically
3. Click the Create button

**Expected result:** Either the input is silently truncated to 255 characters in the field and the form submits successfully, or a validation error indicates the name is too long; raw overflow is not stored in the database

**Priority:** Medium

---

### TC-015 — Program name with HTML and script tags is stored and displayed as plain text

**Preconditions:** User is logged in as admin; the program creation form is open

**Steps:**
1. Enter `<script>alert('xss')</script>` in the Program Name field
2. Fill all other required fields with valid values
3. Click the Create button (if enabled)

**Expected result:** The name is stored as plain text; the program list displays the literal string `<script>alert('xss')</script>` without executing any script; no alert dialog appears

**Priority:** High

---

### TC-016 — Duplicate check behavior is consistent for case-variant names

**Preconditions:** User is logged in as admin; a program named "Web Development 2026" already exists; the program creation form is open

**Steps:**
1. Enter "web development 2026" (all lowercase) in the Program Name field
2. Fill all other required fields with valid values
3. Click the Create button

**Expected result:** Either (a) the program is rejected as a duplicate if the check is case-insensitive, or (b) the program is created successfully if names are case-sensitive — behavior must be consistent and documented; the outcome must not vary between attempts

**Priority:** Medium

---

### TC-017 — Program name with Unicode and multilingual characters is accepted

**Preconditions:** User is logged in as admin; the program creation form is open; no program with this name exists

**Steps:**
1. Enter "Programmation C++ — Niveau 3 (高级)" in the Program Name field
2. Fill all other required fields with valid values
3. Click the Create button

**Expected result:** The program is created successfully; the name is stored and displayed with all Unicode characters intact and without substitution characters

**Priority:** Medium

---

### TC-018 — Duplicate name validation is enforced server-side after a page reload

**Preconditions:** User is logged in as admin; a program named "Web Development 2026" already exists

**Steps:**
1. Reload the Programs page
2. Open the program creation form
3. Enter "Web Development 2026" in the Program Name field
4. Fill all other required fields with valid values
5. Click the Create button

**Expected result:** The duplicate-name error is returned; the check is not bypassed by a fresh page load and is not dependent solely on cached client-side state

**Priority:** Medium

---

### TC-019 — Program name consisting only of numeric characters is accepted

**Preconditions:** User is logged in as admin; the program creation form is open; no program named "2026" exists

**Steps:**
1. Enter "2026" in the Program Name field
2. Fill all other required fields with valid values
3. Click the Create button

**Expected result:** The program is created successfully; "2026" appears in the program list

**Priority:** Low

---

### TC-020 — Rapid double-click on Create does not produce duplicate programs

**Preconditions:** User is logged in as admin; the program creation form is open with a unique valid name entered

**Steps:**
1. Enter "Unique Program Name 001" in the Program Name field
2. Fill all other required fields with valid values
3. Double-click the Create button rapidly

**Expected result:** Exactly one program named "Unique Program Name 001" is created; no duplicate entries appear in the program list

**Priority:** Medium

---

## Ambiguities and Gaps in the Acceptance Criteria

| # | Gap / Ambiguity |
|---|----------------|
| 1 | **Case sensitivity of duplicate check** — AC3 specifies an exact-match scenario ("Web Development 2026") but does not state whether the duplicate check is case-insensitive. TC-016 cannot have a definitive expected result without this decision. |
| 2 | **Maximum length for Program Name** — No character limit is defined. TC-013 and TC-014 assume 255 characters; the actual limit must be confirmed and ideally surfaced in the UI (e.g., a character counter). |
| 3 | **Definition of whitespace** — AC1 demonstrates whitespace using spaces only ("   "). It is unclear whether tab characters (`\t`), non-breaking spaces (` `), or other Unicode whitespace are also trimmed and treated as empty. |
| 4 | **Other required fields** — AC2 references "other required fields" without naming them. Test cases cannot be fully specified without knowing every required field and its own validation rules. |
| 5 | **Duplicate check scope in multi-tenant systems** — AC3 does not clarify whether uniqueness is enforced globally or per organisation/tenant. Two separate organisations may legitimately share a program name. |
| 6 | **Name reuse after deletion** — No AC addresses whether a name that belonged to a deleted or archived program becomes available again. TC-004 assumes it does; this must be confirmed. |
| 7 | **Error message wording** — AC3 states "an error indicating the name already exists" but does not specify the exact copy. Agreed wording is needed to make TC-008 testable without ambiguity. |
| 8 | **Client-side vs. server-side validation** — It is not stated whether the whitespace/empty check (AC1) is enforced on the client, the server, or both. Server-side enforcement is essential to prevent bypasses via direct API calls. |
| 9 | **Trim on non-empty names** — AC1 confirms trimming is applied to whitespace-only input, but does not state whether leading/trailing whitespace on otherwise valid names (e.g., "  Data Science 2026  ") is also trimmed before storage (TC-003). |
| 10 | **Special character rendering** — AC2 confirms "Informatique & IA - Niveau 2" must be accepted, but does not specify how `&` should be stored and rendered: as the literal character `&` or HTML-encoded as `&amp;`. |
| 11 | **Access control** — No AC specifies which roles can create programs. The test plan assumes admin-only access; this requires explicit confirmation, particularly for any admin sub-roles that may be read-only. |
