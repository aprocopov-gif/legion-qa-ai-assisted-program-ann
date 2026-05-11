# Test Plan: TodoMVC — Create list, add 4 items, finish, remove

**Application under test:** [https://demo.playwright.dev/todomvc/#/](https://demo.playwright.dev/todomvc/#/) (React • TodoMVC demo)
**Persistence:** browser `localStorage`, key `react-todos`, value is a JSON array of `{ id: UUID, title: string, completed: boolean }`
**Automated by:** `tests/todomvc/todomvc.spec.ts` (Playwright; see `tests/todomvc/todo-app.ts` for the Page Object)

**Acceptance Criteria under test**

1. Create a TODO list
2. Add items (4)
3. Finish item. Expect to be finished
4. Remove item from the list. Expected to be removed

---

## Positive Flows

### TC-001 — Empty TODO list is ready to receive items on first load (AC1)

**Preconditions:** `localStorage["react-todos"]` is empty / unset

**Steps:**
1. Navigate to `https://demo.playwright.dev/todomvc/#/`

**Expected result:** Document title is `React • TodoMVC`; the heading `todos` is visible; the input has placeholder `What needs to be done?` and is focused; no todo list, no `Mark all as complete` toggle, and no footer are rendered (the list is created implicitly when the first item is added)

**Priority:** High

---

### TC-002 — User adds a single item by pressing Enter (AC2)

**Preconditions:** Empty list

**Steps:**
1. Click the `What needs to be done?` input
2. Type `Buy milk`
3. Press `Enter`

**Expected result:** A list item with label `Buy milk` appears; the input is cleared and remains focused; the footer counter reads `1 item left`; `localStorage["react-todos"]` contains one entry with `title: "Buy milk"`, `completed: false`, and a non-empty `id`

**Priority:** High

---

### TC-003 — User adds exactly 4 items in insertion order (AC2)

**Preconditions:** Empty list

**Steps:**
1. Add `Buy milk`
2. Add `Walk the dog`
3. Add `Write tests`
4. Add `Read book`

**Expected result:** The list contains exactly 4 items rendered top → bottom in insertion order: `Buy milk`, `Walk the dog`, `Write tests`, `Read book`; the footer reads `4 items left`; `localStorage["react-todos"]` is an array of length 4 with matching titles and `completed: false` on all entries

**Priority:** High

---

### TC-004 — Marking an item as finished updates UI, counter, and storage (AC3)

**Preconditions:** List contains the 4 items from TC-003 (all active); counter reads `4 items left`

**Steps:**
1. Click the `Toggle Todo` checkbox on `Buy milk`

**Expected result:** `Buy milk` is rendered with the completed style (strikethrough, `completed` class on the row); the counter reads `3 items left`; the `Clear completed` button becomes visible; `localStorage["react-todos"]` shows `completed: true` only for `Buy milk` and `false` for the other three items

**Priority:** High

---

### TC-005 — A finished item stays finished across reload (AC3)

**Preconditions:** State from TC-004 (`Buy milk` finished)

**Steps:**
1. Reload the page (browser refresh)

**Expected result:** All four items are still rendered; `Buy milk` is still marked finished; counter still reads `3 items left`; item ids in `localStorage` are unchanged

**Priority:** Medium

---

### TC-006 — User removes a single item via the × destroy button (AC4)

**Preconditions:** List contains `Buy milk` and `Walk the dog`

**Steps:**
1. Hover the row for `Walk the dog` so the `×` destroy control becomes visible
2. Click `×`

**Expected result:** `Walk the dog` is removed from the list; the list now contains only `Buy milk`; the counter reads `1 item left`; `localStorage["react-todos"]` no longer contains the removed item

**Priority:** High

---

### TC-007 — Removing the last item resets the UI to empty state (AC4)

**Preconditions:** List contains exactly one item: `Buy milk`

**Steps:**
1. Click `×` on `Buy milk`

**Expected result:** The list, the `Mark all as complete` toggle, and the entire footer are no longer rendered; the header (`todos` heading) and the input remain visible and functional; `localStorage["react-todos"]` is an empty array (or the key is removed)

**Priority:** High

---

### TC-008 — Removing one item from a list of 4 leaves 3 items in original order (AC2 + AC4)

**Preconditions:** List contains the 4 items from TC-003 (all active)

**Steps:**
1. Hover `Walk the dog` and click its `×`

**Expected result:** The list contains exactly 3 items in order `Buy milk`, `Write tests`, `Read book`; counter reads `3 items left`; `localStorage["react-todos"]` reflects the same 3 entries with their original ids and titles

**Priority:** High

---

## Negative Flows

### TC-009 — Pressing Enter with an empty input does NOT create a todo (AC2 negative)

**Preconditions:** Empty list, input is empty

**Steps:**
1. Focus the input
2. Press `Enter` without typing anything

**Expected result:** No list item is created; the list/footer/master toggle remain not rendered; `localStorage["react-todos"]` is unchanged (still empty/unset)

**Priority:** High

---

### TC-010 — Pressing Enter on a whitespace-only input does NOT create a todo (AC2 negative)

**Preconditions:** Empty list

**Steps:**
1. Type three spaces `"   "` in the input
2. Press `Enter`

**Expected result:** No list item is created; the empty-state UI remains (no item count, no "toggle all"); `localStorage` is unchanged. (Observed: the input value is **not** cleared after a rejected whitespace-only submission — the React handler returns early without resetting the input. Asserting the input clears would not reflect actual app behavior, so it is intentionally not part of the expectation.)

**Priority:** High

---

### TC-011 — Toggling a finished item back unfinishes it (AC3 negative)

**Preconditions:** List contains `Buy milk` (finished), `Walk the dog` (active); counter `1 item left`

**Steps:**
1. Click the `Toggle Todo` checkbox on `Buy milk` again

**Expected result:** Strikethrough is removed from `Buy milk`; counter reads `2 items left`; `Clear completed` button is no longer rendered; `localStorage` shows `completed: false` for both items

**Priority:** Medium

---

### TC-012 — Removing an item must NOT remove other items (AC4 negative)

**Preconditions:** List contains 4 active items from TC-003

**Steps:**
1. Hover and click `×` on `Walk the dog`

**Expected result:** Only `Walk the dog` is removed; `Buy milk`, `Write tests`, and `Read book` retain their order, ids, and `completed: false` values; counter reads `3 items left`

**Priority:** High

---

### TC-013 — A finished + removed item does NOT leak completed state to remaining items (AC3 + AC4 negative)

**Preconditions:** 3 items: `Buy milk` (finished), `Walk the dog` (active), `Write tests` (active); counter `2 items left`; `Clear completed` visible

**Steps:**
1. Click `×` on `Buy milk`

**Expected result:** Only `Buy milk` is removed; `Walk the dog` and `Write tests` remain active (no strikethrough); counter reads `2 items left`; `Clear completed` is no longer rendered (no completed items remain)

**Priority:** Medium

---

## Edge Cases

### TC-014 — Leading/trailing whitespace in a new item is trimmed (AC2 edge)

**Preconditions:** Empty list

**Steps:**
1. Type `   Buy milk   ` and press `Enter`

**Expected result:** The created item's title is exactly `Buy milk` (trimmed); `localStorage` `title` field has no leading/trailing whitespace; the rendered label visually matches `Buy milk`

**Priority:** Medium

---

### TC-015 — Internal multi-space sequences are preserved verbatim (AC2 edge)

**Preconditions:** Empty list

**Steps:**
1. Type `Buy   organic   milk` and press `Enter`

**Expected result:** Both the rendered label and `localStorage.title` are exactly `Buy   organic   milk` (multi-space sequences preserved)

**Priority:** Low

---

### TC-016 — Special characters and emoji are accepted as plain text (no XSS) (AC2 edge)

**Preconditions:** Empty list

**Steps:**
1. Add `<script>alert(1)</script>`
2. Add `Привет 🌍 — déjà vu`
3. Add `"quotes" & ampersands`

**Expected result:** All three items render as plain text labels; no `alert` dialog fires; no HTML/script is interpreted; each label visually matches the input exactly; no app-originated `pageerror` is logged

**Priority:** High

---

### TC-017 — Very long title (1,000 characters) is preserved without breaking layout (AC2 edge)

**Preconditions:** Empty list

**Steps:**
1. Paste a 1,000-character string into the input and press `Enter`

**Expected result:** Item is created with the full 1,000-character title; the row does not produce horizontal overflow; the `×` destroy control is still reachable on hover; `localStorage.title` stores the full 1,000-character value with no truncation

**Priority:** Medium

---

### TC-018 — Duplicate titles are stored as independent items (AC2 edge)

**Preconditions:** Empty list

**Steps:**
1. Add `Buy milk`
2. Add `Buy milk` again
3. Click the `Toggle Todo` checkbox on the first `Buy milk`

**Expected result:** Two list items are created with distinct `id` values; counter goes `2 items left` → `1 item left`; only the first row shows the completed style; the second `Buy milk` remains active

**Priority:** Medium

---

### TC-019 — Adding 4 items in rapid succession produces exactly 4 entries (AC2 boundary)

**Preconditions:** Empty list

**Steps:**
1. Programmatically (or via paste + Enter chains) add `task 1`, `task 2`, `task 3`, `task 4` in rapid succession

**Expected result:** Exactly 4 list items are created in input order; no items are dropped; no duplicates are created; counter reads `4 items left`; `localStorage["react-todos"]` is an array of length 4 with the four distinct titles

**Priority:** Medium

---

### TC-020 — Removing all 4 items one by one returns the app to empty state (AC4 boundary)

**Preconditions:** List contains the 4 items from TC-003 (all active)

**Steps:**
1. Click `×` on each item in turn (any order)

**Expected result:** After each click the count decreases by 1; after the 4th deletion the list, master toggle, and footer are removed from the DOM; only the heading and the input remain; `localStorage["react-todos"]` is empty

**Priority:** High

---

## Revalidation against the ACs (traceability matrix)

| AC | Description | Covering test cases |
|---|---|---|
| AC1 | **Create a TODO list** — first-load empty state ready to receive items | TC-001, TC-007 (return to empty), TC-020 (return to empty after AC4) |
| AC2 | **Add items (4)** — adding items, including the explicit "4 items" boundary | TC-002, TC-003, TC-008, TC-014, TC-015, TC-016, TC-017, TC-018, TC-019 (negative: TC-009, TC-010) |
| AC3 | **Finish item** — marking an item as finished | TC-004, TC-005 (persistence), TC-011 (un-finish negative), TC-013 (no leak after delete) |
| AC4 | **Remove item from the list** — destroy operation | TC-006, TC-007, TC-008, TC-012, TC-013, TC-020 |

**Coverage check:**

- AC1 covered by TC-001 plus complementary "return to empty" cases (TC-007, TC-020). ✅
- AC2 explicitly covered with single-add (TC-002), exact 4-add (TC-003), boundary 4-add under speed (TC-019), and complementary trim/whitespace/XSS/length/duplicate edge cases. Negatives (TC-009, TC-010) ensure invalid input cannot satisfy AC2. ✅
- AC3 covered by TC-004 (positive), TC-005 (persistence), TC-011 (toggle-back negative), TC-013 (no completion leak after delete). ✅
- AC4 covered by single-delete (TC-006), last-item-delete (TC-007), one-of-many-delete (TC-008), no-collateral-deletion (TC-012), interaction with finished items (TC-013), and full-list-delete (TC-020). ✅

Every AC has at least one positive test, at least one negative or boundary test (where applicable), and corresponding edge cases.

---

## Ambiguities and gaps in the ACs

The TodoMVC demo ships without formal acceptance criteria; the following points should be confirmed with the product owner and locked in by the linked tests:

| # | Gap | Linked TC |
|---|---|---|
| 1 | **AC1 wording — "Create a TODO list".** The app does not have an explicit "Create list" action; the list is created implicitly when the first todo is added. The AC should specify whether "Create" means "list is available to receive items on first load" (current observed behavior). | TC-001 |
| 2 | **AC2 — "Add items (4)".** Is "(4)" a boundary requirement (test must add exactly 4) or a count guidance? Tested as exactly 4 in TC-003 / TC-019. | TC-003, TC-019 |
| 3 | **Whitespace handling on add** is not specified. Observed: leading/trailing trim; whitespace-only rejected. | TC-010, TC-014 |
| 4 | **Maximum title length** is undefined. Recommend defining one (e.g. 500 chars) for layout safety. | TC-017 |
| 5 | **AC3 — "Expect to be finished"** does not specify whether the change must persist across reload. Tested as persistent in TC-005. | TC-005 |
| 6 | **AC4 — "Expected to be removed"** does not specify whether the empty state must reappear after the last item is deleted. Tested as reverting to empty in TC-007 and TC-020. | TC-007, TC-020 |
| 7 | **Duplicates** are not addressed — is the app allowed to accept identical titles as separate items? Observed: yes. | TC-018 |
| 8 | **Special characters / XSS safety** is not addressed in the ACs. Observed: rendered as plain text; no script execution. | TC-016 |
| 9 | **Accessibility** — no AC covers keyboard reachability of input and of the destroy `×` button (which is hidden until hover). | TC-001 (input focus), TC-006/TC-012 (destroy interaction) |
| 10 | **Concurrent / rapid input** — no AC covers what happens when 4 items are added very quickly. Tested as resilient in TC-019. | TC-019 |
