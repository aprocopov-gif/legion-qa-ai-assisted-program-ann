# Test Plan: Program List Filtering and Display

> **Jira:** [DS-5](https://legionqaschool.atlassian.net/browse/DS-5) — Program list filtering and display  
> **Type:** Story | **Status:** In Progress | **Priority:** Low | **Label:** `program-setup`  
> **Assignee:** Kid KiddosBA

## User Story (from Jira)

As an admin user, I want to see all programs in a clear list so that I can quickly find and manage them.

## Jira Acceptance Criteria

```gherkin
Scenario: Display program list with key details
  Given programs exist in the system
  When I navigate to the Programs page
  Then I see a list showing each program's name and description

Scenario: Empty state when no programs exist
  Given no programs exist
  When I navigate to the Programs page
  Then I see a message indicating no programs have been created
  And I see a prompt to create the first program
```

## AC Coverage

| Jira AC Scenario | Covered by |
|---|---|
| Display program list with key details | TC-001, TC-003, TC-004, TC-006, TC-010, TC-011, TC-012, TC-013, TC-014, TC-015, TC-016, TC-017, TC-018, TC-019 |
| Empty state when no programs exist | TC-002, TC-005 |
| Empty state must not appear when programs exist (inverse of AC 2) | TC-003, TC-005, TC-010 |

> **Test data convention:** All program names created during DS-5 testing use the `AP_` prefix (plus a timestamp suffix in Playwright) so test data is identifiable in Didaxis. Jira AC examples use generic names such as "Test Program".  
> **Playwright implementation:** `tests/ds5-program-list-display.spec.ts`

## Known Defects (from Jira)

| Jira | Summary | Blocked TCs | Status |
|---|---|---|---|
| [DS-74](https://legionqaschool.atlassian.net/browse/DS-74) | Second program creation blocked on Programs page | TC-001, TC-005, TC-017 | To Do (Medium) |
| [DS-75](https://legionqaschool.atlassian.net/browse/DS-75) | Duplicate program names not distinguishable in list | TC-019 | To Do (High) |
| [DS-76](https://legionqaschool.atlassian.net/browse/DS-76) | Page refresh data consistency check times out | TC-006, TC-020 | To Do (Low) |
| [DS-73](https://legionqaschool.atlassian.net/browse/DS-73) | Program row management action icons missing | TC-001, TC-003 (row completeness) | To Do (High) |
| [DS-72](https://legionqaschool.atlassian.net/browse/DS-72) | Programs API 500 shows empty state instead of error | TC-002 (error-path variant) | To Do (Medium) |
| [DS-35](https://legionqaschool.atlassian.net/browse/DS-35) | Programs API 500 shows empty state instead of error (duplicate of DS-72) | TC-002 (error-path variant) | To Do (Medium) |

> **Note:** Jira defect tickets reference TC numbers from an earlier `block5` test run. The **Blocked TCs** column above maps each defect to this Block2 test plan (`TC-001`–`TC-020`).

---

## Positive Flows

### TC-001 — Programs page shows each program's name and description

**Preconditions:** Admin user is logged in; programs "AP_Web Development 2026" (description: "AP_Full-stack web development curriculum") and "AP_Data Science 2026" (description: "AP_Applied machine learning and statistics") exist

**Steps:**
1. Navigate to the Programs page
2. Inspect each row in the program list

**Expected result:** Both programs appear in the list; each row displays the program name and its description; no row is missing either field

**Priority:** High

---

### TC-002 — Empty state message and create prompt are shown when no programs exist

**Preconditions:** Admin user is logged in; no programs exist in the system

**Steps:**
1. Navigate to the Programs page
2. Observe the page content

**Expected result:** A message indicating no programs have been created is displayed (e.g., "No programs yet."); a prompt or button to create the first program is visible (e.g., "Create your first program" or "+ New Program")

**Priority:** High

---

### TC-003 — A single program is displayed correctly in the program list

**Preconditions:** Admin user is logged in; exactly one program named "AP_Test Program" (description: "AP_A test program for QA purposes") exists

**Steps:**
1. Navigate to the Programs page
2. Inspect the list

**Expected result:** One row is shown containing the name "AP_Test Program" and the description "AP_A test program for QA purposes"; no empty-state message is visible

**Priority:** High

---

### TC-004 — Newly created program appears in the list without requiring a manual reload

**Preconditions:** Admin user is logged in; the Programs page is open

**Steps:**
1. Click the "+ New Program" button
2. Enter "AP_Data Science 2026" as the program name and "AP_Applied machine learning and statistics" as the description
3. Click the Create button
4. Observe the program list

**Expected result:** "AP_Data Science 2026" appears in the list immediately after creation, without requiring a page reload; the name and description are displayed correctly in the program cell (stacked name + description paragraphs)

**Priority:** High

---

### TC-005 — Empty state is replaced by the program list after the first program is created

**Preconditions:** Admin user is logged in; no programs exist; the Programs page is showing the empty-state message

**Steps:**
1. Click the create prompt on the empty-state screen (or "+ New Program")
2. Enter "AP_Test Program" as the program name and "AP_A test program" as the description
3. Submit the form
4. Observe the Programs page

**Expected result:** The empty-state message is no longer visible; the program list table is shown with "AP_Test Program" as an entry; name and description are displayed in the row

**Priority:** High

---

### TC-006 — Program list is still accessible after a page reload

**Preconditions:** Admin user is logged in; "AP_Web Development 2026" and "AP_Data Science 2026" exist

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

**Preconditions:** Admin user is logged in of Organisation A; Organisation B has a program named "AP_Org B Program"; Organisation A has a program named "AP_Org A Program"

**Steps:**
1. Navigate to the Programs page as the Organisation A admin
2. Inspect the program list

**Expected result:** Only "AP_Org A Program" is visible; "AP_Org B Program" does not appear in the list

**Priority:** High

---

### TC-010 — The empty-state prompt does not appear when programs exist

**Preconditions:** Admin user is logged in; at least one program exists

**Steps:**
1. Navigate to the Programs page
2. Inspect the page for empty-state messaging

**Expected result:** The "no programs" message and create-first-program prompt are not visible; only the populated program list is shown

**Priority:** Medium

---

## Edge Cases

### TC-011 — Program with a maximum-length name is displayed without overflow or truncation artefacts

**Preconditions:** Admin user is logged in; a program with a 255-character name prefixed with `AP_` (e.g., `AP_` + "A" repeated to 255 chars total) and description "AP_Edge case program" exists

**Steps:**
1. Navigate to the Programs page
2. Inspect the row for the 255-character-name program

**Expected result:** The full name is rendered (or cleanly truncated with an ellipsis if truncation is the intended design); the row layout is not broken; no text overflows outside its container

**Priority:** Medium

---

### TC-012 — Program with a maximum-length description is displayed without layout breakage

**Preconditions:** Admin user is logged in; a program named "AP_Test Program" with a 500-character description prefixed with `AP_` (e.g., `AP_` + "B" repeated to 500 chars total) exists

**Steps:**
1. Navigate to the Programs page
2. Inspect the description for "AP_Test Program"

**Expected result:** The description is rendered (fully or truncated by design); the row height and page layout remain intact; no text overflows outside its container

**Priority:** Medium

---

### TC-013 — Program with special characters in name and description is displayed correctly

**Preconditions:** Admin user is logged in; a program named "AP_Informatique & IA - Niveau 2" with description "AP_Cours d'IA & ML: niveau avancé (100%)" exists

**Steps:**
1. Navigate to the Programs page
2. Inspect the row for "AP_Informatique & IA - Niveau 2"

**Expected result:** The name and description are rendered as literal text; `&` is displayed as `&` (not `&amp;`); `%`, `-`, and accented characters are displayed correctly

**Priority:** Medium

---

### TC-014 — Program name and description containing HTML tags are rendered as plain text

**Preconditions:** Admin user is logged in; a program named "AP_<b>Bold Program</b>" with description `<script>alert('xss')</script>` exists

**Steps:**
1. Navigate to the Programs page
2. Inspect the relevant row

**Expected result:** The name and description are displayed as literal strings; no bold formatting is applied; no script executes; no alert dialog appears

**Priority:** High

---

### TC-015 — Program with a description containing only whitespace shows a graceful empty or trimmed state

**Preconditions:** Admin user is logged in; a program named "AP_Whitespace Description Program" with a description of "   " (three spaces) exists

**Steps:**
1. Navigate to the Programs page
2. Inspect the description for "AP_Whitespace Description Program"

**Expected result:** The description either appears empty or displays a placeholder (e.g., "—" or "No description"); no raw whitespace string is rendered; no layout shift occurs

**Priority:** Low

---

### TC-016 — Program with a blank (empty) description is displayed without error

**Preconditions:** Admin user is logged in; a program named "AP_No Description Program" was created with no description provided

**Steps:**
1. Navigate to the Programs page
2. Inspect the row for "AP_No Description Program"

**Expected result:** The program name is displayed; the description field shows a graceful empty state (e.g., blank, dash, or "No description available"); no error message or broken layout appears

**Priority:** Medium

---

### TC-017 — Program list with a large number of programs is paginated or scrollable without performance degradation

**Preconditions:** Admin user is logged in; at least 10 programs with `AP_`-prefixed names exist with varying descriptions

**Steps:**
1. Navigate to the Programs page
2. Observe the rendering and scrolling behaviour
3. If pagination is present, navigate to the next page

**Expected result:** The page loads within an acceptable time; all programs are reachable via scrolling or pagination; no programs are silently omitted; the UI remains responsive

**Priority:** Medium

---

### TC-018 — Program with Unicode and multilingual characters in name and description is displayed correctly

**Preconditions:** Admin user is logged in; a program named "AP_Programmation C++ — Niveau 3 (高级)" with description "AP_面向对象编程 & algorithms" exists

**Steps:**
1. Navigate to the Programs page
2. Inspect the row for the Unicode-named program

**Expected result:** The name and description are rendered with all Unicode characters intact; no substitution characters (e.g., `?` or `□`) appear; bidirectional text (if present) is handled without layout issues

**Priority:** Medium

---

### TC-019 — Two programs with identical names are both displayed in the list

**Preconditions:** Admin user is logged in; two programs both named "AP_Data Science 2026" exist with different descriptions (system allows duplicates per DS-3)

**Steps:**
1. Navigate to the Programs page
2. Count the number of rows named "AP_Data Science 2026"

**Expected result:** Both entries appear as separate rows; neither entry is silently deduplicated or hidden; each row shows its own description

**Priority:** Low

---

### TC-020 — Programs list order is consistent across page reloads

**Preconditions:** Admin user is logged in; programs "AP_Web Development 2026", "AP_Data Science 2026", and "AP_Test Program" exist

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
| 6 | **Access control** — The AC does not specify which roles can view the Programs page. The story description implies admin-only access; it is unclear whether read-only admin roles or other roles should also see the list. |
| 7 | **Multi-tenancy / data isolation** — No AC addresses whether program lists are scoped to an organisation or tenant. TC-009 assumes tenant isolation, but this must be confirmed. |
| 8 | **Real-time updates** — The AC does not state whether the list should update automatically when another admin creates or deletes a program in a concurrent session. TC-004 assumes immediate update after local creation only. |
| 9 | **Truncation behaviour for long values** — It is not defined whether long names or descriptions should be truncated in the list view (with a tooltip or expand option) or displayed in full. TC-011 and TC-012 cannot have a precise expected result without this design decision. |
| 10 | **Search and filtering** — The story title mentions "filtering" but neither AC describes a filter or search capability. It is unclear whether filtering is in scope for this story or a separate one. |
| 11 | **List layout** — The AC does not specify whether name and description appear in separate columns or share a single cell. UI inspection shows a single "Program" column with stacked name and description text. |
| 12 | **Admin login precondition** — Neither AC scenario states that the user must be logged in as admin, though the story description implies admin access. |
| 13 | **API error handling** — No AC defines behaviour when the programs API returns an error (e.g., HTTP 500). Known defects [DS-72](https://legionqaschool.atlassian.net/browse/DS-72) / [DS-35](https://legionqaschool.atlassian.net/browse/DS-35) show an empty state instead of an error message; no dedicated TC covers this path. |
| 14 | **Row management actions** — AC covers name and description display only; edit/delete controls in each row are not specified. [DS-73](https://legionqaschool.atlassian.net/browse/DS-73) reports missing action icons on program rows. |
