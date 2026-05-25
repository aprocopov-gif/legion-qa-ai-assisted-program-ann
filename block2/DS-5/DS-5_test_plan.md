# Test Plan: Program List Filtering and Display

> **Test data convention:** All program names and descriptions created during DS-5 testing use the `AP_` prefix so test data is identifiable in Didaxis.

---

## Positive Flows

### TC-001 — Programs page shows each program's name and description

**Preconditions:** Admin is logged in; programs "AP_Web Development 2026" (description: "AP_Full-stack web development curriculum") and "AP_Data Science 2026" (description: "AP_Applied machine learning and statistics") exist

**Steps:**
1. Navigate to the Programs page
2. Inspect each row in the program list

**Expected result:** Both programs appear in the list; each row displays the program name and its description; no row is missing either field

**Priority:** High

---

### TC-002 — Empty state message and create prompt are shown when no programs exist

**Preconditions:** Admin is logged in; no programs exist in the system

**Steps:**
1. Navigate to the Programs page
2. Observe the page content

**Expected result:** A message indicating no programs have been created is displayed (e.g., "No programs yet."); a prompt or button to create the first program is visible (e.g., "Create your first program" or "+ New Program")

**Priority:** High

---

### TC-003 — A single program is displayed correctly in the program list

**Preconditions:** Admin is logged in; exactly one program named "AP_Test Program" (description: "AP_A test program for QA purposes") exists

**Steps:**
1. Navigate to the Programs page
2. Inspect the list

**Expected result:** One row is shown containing the name "AP_Test Program" and the description "AP_A test program for QA purposes"; no empty-state message is visible

**Priority:** High

---

### TC-004 — Newly created program appears in the list without requiring a manual reload

**Preconditions:** Admin is logged in; the Programs page is open

**Steps:**
1. Click the "+ New Program" button
2. Enter "AP_Data Science 2026" as the program name and "AP_Applied machine learning and statistics" as the description
3. Click the Create button
4. Observe the program list

**Expected result:** "AP_Data Science 2026" appears in the list immediately after creation, without requiring a page reload; the name and description are displayed correctly in the program cell (stacked name + description paragraphs)

**Priority:** High

---

### TC-005 — Empty state is replaced by the program list after the first program is created

**Preconditions:** Admin is logged in; no programs exist; the Programs page is showing the empty-state message

**Steps:**
1. Click the create prompt on the empty-state screen (or "+ New Program")
2. Enter "AP_Test Program" as the program name and "AP_A test program" as the description
3. Submit the form
4. Observe the Programs page

**Expected result:** The empty-state message is no longer visible; the program list table is shown with "AP_Test Program" as an entry; name and description are displayed in the row

**Priority:** High

---

### TC-006 — Program list is still accessible after a page reload

**Preconditions:** Admin is logged in; "AP_Web Development 2026" and "AP_Data Science 2026" exist

**Steps:**
1. Navigate to the Programs page and verify both programs are listed
2. Reload the page

**Expected result:** Both programs are still listed after reload with their names and descriptions intact; no data is lost

**Priority:** Medium

---

## Negative Flows

### TC-007 — Unauthenticated user is redirected away from the Programs page

**Preconditions:** No active session exists (user is logged out)

**Steps:**
1. Attempt to navigate directly to the Programs page URL (e.g., `/programs`)

**Expected result:** The user is redirected to the login page; the program list is not rendered; no program data is exposed

**Priority:** High

---

### TC-008 — Non-admin user cannot access the Programs page

**Preconditions:** User is logged in with a non-admin role (e.g., student or instructor)

**Steps:**
1. Navigate to the Programs page URL directly (e.g., `/programs`)

**Expected result:** Access is denied; either the user is redirected or sees an access-denied message; the program list is not rendered

**Priority:** High

---

### TC-009 — Programs from other organisations are not shown in the list

**Preconditions:** Admin of Organisation A is logged in; Organisation B has a program named "AP_Org B Program"; Organisation A has a program named "AP_Org A Program"

**Steps:**
1. Navigate to the Programs page as the Organisation A admin
2. Inspect the program list

