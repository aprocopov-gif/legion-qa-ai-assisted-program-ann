## Coverage snapshot
- Page: `/programs`
- Already covered (ds1-create-program.spec.ts): modal fields, create all/name-only, Create button states, whitespace rejection, non-admin, **Cancel** dismiss, max length, special chars, XSS, duplicate, max description, list refresh, trim whitespace
- Not covered in ds1: Escape dismiss, modal X close, reopen-after-dismiss draft state, empty-state `Create Program` button
- Explored via a11y tree: this session

## Selected gap (one flow)
**Flow:** Escape key dismisses the New Program modal without saving
**Why this one:** TC-009 only exercises the Cancel button; Escape is a distinct dismiss path that prevents accidental program creation and is visible in the modal interaction model.

## Gherkin test plan

Feature: Programs — Escape dismiss on New Program modal (discovered)

  # Positive path
  Scenario: Escape closes the New Program modal without creating a program
    Given I am logged in as admin
    And I am on the Programs page
    When I click "+ New Program"
    And I fill Program Name with "AP_Escape Cancel Test"
    And I fill Description with "Should not be saved"
    And I press Escape
    Then the "New Program" dialog is not visible
    And I do not see program "AP_Escape Cancel Test" in the list

  # Edge case
  Scenario: Reopening the modal after Escape retains previously entered values
    Given I am logged in as admin
    And I am on the Programs page
    And I have opened the New Program modal
    And I have filled Program Name with "AP_Escape Draft"
    And I have filled Description with "Draft description"
    And I pressed Escape
    When I click "+ New Program" again
    Then the Program Name field has value "AP_Escape Draft"
    And the Description field has value "Draft description"

## Locator hints (from a11y tree)
- Open modal: `button` named `+ New Program`
- Dialog: `dialog` named `New Program`
- Program Name: `textbox` named `Program Name`
- Description: `textbox` named `Description`
- Dismiss: `Escape` key (no dedicated accessible close name on X button)

## For test-writer
- Suggested file: `tests/ds1-create-program.spec.ts` (TC-018, TC-019)
- POM updates: `NewProgramModal.dismissWithEscape()` using `page.keyboard.press('Escape')`
