# Feature: DS-5 — Program list filtering and display

> **User story:** As an admin user, I want to see all programs in a clear list so that I can quickly find and manage them.
>
> **Test data convention:** All program names and descriptions use the `AP_` prefix so test data is identifiable in Didaxis.

---

# Happy paths

## TC-001 — Programs page shows each program's name and description

Scenario: Program list renders name and description for each row
  Given I am logged in as admin
  And programs "AP_Web Development 2026" and "AP_Data Science 2026" exist
  When I navigate to the Programs page
  Then both programs appear in the list
  And each row shows both program name and description

## TC-002 — Empty state message and create prompt are shown when no programs exist

Scenario: Empty state appears when there are no programs
  Given I am logged in as admin
  And no programs exist in the system
  When I navigate to the Programs page
  Then I see a message indicating no programs have been created
  And I see a prompt or button to create the first program

## TC-003 — A single program is displayed correctly in the program list

Scenario: Single-row list view is correct
  Given I am logged in as admin
  And exactly one program named "AP_Test Program" exists with description "AP_A test program for QA purposes"
  When I navigate to the Programs page
  Then exactly one program row is visible
  And the row shows "AP_Test Program" and "AP_A test program for QA purposes"
  And no empty-state message is shown

## TC-004 — Newly created program appears in the list without requiring a manual reload

Scenario: New row appears immediately after creation
  Given I am logged in as admin
  And I am on the Programs page
  When I create "AP_Data Science 2026" with description "AP_Applied machine learning and statistics"
  Then "AP_Data Science 2026" appears in the list immediately
  And the row displays both the program name and description

## TC-005 — Empty state is replaced by the program list after the first program is created

Scenario: First create action transitions from empty state to table
  Given I am logged in as admin
  And no programs exist
  And I can see the empty-state view
  When I create "AP_Test Program" with description "AP_A test program"
  Then the empty-state message is no longer visible
  And the program list table is visible
  And "AP_Test Program" is present with its description

## TC-006 — Program list is still accessible after a page reload

Scenario: List data remains visible after page refresh
  Given I am logged in as admin
  And "AP_Web Development 2026" and "AP_Data Science 2026" exist
  When I open the Programs page
  And I reload the page
  Then both programs are still listed
  And their names and descriptions remain intact

---

# Negative

## TC-007 — Unauthenticated user is redirected away from the Programs page

Scenario: Logged-out users cannot access /programs
  Given I am not authenticated
  When I navigate directly to "/programs"
  Then I am redirected to the login page
  And the program list is not rendered
  And no program data is exposed

## TC-008 — Non-admin user cannot access the Programs page

Scenario: Non-admin role is denied access to program list
  Given I am logged in as a non-admin user
  When I navigate to "/programs"
  Then access is denied by redirect or access-denied message
  And the program list is not rendered

## TC-009 — Programs from other organisations are not shown in the list

Scenario: Program list is tenant-scoped
  Given I am logged in as an admin from Organisation A
  And Organisation A has "AP_Org A Program"
  And Organisation B has "AP_Org B Program"
  When I open the Programs page
  Then I see "AP_Org A Program"
  And I do not see "AP_Org B Program"

## TC-010 — The empty-state prompt does not appear when programs exist

Scenario: Empty-state content is hidden when table has rows
  Given I am logged in as admin
  And at least one program exists
  When I navigate to the Programs page
  Then I see the populated program list
  And I do not see "no programs" empty-state messaging

---

# Edge cases

## TC-011 — Program with a maximum-length name is displayed without overflow or truncation artefacts

Scenario: 255-character program name displays safely
  Given I am logged in as admin
  And a program exists with a 255-character name prefixed with "AP_"
  When I navigate to the Programs page
  Then the program row renders without layout breakage
  And the name is displayed fully or with consistent design-approved truncation

## TC-012 — Program with a maximum-length description is displayed without layout breakage

Scenario: Long description renders without breaking the row
  Given I am logged in as admin
  And a program "AP_Test Program" exists with a 500-character description
  When I navigate to the Programs page
  Then the description is rendered according to design
  And no text overflow breaks the layout

## TC-013 — Program with special characters in name and description is displayed correctly