**Expected result:** Only "AP_Org A Program" is visible; "AP_Org B Program" does not appear in the list

**Priority:** High

---

### TC-010 — The empty-state prompt does not appear when programs exist

**Preconditions:** Admin is logged in; at least one program exists

**Steps:**
1. Navigate to the Programs page
2. Inspect the page for empty-state messaging

**Expected result:** The "no programs" message and create-first-program prompt are not visible; only the populated program list is shown

**Priority:** Medium

---

## Edge Cases

### TC-011 — Program with a maximum-length name is displayed without overflow or truncation artefacts

**Preconditions:** Admin is logged in; a program with a 255-character name prefixed with `AP_` (e.g., `AP_` + "A" repeated to 255 chars total) and description "AP_Edge case program" exists

**Steps:**
1. Navigate to the Programs page
2. Inspect the row for the 255-character-name program

**Expected result:** The full name is rendered (or cleanly truncated with an ellipsis if truncation is the intended design); the row layout is not broken; no text overflows outside its container

**Priority:** Medium

---

### TC-012 — Program with a maximum-length description is displayed without layout breakage

**Preconditions:** Admin is logged in; a program named "AP_Test Program" with a 500-character description prefixed with `AP_` (e.g., `AP_` + "B" repeated to 500 chars total) exists

**Steps:**
1. Navigate to the Programs page
2. Inspect the description for "AP_Test Program"

**Expected result:** The description is rendered (fully or truncated by design); the row height and page layout remain intact; no text overflows outside its container

**Priority:** Medium

---

### TC-013 — Program with special characters in name and description is displayed correctly

**Preconditions:** Admin is logged in; a program named "AP_Informatique & IA - Niveau 2" with description "AP_Cours d'IA & ML: niveau avancé (100%)" exists

**Steps:**
1. Navigate to the Programs page
2. Inspect the row for "AP_Informatique & IA - Niveau 2"

**Expected result:** The name and description are rendered as literal text; `&` is displayed as `&` (not `&amp;`); `%`, `-`, and accented characters are displayed correctly

**Priority:** Medium

---

### TC-014 — Program name and description containing HTML tags are rendered as plain text

**Preconditions:** Admin is logged in; a program named "AP_<b>Bold Program</b>" with description `<script>alert('xss')</script>` exists

**Steps:**
1. Navigate to the Programs page
2. Inspect the relevant row

**Expected result:** The name and description are displayed as literal strings; no bold formatting is applied; no script executes; no alert dialog appears

**Priority:** High

---

### TC-015 — Program with a description containing only whitespace shows a graceful empty or trimmed state

**Preconditions:** Admin is logged in; a program named "AP_Whitespace Description Program" with a description of "   " (three spaces) exists

**Steps:**
1. Navigate to the Programs page
2. Inspect the description for "AP_Whitespace Description Program"

**Expected result:** The description either appears empty or displays a placeholder (e.g., "—" or "No description"); no raw whitespace string is rendered; no layout shift occurs

**Priority:** Low

---

### TC-016 — Program with a blank (empty) description is displayed without error

**Preconditions:** Admin is logged in; a program named "AP_No Description Program" was created with no description provided

**Steps:**
1. Navigate to the Programs page
2. Inspect the row for "AP_No Description Program"

**Expected result:** The program name is displayed; the description field shows a graceful empty state (e.g., blank, dash, or "No description available"); no error message or broken layout appears

**Priority:** Medium

---

### TC-017 — Program list with a large number of programs is paginated or scrollable without performance degradation

**Preconditions:** Admin is logged in; at least 10 programs with `AP_`-prefixed names exist with varying descriptions

**Steps:**
1. Navigate to the Programs page
2. Observe the rendering and scrolling behavior
3. If pagination is present, navigate to the next page

**Expected result:** The page loads within an acceptable time; all programs are reachable via scrolling or pagination; no programs are silently omitted; the UI remains responsive

**Priority:** Medium

---

### TC-018 — Program with Unicode and multilingual characters in name and description is displayed correctly

