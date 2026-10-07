# Suite reliability report

**Suite:** Legion QA Playwright (Didaxis Studio)  
**Repo:** `legion-qa-ai-assisted-program-ann`  
**Window:** `e2e.yml` runs 2026-10-04 → 2026-10-06 (daily backlog-scan PRs) + `test-generation.yml` (last scheduled success 2026-09-28)  
**Generated:** 2026-10-07  

**Note:** Cursor has **no built-in telemetry** for these metrics. Every number below was measured from CI logs (`gh`), PR history, and session review. Refresh via the `eval-report` skill — do not invent numbers; use `insufficient data` when evidence is missing.

**This refresh trigger:** scheduled **Backlog mode** run (cron 10:01 UTC / 06:00 EST). **0 / 5** tickets processed — Jira queue could not be read (Atlassian MCP `needsAuth` — interactive auth unavailable in Cloud Agent; unauthenticated REST JQL returned empty `issues[]`; no `ATLASSIAN_*` / `DIDAXIS_*` in Cloud Agent env). `gh workflow run test-generation.yml` → **403** (integration token cannot dispatch).

---

## Flake rate

| | |
|---|---|
| **Number** | Latest scan PR E2E run **`37447122598`** (2026-10-06): **12 failed**, **28 passed** (40 smoke tests; no `flaky` keyword in log). Prior run **`37294195557`** (2026-10-05): **2 failed**, **2 flaky**, **36 passed**. → **0% flaky** on the latest run; **~5% flaky (2/40)** on the prior run. |
| **How measured** | `gh run list --workflow=e2e.yml --limit 10`; `gh run view 37447122558 --log-failed` and `37294195557` summaries from prior scan. |
| **What it tells us** | Smoke against live Didaxis remains **red on eval PRs** (12 hard failures on the latest scan). Flake rate is volatile run-to-run; do not treat a single green-adjacent run as stable until DS-2 / DS-1 / A11Y failures are triaged. |

---

## Heal success rate

| | |
|---|---|
| **Number** | **Unchanged: 1 / 2 (50%)** — no new locator-heal PRs this window. **Masked-regression count: 0**. |
| **How measured** | `gh pr list --state all` — no new `heal/*` or "Heal:" PRs since prior window. |
| **What it tells us** | No drift-heal activity; red CI on scan PRs was **not** routed through self-heal (no ticket work started). |

---

## Generation-gate pass rate

| | |
|---|---|
| **Number** | **Unchanged: first-PR CI green 2 / 2 (100%)** on historical DS-1 / DS-4 generation PRs. **No new ticket generation PRs** in this window (0 backlog tickets processed). |
| **How measured** | `gh pr list` — recent PRs are `docs(eval)` backlog scans only; `test-generation.yml` dispatch from Cloud Agent still **403**. |
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

**Backlog automation is blocked on Jira identity in Cloud Agent** (MCP auth + REST token). Secondary: **smoke CI on eval PRs is red** (latest `37447122598`: 12 failed / 28 passed), so generation runs need triage or a scoped verify baseline after Jira is fixed.

## Next action

1. **Authenticate Atlassian MCP** for the Cloud Agent environment (or inject `ATLASSIAN_EMAIL` + `ATLASSIAN_API_TOKEN` into the agent env) so queue JQL and `tests-generated` labeling work.
2. **Triage** E2E run `37447122598` (12 smoke failures) and prior `37294195557` (DS-2 TC-002/TC-004 failed; DS-1 TC-003 and A11Y TC-A11Y-002 flaky) — classify drift vs app bug before the next generation batch.
3. Grant the automation **`workflow_dispatch`** on `test-generation.yml` (or run generation only from CI with secrets) after (1); keep **never merge** on automation PRs.
