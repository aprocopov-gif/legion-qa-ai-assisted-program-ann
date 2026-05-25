# Feature: DS-1 — Create new academic program

> **User story:** As an admin user, I want to create a new academic program so that I can begin designing its curriculum structure.
>
> **Test data convention:** All program names and descriptions use the `AP_` prefix so test data is identifiable in Didaxis.

---

# Happy paths

Scenario: Navigate to program creation form
  Given I am logged in as admin
  When I navigate to the Programs page
  And I click "+ New Program"
  Then I see the program creation form with fields: Program Name, Description

Scenario: Successfully create a program with all fields populated
  Given I am on the program creation form
  When I fill in Program Name with "AP_Web Development 2026"
  And I fill in Description with "AP_Full-stack web development program"
  And I click Create
  Then the modal closes
  And the program list shows "AP_Web Development 2026"

Scenario: Successfully create a program with only the required field
  Given I am on the program creation form
  When I fill in Program Name with "AP_Data Science 2026"
  And I leave the Description field empty
  And I click Create
  Then the modal closes
  And the program list shows "AP_Data Science 2026"

Scenario: Create button becomes enabled once Program Name is filled
  Given I am on the program creation form
  And the Program Name field is empty
  And the Create button is disabled
  When I fill in Program Name with "AP_Computer Science"
  Then the Create button becomes enabled

Scenario: Newly created program appears in the list without a page refresh
  Given I am on the Programs page
  When I click "+ New Program"
  And I fill in Program Name with "AP_Machine Learning 2026"
  And I fill in Description with "AP_Machine learning curriculum"
  And I click Create
  Then the modal closes
  And "AP_Machine Learning 2026" appears in the program list without a manual page reload

---

# Negative

Scenario: Validation prevents empty program name — Create button is disabled
  Given I am on the program creation form
  When I leave the Program Name field empty
  Then the Create button is disabled

Scenario: Create button remains disabled when only Description is filled
  Given I am on the program creation form
  When I leave the Program Name field empty
  And I fill in Description with "AP_Full-stack web development program"
  Then the Create button is disabled

Scenario: Program Name containing only whitespace is rejected
  Given I am on the program creation form
  When I fill in Program Name with "     " (five space characters)
  And I fill in Description with "AP_Description should not matter"
  Then the Create button is disabled or a validation error is shown
  And no program with a blank name is created

Scenario: Cancelling the form does not create a program
  Given I am on the program creation form
  And I have filled in Program Name with "AP_Cancelled Program"
  And I have filled in Description with "AP_This should not be saved"
  When I close the modal via Cancel button, X icon, or pressing Escape
  Then the modal closes
  And "AP_Cancelled Program" does not appear in the program list

Scenario: Non-admin user cannot access the program creation form
  Given I am logged in as a non-admin user (e.g., instructor or student)
  When I navigate to the Programs page
  Then the "+ New Program" button is hidden or disabled
  And the program creation form is not accessible

---

# Edge cases

Scenario: Program Name at maximum allowed length is accepted
  Given I am on the program creation form
  When I fill in Program Name with a 255-character string starting with "AP_"
  And I fill in Description with "AP_Max length program name test"
  And I click Create
  Then the program is created successfully
  And it appears in the list with the full name

Scenario: Program Name exceeding maximum length is rejected or truncated
  Given I am on the program creation form
  When I paste a 256-character string starting with "AP_" into the Program Name field
  Then the input is truncated to the maximum allowed length or a validation message is shown
  And the excess characters are not accepted

Scenario: Program Name with special characters is handled correctly
  Given I am on the program creation form
  And no program named "AP_Web Dev & Design: 2026 (Part 1)" exists
  When I fill in Program Name with "AP_Web Dev & Design: 2026 (Part 1)"
  And I fill in Description with "AP_Special characters in program name"
  And I click Create
  Then the program is created
  And the name renders correctly in the list without encoding artifacts (e.g., "&amp;" is not shown instead of "&")

Scenario: Program Name with HTML/script tags does not execute
  Given I am on the program creation form
  When I fill in Program Name with "AP_<script>alert('xss')</script>"
  And I fill in Description with "AP_XSS prevention test description"
  And I click Create (if the button is enabled)
  Then the input is stored and displayed as plain text
  And no script executes
  And no alert dialog appears

Scenario: Duplicate program name is handled consistently
  Given a program named "AP_Web Development 2026" already exists in the list
  When I open the program creation form
  And I fill in Program Name with "AP_Web Development 2026"
  And I fill in Description with "AP_Attempted duplicate program"
  And I click Create
  Then either an error message informs the admin that a program with this name already exists
  Or the duplicate is created if duplicates are permitted
  And the behavior is consistent and documented

Scenario: Description field at maximum allowed length is accepted
  Given I am on the program creation form
  When I fill in Program Name with "AP_New Program"
  And I paste a 1000-character string starting with "AP_" into the Description field
  And I click Create
  Then the program is created successfully
  And the full description is stored

Scenario: Program Name with leading and trailing whitespace is trimmed
  Given I am on the program creation form
  And no program named "AP_Web Development 2026" exists
  When I fill in Program Name with "  AP_Web Development 2026  " (with leading and trailing spaces)
  And I fill in Description with "AP_Whitespace trim test"
  And I click Create
  Then the program is created
  And it appears in the list as "AP_Web Development 2026" with whitespace trimmed

---

<!--
## Ambiguities and Gaps in the Acceptance Criteria

| # | Gap / Ambiguity |
|---|----------------|
| 1 | **Maximum field lengths** — No max length is specified for Program Name or Description. Scenarios above assume 255 and 1000 characters respectively; actual limits need confirmation. |
| 2 | **Duplicate names** — The ACs do not state whether duplicate program names are allowed. The duplicate scenario cannot have a single definitive outcome without a product decision. |
| 3 | **Description optionality** — The ACs list Description as a field but never explicitly state it is optional. This should be confirmed. |
| 4 | **Cancel / dismiss behavior** — No AC covers what happens when the user cancels or closes the form mid-entry. |
| 5 | **Role-based access** — The ACs only describe admin behavior. It is unclear whether the "+ New Program" button should be hidden, disabled, or redirect non-admins. |
| 6 | **Program list sort order after creation** — The AC states the list "shows" the new program but does not specify where it appears (top of list, alphabetical, by creation date). |
| 7 | **Input sanitization** — No mention of how special characters or HTML in fields should be handled. |
| 8 | **Form accessibility** — No AC covers keyboard navigation, screen reader support, or focus management after the modal opens/closes. |
| 9 | **Concurrent submissions** — No AC covers what happens if the Create button is clicked multiple times rapidly (double-submit protection). |
| 10 | **Error handling for server failures** — No AC describes the UX if the creation API call fails (network error, 500, etc.). |
| 11 | **Whitespace definition** — AC 3 validates empty Program Name but does not clarify whether tab characters or other Unicode whitespace are treated the same as spaces. |
| 12 | **Trim on valid names** — No AC explicitly states whether leading/trailing whitespace on otherwise valid names is trimmed before storage. |
-->
