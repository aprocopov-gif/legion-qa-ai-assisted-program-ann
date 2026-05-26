# Feature: DS-3 — Program name validation and duplicate prevention

> **User story:** As an admin user, I want the system to prevent invalid or duplicate program names so that data integrity is maintained.
>
> **Test data convention:** All program names and descriptions use the `AP_` prefix so test data is identifiable in Didaxis.

---

# Happy paths

## TC-001 — Program name with special characters is accepted and rendered correctly

Scenario: Special characters in program name are saved without encoding artifacts
  Given I am logged in as admin
  And I am on the Programs page
  When I click "+ New Program"
  And I enter "AP_Informatique & IA - Niveau 2" as the Program Name
  And I enter "AP_Program with special characters" as the Description
  And I click Create
  Then the modal closes
  And the program list displays "AP_Informatique & IA - Niveau 2"
  And the name does not contain "&amp;" or any HTML-encoded characters

## TC-002 — Program name with alphanumeric characters and spaces is accepted

Scenario: Standard alphanumeric program name is created successfully
  Given I am logged in as admin
  And I am on the Programs page
  When I click "+ New Program"
  And I enter "AP_Web Development 2026" as the Program Name
  And I enter "AP_Full-stack web development program" as the Description
  And I click Create
  Then the modal closes
  And "AP_Web Development 2026" appears in the program list

## TC-003 — Program name with leading and trailing whitespace is trimmed and saved

Scenario: Leading and trailing spaces are stripped before saving the program name
  Given I am logged in as admin
  And I am on the Programs page
  When I click "+ New Program"
  And I enter "  AP_Data Science 2026  " (with two leading and two trailing spaces) as the Program Name
  And I click Create
  Then the modal closes
  And the program list displays "AP_Data Science 2026" with whitespace trimmed
  And the stored name does not include leading or trailing spaces

## TC-004 — A name previously used by a deleted program can be reused

Scenario: Deleted program name becomes available for a new program
  Given I am logged in as admin
  And a program named "AP_Web Development 2026" previously existed and has been deleted
  When I click "+ New Program"
  And I enter "AP_Web Development 2026" as the Program Name
  And I click Create
  Then the program is created successfully
  And no duplicate-name error is shown

---

# Negative

## TC-005 — Program name consisting only of whitespace is rejected

Scenario: Whitespace-only program name is not accepted
  Given I am logged in as admin
  And I am on the New Program form
  When I enter "   " (three spaces) as the Program Name
  Then the Create button is disabled
  And the form is not submitted
  And no program is created

## TC-006 — Empty Program Name field prevents form submission

Scenario: Create button is disabled when Program Name is empty
  Given I am logged in as admin
  And I am on the New Program form
  When I leave the Program Name field empty
  And I enter "AP_Description without program name" as the Description
  Then the Create button is disabled
  And the form cannot be submitted

## TC-007 — Duplicate program name (exact match) is rejected with an error message

Scenario: Submitting a name that already exists shows an error and does not create a second program
  Given I am logged in as admin
  And a program "AP_Web Development 2026" already exists in the list
  When I click "+ New Program"
  And I enter "AP_Web Development 2026" as the Program Name
  And I click Create
  Then an error message is displayed indicating the name already exists
  And only one program named "AP_Web Development 2026" appears in the list

## TC-008 — Duplicate-name error message is specific and actionable

Scenario: The duplicate error message references the name conflict explicitly
  Given I am logged in as admin
  And a program "AP_Web Development 2026" already exists in the list
  When I try to create another program named "AP_Web Development 2026"
  And I click Create
  Then the error message contains "already exists" or "duplicate"
  And the message does not just say "Something went wrong"

## TC-009 — Non-admin user cannot access the program creation form

Scenario: The "+ New Program" button is not visible to non-admin users
  Given I am logged in as a non-admin user
  And I am on the Programs page
  Then the "+ New Program" button is not visible

---

# Edge cases

## TC-010 — Program name consisting only of tab characters is rejected

Scenario: Tab-only program name is treated as empty and rejected
  Given I am logged in as admin
  And I am on the New Program form
  When I enter a single tab character as the Program Name
  Then the Create button is disabled
  And the form is not submitted

## TC-011 — Program name with a mix of spaces and tabs is rejected

Scenario: Mixed whitespace-only program name is rejected
  Given I am logged in as admin
  And I am on the New Program form
  When I enter " \t  \t " (a combination of spaces and tabs only) as the Program Name
  Then the Create button is disabled
  And the form is not submitted

## TC-012 — Single-character program name is accepted

Scenario: A program name of just one character is valid
  Given I am logged in as admin
  And I am on the New Program form
  When I enter "AP_A" as the Program Name
  And I click Create
  Then the modal closes
  And "AP_A" appears in the program list

## TC-013 — Program name at the maximum allowed length is accepted

