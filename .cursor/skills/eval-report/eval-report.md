# Suite reliability report

**Suite:** Legion QA Playwright (Didaxis Studio)  
**Repo:** `legion-qa-ai-assisted-program-ann`  
**Window:** `e2e.yml` runs 2026-09-29 → 2026-10-05 (daily backlog-scan PRs) + `test-generation.yml` (last scheduled success 2026-09-28)  
**Generated:** 2026-10-06  

**Note:** Cursor has **no built-in telemetry** for these metrics. Every number below was measured from CI logs (`gh`), PR history, and session review. Refresh via the `eval-report` skill — do not invent numbers; use `insufficient data` when evidence is missing.

**This refresh trigger:** scheduled **Backlog mode** run (cron 10:00 UTC / 06:00 EST). **0 / 5** tickets processed — Jira queue could not be read (Atlassian MCP `needsAuth`; unauthenticated REST JQL returned empty; no `ATLASSIAN_*` / `DIDAXIS_*` in Cloud Agent env). `gh workflow run test-generation.yml` → **403** (integration token cannot dispatch).

---

## Flake rate

| | |
|---|---|
| **Number** | **2 flaky / 40 smoke tests** on the latest scan PR E2E run (`37294195557`, 2026-10-05): **2 failed**, **2 flaky**, **36 passed**. Prior run (`37194099316`, 2026-10-04): **9 failed**, **30 passed** (no `flaky` keyword in summary). → **~5% flaky** on the latest green-adjacent run (2/40); window overall is **mixed red + flaky**. |
| **How measured** | `gh run list --workflow=e2e.yml --limit 15`; `gh run view 37294195557 --log-failed` — summary lists DS-1 TC-003 and programs-accessibility TC-A11Y-002 as **flaky**; DS-2 TC-002 and TC-004 as **failed**. |
| **What it tells us** | Smoke against live Didaxis is unstable on eval PRs (failures + pass-on-retry). Separate from the Jira-auth blocker; triage DS-2 failures vs DS-1/A11Y flakes before relying on CI as a generation gate. |

---

## Heal success rate

| | |
|---|---|
| **Number** | **Unchanged: 1 / 2 (50%)** — no new locator-heal PRs this window. **Masked-regression count: 0**. |
| **How measured** | `gh pr list --state all` — no new `heal/*` or "Heal:" PRs since prior window. |
| **What it tells us** | No drift-heal activity; red/flaky CI on scan PRs was **not** routed through self-heal (no ticket work started). |

---

## Generation-gate pass rate

| | |
|---|---|
| **Number** | **Unchanged: first-PR CI green 2 / 2 (100%)** on historical DS-1 / DS-4 generation PRs. **No new ticket generation PRs** in this window (0 backlog tickets processed). |
| **How measured** | `gh pr list` — recent PRs #38–#42 are `docs(eval)` backlog scans only; `test-generation.yml` dispatch from Cloud Agent still **403**. |
| **What it tells us** | Generation gate remains stale; automation cannot score new specs until Jira auth + queue fetch work in Cloud Agent. |

---

## Ask-vs-guess

| | |
|---|---|
| **Number** | **This session: 0 asks (automation) vs 0 invented tickets/AC/locators.** |
| **How measured** | Session review. Attempted Atlassian MCP auth (blocked in Cloud Agent). Ran documented JQL via public REST (empty `issues[]` — treated as **untrusted empty**, not proof of zero backlog). Did **not** pick tickets from stale memory snapshot. |
| **What it tells us** | Correct guardrail: without authenticated Jira, the orchestrator must not fabricate queue membership. |

---

## Top reliability risk

**Backlog automation is blocked on Jira identity in Cloud Agent** (MCP auth + REST token). Secondary: **smoke CI on eval PRs is red/flaky** (latest `37294195557`: 2 failed + 2 flaky), so generation runs need triage or a scoped verify baseline after Jira is fixed.

## Next action

1. **Authenticate Atlassian MCP** for the Cloud Agent environment (or inject `ATLASSIAN_EMAIL` + `ATLASSIAN_API_TOKEN` into the agent env) so queue JQL and `tests-generated` labeling work.
2. **Triage** E2E run `37294195557` (DS-2 TC-002/TC-004 failed; DS-1 TC-003 and A11Y TC-A11Y-002 flaky) — classify drift vs app bug before the next generation batch.
3. Grant the automation **`workflow_dispatch`** on `test-generation.yml` (or run generation only from CI with secrets) after (1); keep **never merge** on automation PRs.
