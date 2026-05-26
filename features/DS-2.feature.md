# Feature: DS-2 — Edit existing program details

> **User story:** As an admin user, I want to edit an existing program's details so that I can correct or update program information after creation.
>
> **Test data convention:** All program names and descriptions use the `AP_` prefix so test data is identifiable in Didaxis.

---

# Happy paths

## TC-001 — Open program for editing

Scenario: Edit form opens pre-populated with current program data
  Given I am logged in as admin
  And I am on the Programs page
  And a program "AP_Web Development 2026" exists
  When I click the edit icon on "AP_Web Development 2026"
  Then I see the edit form
  And the Program Name field contains "AP_Web Development 2026"
  And the Description field contains the current description of "AP_Web Development 2026"

## TC-002 — Successfully edit a program name

Scenario: Admin changes the program name and saves
  Given I am logged in as admin
  And I am editing "AP_Web Development 2026"
  When I clear the Program Name field
  And I type "AP_Web Development 2026 - Updated"
  And I click Save
  Then the edit modal closes
  And the program list immediately shows "AP_Web Development 2026 - Updated"
  And "AP_Web Development 2026" no longer appears in the list

## TC-003 — Successfully edit a program description

Scenario: Admin changes only the description and saves
  Given I am logged in as admin
  And I am editing "AP_Web Development 2026"
  When I clear the Description field
  And I type "AP_Updated full-stack web development program"
  And I click Save
  Then the edit modal closes
  And the program "AP_Web Development 2026" now shows description "AP_Updated full-stack web development program"

## TC-004 — Edit preserves unchanged fields

Scenario: Changing only the description leaves the name unchanged
  Given I am logged in as admin
  And I am editing "AP_Data Science 2026"
  When I only change the Description to "AP_Applied machine learning and statistics"
  And I click Save
  Then the modal closes
  And the program name remains "AP_Data Science 2026"

## TC-005 — Edit form pre-populates both fields

Scenario: Both name and description are pre-filled when opening edit form
  Given I am logged in as admin
  And a program "AP_Machine Learning 2026" with description "AP_Intro to ML" exists
  When I click the edit icon on "AP_Machine Learning 2026"
  Then the Program Name field contains "AP_Machine Learning 2026"
  And the Description field contains "AP_Intro to ML"

---

# Negative

## TC-006 — Save is disabled when Program Name is cleared

Scenario: Save button is disabled when Program Name is empty
  Given I am logged in as admin
  And I am editing "AP_Web Development 2026"
  When I clear the Program Name field
  Then the Save button is disabled

## TC-007 — Cannot save with whitespace-only Program Name

Scenario: Program Name containing only spaces is rejected
  Given I am logged in as admin
  And I am editing "AP_Web Development 2026"
  When I clear the Program Name field
  And I type "     "
  And I click Save
  Then the edit form shows a validation error
  And the program is not updated

## TC-008 — Cancel discards changes

Scenario: Clicking Cancel does not save any edits
  Given I am logged in as admin
  And I am editing "AP_Web Development 2026"
  When I change the Program Name to "AP_Should Not Be Saved"
  And I click Cancel
  Then the edit modal closes
  And the program list still shows "AP_Web Development 2026"
  And "AP_Should Not Be Saved" does not appear in the list

## TC-009 — Non-admin user cannot access the edit form

Scenario: Edit icon is not available to non-admin users
  Given I am logged in as a non-admin user
  And I am on the Programs page
  Then I do not see an edit icon on any program row

## TC-010 — Duplicate program name is rejected

Scenario: Saving with a name that already exists shows an error
  Given I am logged in as admin
  And programs "AP_Web Development 2026" and "AP_Data Science 2026" both exist
  And I am editing "AP_Web Development 2026"
  When I change the Program Name to "AP_Data Science 2026"
  And I click Save
  Then an error message is shown indicating the name already exists
  And the program "AP_Web Development 2026" remains unchanged in the list

## TC-011 — Double-clicking Save does not submit twice

Scenario: Rapid double-click on Save creates only one update
  Given I am logged in as admin
  And I am editing "AP_Web Development 2026"
  When I change the Program Name to "AP_Web Development 2026 - Updated"
  And I double-click the Save button
  Then only one PATCH request is sent
  And the program appears once in the list as "AP_Web Development 2026 - Updated"

---

# Edge cases

## TC-012 — Program Name at maximum allowed length is accepted

Scenario: 255-character program name is saved successfully
  Given I am logged in as admin
  And I am editing "AP_Web Development 2026"
  When I change the Program Name to a 255-character string starting with "AP_"
  And I click Save
  Then the modal closes
  And the program appears in the list with the full 255-character name

