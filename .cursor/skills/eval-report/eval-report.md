# Suite reliability report

**Suite:** Legion QA Playwright (Didaxis Studio)  
**Repo:** `legion-qa-ai-assisted-program-ann`  
**Window:** `e2e.yml` runs 2026-10-01 → 2026-10-07 (14 daily backlog-scan PR/push pairs) + this session’s queue probe  
**Generated:** 2026-10-08  

**Note:** Cursor has **no built-in telemetry** for these metrics. Every number below was measured from CI logs (`gh`), PR history, and session review. Refresh via the `eval-report` skill — do not invent numbers; use `insufficient data` when evidence is missing.

**This refresh trigger:** **Backlog mode** cron (06:00 EST / 10:02 UTC). **0 / 5** tickets processed — Jira queue could not be read authentically; no specs generated.

---

## Flake rate

| | |
|---|---|
| **Number** | **2 flaky** in run `37294195557` (2026-10-05 smoke, **36 passed**); **0** `flaky` keyword in run `37604799956` (2026-10-07 smoke, **12 failed / 28 passed**). Across the 14-run window, only the 10-05 run reported flaky tests → **~2 flaky outcomes / ~700+ test executions in passing portions** (approx.; denominator is sum of passed counts across sampled logs, not exact). |
| **How measured** | `gh run list --workflow=e2e.yml --limit 15`; `gh run view 37294195557 --log` and `37604799956 --log` grepped for `flaky`, `Retry #`, `passed (`. Retries appear on failures in 37604799956 but no tests marked flaky. |
| **What it tells us** | Failures dominate recent smoke on eval PR branches (12 hard fails on 10-07); flake signal is small (2 on 10-05) but retries on reds mean flake rate is **undercounted** when the suite is mostly failing. |

---

## Heal success rate

| | |
|---|---|
| **Number** | **Unchanged: 1 / 2 (50%)** — no new locator-heal PRs since prior window. **Masked-regression count: 0**. |
| **How measured** | `gh pr list --state open --limit 20` — recent PRs are `docs(eval)` backlog scans (#35–#44); no `heal/*` or “Heal:” titles. |
| **What it tells us** | Heal path idle; red smoke on scan PRs was not triaged/healed this window. |

---

## Generation-gate pass rate

| | |
|---|---|
| **Number** | **0 new ticket generation PRs** this window → **insufficient data** for first-PR gate refresh. Historical first-PR CI green remains **2 / 2** on legacy PRs #7 (DS-4) and #8 (DS-1). |
| **How measured** | `gh pr list` — no `test(DS-*)` or `qa/DS-*` generation PRs since July; backlog automation blocked before analyze/implement. |
| **What it tells us** | Generation gate cannot improve until Jira auth unblocks queue fetch and spec work. |

---

## Ask-vs-guess

| | |
|---|---|
| **Number** | **This session: 0 asks (no human present), 0 invented tickets/AC/locators.** |
| **How measured** | Session review. Attempted Atlassian MCP auth (blocked); unauthenticated Jira REST returned empty `issues[]` (documented false empty in automation memory); did **not** pick tickets from stale memory snapshot. `gh workflow run test-generation.yml` → 403 (not retried with invented queue). |
| **What it tells us** | Guardrail held: empty/unauthenticated Jira ≠ “no work in Jira”; automation correctly no-oped rather than guessing DS keys. |

---

## Top reliability risk

**Jira authentication gap in Cloud Agent** blocks the entire backlog pipeline (queue → analyze → spec → label). Secondary risk: **red smoke on eval PR branches** (12 failures on `37604799956`) without triage — may mask regressions or block future generation PRs.

## Next action

1. **Authenticate Atlassian MCP** for Cloud Agent **or** add `ATLASSIAN_EMAIL` + `ATLASSIAN_API_TOKEN` to the agent environment (GitHub `dev1` secrets already used in GHA).
2. **Triage** smoke failures on run `37604799956` (or latest eval PR) before the next generation batch.
3. Optionally grant **`workflow_dispatch`** on `test-generation.yml` so cron can delegate to GHA with secrets when MCP auth is unavailable.
