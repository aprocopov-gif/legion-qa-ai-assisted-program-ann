# Suite reliability report

**Suite:** Legion QA Playwright (Didaxis Studio)  
**Repo:** `ai-assisted-qa-automation`  
**Window:** `e2e.yml` runs 2026-09-29 → 2026-10-04 (daily backlog-scan PRs) + `test-generation.yml` (last scheduled success 2026-09-28)  
**Generated:** 2026-10-04  

**Note:** Cursor has **no built-in telemetry** for these metrics. Every number below was measured from CI logs (`gh`), PR history, and session review. Refresh via the `eval-report` skill — do not invent numbers; use `insufficient data` when evidence is missing.

**This refresh trigger:** scheduled **Backlog mode** run (cron 10:00 UTC / 06:00 EST). **0 / 5** tickets processed — Jira queue could not be read (Atlassian MCP `needsAuth`; unauthenticated REST JQL returned empty; no `ATLASSIAN_*` / `DIDAXIS_*` in Cloud Agent env).

---

## Flake rate

| | |
|---|---|
| **Number** | **Insufficient data for a stable %** in this window. Last **4** daily scan PR E2E runs (2026-10-01 → 2026-10-03) **failed** smoke with **9 failed** tests on the latest run (`37115129625`); logs show extensive **Retry #1 / #2** (timeouts, closed browser). Prior scan PR on **2026-09-29** was **green** (`36553208932`). |
| **How measured** | `gh run list --workflow=e2e.yml --limit 30`; `gh run view 37115129625 --log` grepped for `Retry #`, `failed`, `flaky`. No `flaky` keyword in sampled logs — failures are hard fails after retries, not pass-on-retry. |
| **What it tells us** | Daily **eval-only** PRs are now exercising smoke against live Didaxis and surfacing **regression / env instability** (9 failures), separate from the Jira-auth blocker. Flake vs product regression needs triage on a failing run artifact. |

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
| **How measured** | `gh pr list` — recent PRs #37–#40 are `docs(eval)` backlog scans only; `test-generation.yml` last **success** on schedule `36464990412` (2026-09-28). |
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

**Backlog automation is blocked on Jira identity in Cloud Agent** (MCP auth + REST token). Secondary: **smoke CI on recent eval PRs is red** (9 failures on 2026-10-03), so even if Jira were fixed, generation runs need a green baseline or scoped verify.

## Next action

1. **Authenticate Atlassian MCP** for the Cloud Agent environment (or inject `ATLASSIAN_EMAIL` + `ATLASSIAN_API_TOKEN` into the agent env) so queue JQL and `tests-generated` labeling work.
2. **Triage** E2E run `37115129625` (9 failed smoke tests) — classify drift vs app bug before the next generation batch.
3. Re-enable or manually dispatch `test-generation.yml` only after (1) and a green/smoke-triage path exist; keep **never merge** on automation PRs.