Scenario: A 255-character program name is saved successfully
  Given I am logged in as admin
  And I am on the New Program form
  When I enter a 255-character string starting with "AP_" as the Program Name
  And I click Create
  Then the modal closes
  And the program appears in the list with the full 255-character name

## TC-014 — Program name exceeding maximum allowed length is rejected or truncated

Scenario: A 256-character program name is not accepted
  Given I am logged in as admin
  And I am on the New Program form
  When I paste a 256-character string starting with "AP_" into the Program Name field
  Then either the input is truncated to 255 characters
  Or the Create button is disabled
  And no over-length name is stored in the database

## TC-015 — Program name with HTML/script tags is stored and displayed as plain text

Scenario: HTML injection in program name does not execute in the browser
  Given I am logged in as admin
  And I am on the New Program form
  When I enter "AP_<script>alert('xss')</script>" as the Program Name
  And I click Create (if enabled)
  Then the program name is displayed as plain text
  And no alert dialog is triggered by the browser

## TC-016 — Duplicate check behavior is consistent for case-variant names

Scenario: Submitting a case-variant of an existing name produces a consistent outcome
  Given I am logged in as admin
  And a program "AP_Case Test 123456789" exists in the list
  When I try to create a new program with the name "ap_case test 123456789" (all lowercase)
  And I click Create
  Then either an error indicates a duplicate exists (case-insensitive check)
  Or the program is created successfully (case-sensitive check)
  And the outcome is consistent across repeated attempts

## TC-017 — Program name with Unicode and multilingual characters is accepted

Scenario: Unicode characters in program name are stored and displayed correctly
  Given I am logged in as admin
  And I am on the New Program form
  When I enter "AP_Programmation C++ — Niveau 3 (高级)" as the Program Name
  And I click Create
  Then the modal closes
  And the program appears in the list with all Unicode characters intact
  And no substitution characters (e.g., ?) are displayed

## TC-018 — Duplicate name validation is enforced server-side after a page reload

Scenario: Duplicate check is not bypassed by reloading the page
  Given I am logged in as admin
  And a program "AP_Web Development 2026" exists in the list
  When I reload the Programs page
  And I open the New Program form
  And I enter "AP_Web Development 2026" as the Program Name
  And I click Create
  Then an error is returned indicating the name already exists
  And the duplicate check is not bypassed by the page reload

## TC-019 — Program name consisting only of numeric characters is accepted

Scenario: A numeric-only program name is valid
  Given I am logged in as admin
  And I am on the New Program form
  When I enter "AP_2026" as the Program Name
  And I click Create
  Then the modal closes
  And "AP_2026" appears in the program list

## TC-020 — Rapid double-click on Create does not produce duplicate programs

Scenario: Double-clicking Create submits the form exactly once
  Given I am logged in as admin
  And I am on the New Program form
  And I have entered "AP_Unique Program Name 001" as the Program Name
  When I double-click the Create button
  Then the modal closes
  And exactly one program named "AP_Unique Program Name 001" appears in the list
  And no duplicate entries are created

---

<!--
## Ambiguities & gaps found in DS-3 acceptance criteria

1. **Case sensitivity of duplicate check** — AC-3 uses an exact-match scenario but does not state whether
   the check is case-insensitive. TC-016 cannot have a definitive expected result without this decision.

2. **Maximum field length** — No character limit is defined in the ACs. TC-013 and TC-014 assume 255
   characters, consistent with DS-1/DS-2. Actual limit must be confirmed.

3. **Definition of whitespace** — AC-1 uses spaces only. It is unclear whether tab characters (`\t`),
   non-breaking spaces (`\u00a0`), or other Unicode whitespace are also trimmed and treated as empty
   (TC-010, TC-011).

4. **Other required fields** — AC-2 mentions "other required fields" without naming them. Tests assume
   Description is optional; this must be confirmed.

5. **Duplicate check scope** — AC-3 does not clarify whether uniqueness is per organisation or global.
   TC-007/TC-018 assume per-system scope.

6. **Name reuse after deletion** — No AC addresses whether a deleted program's name becomes available
   again. TC-004 assumes it does; confirmation is needed.

7. **Error message wording** — AC-3 states "an error indicating the name already exists" with no exact
   copy. TC-008 uses "already exists|duplicate" as a regex; agreed wording is needed.

8. **Client-side vs. server-side validation** — AC-1 does not specify where the whitespace check is
   enforced. TC-018 documents that the duplicate check appears to be client-side only (known defect).

9. **Trim on valid names** — AC-1 confirms trimming for whitespace-only input but does not state whether
   leading/trailing whitespace on valid names (e.g., "  AP_Data Science  ") is also trimmed (TC-003).

10. **Double-submit guard** — AC-3 covers duplicate names across separate submissions but does not address
    rapid double-click on Create (TC-020). Known app defect: double-click creates duplicate programs.

11. **Access control** — No AC specifies which roles can create programs. TC-009 assumes admin-only;
    explicit confirmation is needed, especially for read-only admin sub-roles.
-->
