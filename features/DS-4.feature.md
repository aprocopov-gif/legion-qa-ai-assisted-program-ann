# Feature: DS-4 — Delete program with confirmation

> **User story:** As an admin user, I want to delete a program I no longer need, with a confirmation step to prevent accidental deletion.
>
> **Test data convention:** All program names and descriptions use the `AP_` prefix so test data is identifiable in Didaxis.

---

# Happy paths

## TC-001 — Confirmed deletion removes the program from the program list

Scenario: Admin confirms delete and the selected program is removed
  Given I am logged in as admin
  And a program named "AP_Test Program" exists in the list
  When I click the delete icon for "AP_Test Program"
  Then I see a confirmation dialog
  When I confirm deletion
  Then the confirmation dialog closes
  And "AP_Test Program" is no longer present in the program list
  And no error message is displayed

## TC-002 — Cancelling the confirmation dialog leaves the program intact

Scenario: Admin cancels deletion from the confirmation dialog
  Given I am logged in as admin
  And a program named "AP_Test Program" exists in the list
  When I click the delete icon for "AP_Test Program"
  Then I see a confirmation dialog
  When I click Cancel in the confirmation dialog
  Then the dialog closes
  And "AP_Test Program" remains in the program list with unchanged details

## TC-003 — Deleting one program does not affect other programs in the list

Scenario: Deleting one program preserves all other programs
  Given I am logged in as admin
  And programs "AP_Test Program" and "AP_Data Science 2026" both exist in the list
  When I delete "AP_Test Program" and confirm
  Then "AP_Test Program" is removed
  And "AP_Data Science 2026" still exists with unchanged data

## TC-004 — Deleted program name becomes available for a new program

Scenario: Name reuse is allowed after successful deletion
  Given I am logged in as admin
  And "AP_Test Program" was deleted successfully
  When I create a new program with name "AP_Test Program"
  Then the program is created successfully
  And no duplicate-name error is shown
  And "AP_Test Program" appears again as a new entry

## TC-005 — Confirmation dialog displays the correct program name before deletion

Scenario: Confirmation dialog references the exact selected program
  Given I am logged in as admin
  And programs "AP_Test Program" and "AP_Web Development 2026" exist
  When I click the delete icon for "AP_Web Development 2026"
  Then the confirmation dialog message contains "AP_Web Development 2026"
  And the dialog does not show a different or placeholder name

## TC-006 — Deletion is persisted after a page reload

Scenario: Deleted program does not return after reload
  Given I am logged in as admin
  And "AP_Test Program" exists
  When I delete "AP_Test Program" and confirm
  And I reload the Programs page
  Then "AP_Test Program" is still absent from the list

---

# Negative

## TC-007 — Non-admin user does not see the delete icon

Scenario: Delete controls are unavailable to non-admin users
  Given I am logged in as a non-admin user
  And "AP_Test Program" exists in the list
  When I inspect the Programs page rows
  Then no delete icon is visible for any program
  And direct access to the delete endpoint is denied

## TC-008 — Dismissing the confirmation dialog leaves the program intact

Scenario: Dismiss action behaves like cancel and does not delete
  Given I am logged in as admin
  And "AP_Test Program" exists
  When I click the delete icon for "AP_Test Program"
  And I dismiss the confirmation dialog
  Then the dialog closes
  And "AP_Test Program" remains in the list
  And no deletion is triggered

## TC-009 — Deletion does not proceed when the network is unavailable at confirmation

Scenario: Network failure during delete confirmation keeps program intact
  Given I am logged in as admin
  And "AP_Test Program" exists
  And delete requests are failing due to network error
  When I confirm deletion for "AP_Test Program"
  Then deletion does not complete
  And "AP_Test Program" remains in the list after refresh
  And the UI shows deletion failure feedback

## TC-010 — Direct API call to delete endpoint without admin credentials is rejected

Scenario: Unauthorized delete API call does not remove the program
  Given a non-admin session token is available
  And "AP_Test Program" exists
  When I send a DELETE request for "AP_Test Program" using the non-admin token
  Then the API responds with 401 or 403
  And "AP_Test Program" still exists in the list

## TC-011 — Cancelling deletion multiple times does not accumulate side effects

Scenario: Repeated cancel actions never trigger accidental deletion
  Given I am logged in as admin
  And "AP_Test Program" exists
  When I open and cancel the deletion dialog for "AP_Test Program" six times
  Then "AP_Test Program" remains in the list
  And no ghost state or unexpected error appears

---

# Edge cases

## TC-012 — Deleting the only program in the list shows an empty-state message