Scenario: Special characters remain readable in list
  Given I am logged in as admin
  And a program named "AP_Informatique & IA - Niveau 2" exists
  And its description is "AP_Cours d'IA & ML: niveau avancé (100%)"
  When I navigate to the Programs page
  Then the name and description are displayed as literal text
  And "&" is displayed as "&" (not "&amp;")
  And accented and punctuation characters render correctly

## TC-014 — Program name and description containing HTML tags are rendered as plain text

Scenario: HTML-like strings are not interpreted as markup
  Given I am logged in as admin
  And a program named "AP_<b>Bold Program</b>" exists
  And its description is "<script>alert('xss')</script>"
  When I navigate to the Programs page
  Then the name and description are shown as literal strings
  And no bold formatting is applied from "<b>"
  And no script executes

## TC-015 — Program with a description containing only whitespace shows a graceful empty or trimmed state

Scenario: Whitespace-only description does not render as noisy text
  Given I am logged in as admin
  And "AP_Whitespace Description Program" exists with description "   "
  When I navigate to the Programs page
  Then the description appears as empty or a placeholder
  And raw whitespace-only content is not displayed as visible noise
  And layout remains stable

## TC-016 — Program with a blank (empty) description is displayed without error

Scenario: Empty description is handled gracefully
  Given I am logged in as admin
  And "AP_No Description Program" exists with no description
  When I navigate to the Programs page
  Then the program name is visible
  And the description area is blank or shows a placeholder
  And no error or broken layout appears

## TC-017 — Program list with a large number of programs is paginated or scrollable without performance degradation

Scenario: List remains usable with many rows
  Given I am logged in as admin
  And at least 10 programs with AP_-prefixed names exist
  When I navigate to the Programs page
  Then the page loads within acceptable time
  And all programs are reachable through scrolling or pagination
  And the UI remains responsive

## TC-018 — Program with Unicode and multilingual characters in name and description is displayed correctly

Scenario: Unicode and multilingual text displays intact
  Given I am logged in as admin
  And "AP_Programmation C++ — Niveau 3 (高级)" exists
  And its description is "AP_面向对象编程 & algorithms"
  When I navigate to the Programs page
  Then all Unicode characters display correctly
  And no substitution characters appear

## TC-019 — Two programs with identical names are both displayed in the list

Scenario: Duplicate names are shown as separate rows
  Given I am logged in as admin
  And two programs named "AP_Data Science 2026" exist with different descriptions
  When I navigate to the Programs page
  Then both entries are visible as separate rows
  And each row shows its own description

## TC-020 — Programs list order is consistent across page reloads

Scenario: Relative row order remains deterministic across refresh
  Given I am logged in as admin
  And "AP_Web Development 2026", "AP_Data Science 2026", and "AP_Test Program" exist
  When I note their relative order on the Programs page
  And I reload the page
  Then the same three programs appear in the same relative order

---

<!--
## Ambiguities and Gaps in DS-5 Acceptance Criteria

1. **Filtering is in title but absent from ACs** — The story title mentions filtering, but no acceptance criterion defines filter/search behavior.
2. **Sort order is unspecified** — ACs do not define deterministic ordering (alphabetical, created date, updated date, etc.).
3. **Scaling behavior is unspecified** — Pagination/infinite-scroll behavior for large lists is not described.
4. **Exact empty-state copy is unspecified** — AC requires a message and prompt but not exact wording.
5. **Description optionality is unclear** — AC implies name+description display but does not define behavior for blank/empty descriptions.
6. **Access control scope is unclear** — Story says admin user, but ACs do not explicitly define non-admin access rules.
7. **Tenant/organisation isolation not explicit** — ACs do not state whether program lists are global or tenant-scoped.
8. **Long text truncation rules are undefined** — No requirement defines line-clamp/ellipsis/tooltip behavior for long names and descriptions.
9. **Error-state behavior for list API failures is undefined** — ACs describe only normal and empty states.
10. **Concurrent updates are undefined** — Behavior when another user creates/deletes programs during list viewing is not specified.
11. **Row composition details are unspecified** — ACs mention key details but not whether fields are separate columns or stacked in one cell.
12. **Duplicate-name display expectation depends on DS-3 policy** — ACs do not explicitly state whether duplicates can exist and how they should render if allowed.
-->