## TC-013 — Program Name exceeding maximum length is rejected

Scenario: Program name longer than 255 characters is not accepted
  Given I am logged in as admin
  And I am editing "AP_Web Development 2026"
  When I type a 256-character string into the Program Name field
  Then the input does not accept characters beyond the 255-character limit
  Or an error message is shown on Save

## TC-014 — Description at maximum allowed length is accepted

Scenario: 500-character description is saved successfully
  Given I am logged in as admin
  And I am editing "AP_Web Development 2026"
  When I change the Description to a 500-character string starting with "AP_"
  And I click Save
  Then the modal closes
  And the program's description is updated to the 500-character value

## TC-015 — Program Name with special characters is accepted

Scenario: Special characters in program name are saved and displayed correctly
  Given I am logged in as admin
  And I am editing "AP_Web Development 2026"
  When I change the Program Name to "AP_Web Dev & Design: 2026 (Part 1)"
  And I click Save
  Then the modal closes
  And the program list shows "AP_Web Dev & Design: 2026 (Part 1)"

## TC-016 — Program Name with HTML/script tags is rendered as plain text

Scenario: HTML in program name is not executed after edit
  Given I am logged in as admin
  And I am editing "AP_Web Development 2026"
  When I change the Program Name to "AP_<script>alert('xss')</script>"
  And I click Save
  Then the tag is stored and displayed as plain text
  And no script is executed in the browser

## TC-017 — Leading and trailing whitespace in Program Name is trimmed

Scenario: Whitespace around program name is trimmed on save
  Given I am logged in as admin
  And I am editing "AP_Web Development 2026"
  When I change the Program Name to "  AP_Web Development 2026 - Trimmed  "
  And I click Save
  Then the modal closes
  And the program list shows "AP_Web Development 2026 - Trimmed" without surrounding spaces

## TC-018 — Updated program appears in the list immediately without page refresh

Scenario: Program list reflects edit without reload
  Given I am logged in as admin
  And I am editing "AP_Machine Learning 2026"
  When I change the Program Name to "AP_Machine Learning 2026 - v2"
  And I click Save
  Then the modal closes
  And the program list immediately shows "AP_Machine Learning 2026 - v2"
  And I have not refreshed the page

## TC-019 — Rapid double-click on Save does not submit the form twice

Scenario: Double-clicking Save creates only one update
  Given I am logged in as admin
  And I am editing "AP_Web Development 2026"
  When I change the Program Name to "AP_Web Development 2026 - Updated"
  And I double-click the Save button rapidly (two clicks ~200ms apart)
  Then exactly one PATCH request is sent to the API
  And the program appears once in the list as "AP_Web Development 2026 - Updated"
  And no duplicate entries appear

## TC-020 — Server error during save displays an appropriate error message

Scenario: Server returns 500 error on save — modal stays open with error message
  Given I am logged in as admin
  And I am editing "AP_Web Development 2026"
  And the server is configured to return a 500 error on save
  When I change the Program Name to "AP_Web Development 2026 - Updated"
  And I click Save
  Then the edit modal remains open
  And an error message is displayed informing the admin that the save failed
  And the program list still shows the original name "AP_Web Development 2026"

---

<!--
## Ambiguities & gaps found in DS-2 acceptance criteria

1. **Maximum field lengths** — The ticket does not specify maximum characters for Program Name or Description.
   Assumed 255 for name and 500 for description, consistent with DS-1. Needs confirmation.

2. **Save button state with no changes** — The ticket does not say whether Save should be enabled or disabled
   when the user opens the form but makes no edits. Needs UX clarification.

3. **Error message wording** — No specific error message text is given for duplicate name rejection.
   TC-010 refers to "an error message" generically; exact copy needed.

4. **Double-submit guard** — No AC covers what happens on double-click of Save (TC-019 added as edge case).
   This was identified as an existing bug in DS-41/DS-43; confirm whether it is in scope for DS-2.

5. **Non-admin access** — The ticket only describes admin behaviour. TC-009 (non-admin) was added
   as a negative scenario; confirm whether non-admin role testing is in scope.

6. **Optimistic vs. server-confirmed update** — TC-018 assumes the list updates immediately (optimistic UI).
   Confirm whether the app waits for server confirmation before closing the modal and refreshing the list.

7. **Navigate-away behaviour** — No AC addresses whether unsaved edits are discarded silently or with a
   warning when the user navigates away from the page mid-edit (TC-011).

8. **Server error handling** — No AC describes the UX when the save API call returns a 5xx error (TC-020).
   Assumed: modal stays open and an error message is displayed.
-->