Scenario: Deleting the last remaining program transitions to empty state
  Given I am logged in as admin
  And exactly one program named "AP_Test Program" exists
  When I delete "AP_Test Program" and confirm
  Then the program list has no programs
  And an appropriate empty-state indication is displayed
  And the page layout remains stable

## TC-013 — Program with a name containing special characters can be deleted

Scenario: Program names with ampersands are shown correctly in confirmation
  Given I am logged in as admin
  And a program named "AP_Informatique & IA - Niveau 2" exists
  When I click the delete icon for "AP_Informatique & IA - Niveau 2"
  Then the confirmation dialog displays "AP_Informatique & IA - Niveau 2" using "&"
  And the dialog does not display "&amp;"
  When I confirm deletion
  Then the program is removed from the list

## TC-014 — Program with a maximum-length name can be deleted and the dialog renders it without overflow

Scenario: 255-character program name deletes successfully
  Given I am logged in as admin
  And a program with a 255-character name starting with "AP_" exists
  When I click delete for that program
  Then the confirmation dialog renders the full name without broken layout
  When I confirm deletion
  Then the program is removed successfully

## TC-015 — Pressing Escape while the confirmation dialog is open cancels deletion

Scenario: Escape key acts as cancel for the confirmation dialog
  Given I am logged in as admin
  And "AP_Test Program" exists
  When I open the deletion confirmation for "AP_Test Program"
  And I dismiss the dialog via Escape-equivalent action
  Then the dialog closes
  And "AP_Test Program" remains in the list

## TC-016 — Rapid double-click on Confirm does not trigger duplicate deletion requests

Scenario: Confirm action is processed only once
  Given I am logged in as admin
  And "AP_Test Program" exists
  When I attempt a rapid double-confirm on deletion
  Then only one deletion request is processed
  And "AP_Test Program" is removed once
  And no duplicate API side effects occur

## TC-017 — Confirmation dialog is modal and blocks interaction with the program list behind it

Scenario: Background interactions are blocked while confirmation is open
  Given I am logged in as admin
  And programs "AP_Test Program" and "AP_Data Science 2026" exist
  When the confirmation dialog for "AP_Test Program" is open
  And I try to click delete for "AP_Data Science 2026" behind the dialog
  Then the background click is blocked
  And no second confirmation dialog opens
  And no additional program is deleted

## TC-018 — Navigating away from the page while the confirmation dialog is open does not delete the program

Scenario: Leaving the page while dialog is open implicitly cancels deletion
  Given I am logged in as admin
  And "AP_Test Program" exists
  When I open the delete confirmation for "AP_Test Program"
  And I navigate away and later return to the Programs page
  Then "AP_Test Program" still exists in the list

## TC-019 — Program with a name containing HTML tags shows the name as plain text in the confirmation dialog

Scenario: HTML-like program names are displayed as literal text in confirmation
  Given I am logged in as admin
  And a program named "AP_<b>Bold Program</b>" exists
  When I click delete for "AP_<b>Bold Program</b>"
  Then the confirmation dialog displays the literal string "AP_<b>Bold Program</b>"
  And no HTML formatting is applied
  And no script executes

---

<!--
## Ambiguities and Gaps in DS-4 Acceptance Criteria

1. **Dialog wording is unspecified** — The AC says a confirmation dialog appears, but does not define title/body text or exact button labels.
2. **Dialog implementation detail** — Current behavior appears to use native `window.confirm()`, not a custom modal. This affects testability of X button and focus behaviors.
3. **Delete control semantics** — AC mentions a "delete icon", but not its accessibility label. Tests rely on `Delete {ProgramName}` naming.
4. **Delete type (soft vs hard delete)** — AC only states item is removed from list; permanence/archival behavior is unspecified.
5. **Cascade behavior is undefined** — No expected handling for linked entities when deleting a program with dependencies.
6. **Role granularity is unclear** — Story says "admin user" but does not define sub-roles (e.g., read-only admin variants).
7. **Cancel mechanisms beyond button** — AC includes Cancel button only, not Escape/outside click/navigation outcomes.
8. **Error UX for failed delete** — AC does not define expected UI feedback when delete fails due to network/server issues.
9. **Post-delete success feedback** — AC does not specify whether toasts or notifications should appear on success.
10. **Concurrency behavior missing** — AC does not define expected outcome when two users delete the same program concurrently.
11. **Undo/restore capability not covered** — No requirement states whether deleted programs can be recovered.
12. **Empty-state copy unspecified** — AC does not define the expected empty-state message after last item deletion.
-->