**Preconditions:** Admin is logged in; a program named "AP_Programmation C++ — Niveau 3 (高级)" with description "AP_面向对象编程 & algorithms" exists

**Steps:**
1. Navigate to the Programs page
2. Inspect the row for the Unicode-named program

**Expected result:** The name and description are rendered with all Unicode characters intact; no substitution characters (e.g., `?` or `□`) appear; bidirectional text (if present) is handled without layout issues

**Priority:** Medium

---

### TC-019 — Two programs with identical names are both displayed in the list

**Preconditions:** Admin is logged in; two programs both named "AP_Data Science 2026" exist with different descriptions (system allows duplicates per DS-3)

**Steps:**
1. Navigate to the Programs page
2. Count the number of rows named "AP_Data Science 2026"

**Expected result:** Both entries appear as separate rows; neither entry is silently deduplicated or hidden; each row shows its own description

**Priority:** Low

---

### TC-020 — Programs list order is consistent across page reloads

**Preconditions:** Admin is logged in; programs "AP_Web Development 2026", "AP_Data Science 2026", and "AP_Test Program" exist

**Steps:**
1. Navigate to the Programs page and note the relative order of the three test programs
2. Reload the page
3. Compare the order of the same three programs

**Expected result:** The three test programs appear in the same relative order after reload; the sort order is deterministic and does not change randomly between loads

**Priority:** Medium

---

## Ambiguities and Gaps in the Acceptance Criteria

| # | Gap / Ambiguity |
|---|----------------|
| 1 | **Fields displayed in the list** — The AC mentions only name and description. It is not specified whether other fields (e.g., creation date, status, assigned instructors) should also appear in the list view. |
| 2 | **Default sort order** — No AC defines how the program list should be ordered (alphabetical, by creation date, by last-modified date). Without a defined order, TC-020 cannot have a fully deterministic expected result. |
| 3 | **Pagination vs. infinite scroll vs. full list** — The AC does not define what happens when there are many programs. There is no mention of pagination, virtual scrolling, or a hard cap on list size. |
| 4 | **Empty-state message wording** — The AC says "a message indicating no programs have been created" but does not specify the exact copy or the label on the create prompt. Agreed wording is needed for TC-002 to be unambiguously testable. |
| 5 | **Description field optionality** — The AC assumes every program has a description, but it is not stated whether description is a required field. TC-016 depends on knowing whether a blank description is a valid state. |
| 6 | **Access control** — The AC does not specify which roles can view the Programs page. The story description implies admin-only access; it is unclear whether read-only admin roles or other roles should also see the list (TC-008). |
| 7 | **Multi-tenancy / data isolation** — No AC addresses whether program lists are scoped to an organisation or tenant. TC-009 assumes tenant isolation, but this must be confirmed. |
| 8 | **Real-time updates** — The AC does not state whether the list should update automatically when another admin creates or deletes a program in a concurrent session. TC-004 assumes immediate update after local creation only. |
| 9 | **Truncation behavior for long values** — It is not defined whether long names or descriptions should be truncated in the list view (with a tooltip or expand option) or displayed in full. TC-011 and TC-012 cannot have a precise expected result without this design decision. |
| 10 | **Search and filtering** — The story title mentions "filtering" but neither AC describes a filter or search capability. It is unclear whether filtering is in scope for this story or a separate one. |
| 11 | **List layout** — The AC does not specify whether name and description appear in separate columns or share a single cell. UI inspection shows a single "Program" column with stacked name and description text. |
| 12 | **Admin login precondition** — Neither AC scenario states that the user must be logged in as admin, though the story description implies admin access. |
| 13 | **API error handling** — No AC defines behavior when the programs API returns an error (e.g., HTTP 500). An empty state may be shown instead of an error message; no dedicated TC covers this path. |
| 14 | **Row management actions** — AC covers name and description display only; edit/delete controls in each row are not specified but may affect row completeness during list inspection. |
| 15 | **Cell accessible name semantics** — Name and description share one table cell with stacked `<p>` tags; the cell accessible name combines both values, affecting role-based lookup by program name alone. |
