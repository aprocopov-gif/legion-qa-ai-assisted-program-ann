# Suite reliability report

**Suite:** Legion QA Playwright (Didaxis Studio)  
**Repo:** `legion-qa-ai-assisted-program-ann`  
**Window:** `e2e.yml` runs 2026-10-04 → 2026-10-11 (daily backlog-scan PR/push pairs) + this session’s queue probe  
**Generated:** 2026-10-12  

**Note:** Cursor has **no built-in telemetry** for these metrics. Every number below was measured from CI logs (`gh`), PR history, and session review. Refresh via the `eval-report` skill — do not invent numbers; use `insufficient data` when evidence is missing.

**This refresh trigger:** **Backlog mode** cron (06:00 EST / 10:00 UTC). **0 / 5** tickets processed — Jira queue could not be read authentically; no specs generated.

---

## Flake rate

| | |
|---|---|
| **Number** | **0** tests marked `flaky` in run `38130553514` (2026-10-11 smoke, **10 failed / 28 passed**, 1 skipped). Prior run `38043492542` (2026-10-10): **4 failed / 36 passed**; `37915087859` (2026-10-09): **12 failed / 27 passed** — no `flaky` keyword in any of the three. |
| **How measured** | `gh run list --workflow=e2e.yml --limit 10`; `gh run view 38130553514 --log` (and prior IDs) grepped for `flaky`, `Retry #`, `failed`, `passed (`. Retries appear on failing tests (notably `ds2-edit-program`) but none labeled flaky. |
| **What it tells us** | Eval PR smoke **regressed** vs 10-10 (10 vs 4 failures) while flake signal stays **0** — hard failures dominate; DS-2 edit suite appears heavily involved in 10-11 log. |

---

## Heal success rate

| | |
|---|---|
| **Number** | **Unchanged: 1 / 2 (50%)** — no new locator-heal PRs this window. **Masked-regression count: 0**. |
| **How measured** | `gh pr list --state open --limit 20` — recent PRs are `docs(eval)` backlog scans; no `heal/*` or “Heal:” titles since prior window. |
| **What it tells us** | Heal path idle; rising smoke failures on scan PRs were not triaged/healed this window. |

---

## Generation-gate pass rate

| | |
|---|---|
| **Number** | **0 new ticket generation PRs** this window → **insufficient data** for first-PR gate refresh. Historical first-PR CI green remains **2 / 2** on legacy PRs #7 (DS-4) and #8 (DS-1). |
| **How measured** | `gh pr list` — no `test(DS-*)` or `qa/DS-*` generation PRs; backlog automation blocked before analyze/implement. |
| **What it tells us** | Generation gate cannot improve until Jira auth unblocks queue fetch and spec work. |

---

## Ask-vs-guess

| | |
|---|---|
| **Number** | **This session: 0 asks (no human present), 0 invented tickets/AC/locators.** |
| **How measured** | Session review. Atlassian MCP `needsAuth` (interactive OAuth unavailable in Cloud Agent); unauthenticated Jira REST (`legionqaschool.atlassian.net/rest/api/3/search/jql`, JQL: In Progress DS without `tests-generated`) returned empty `issues[]` (HTTP 200 — false empty); did **not** pick tickets from stale memory snapshot. `gh workflow run test-generation.yml` → 403 (integration token). Agent run: https://cursor.com/agents/bc-e1617411-9c99-448d-89d8-133a02cc0d0a |
| **What it tells us** | Guardrail held: empty/unauthenticated Jira ≠ “no work in Jira”; automation correctly no-oped rather than guessing DS keys. |

---

## Top reliability risk

**Jira authentication gap in Cloud Agent** blocks the entire backlog pipeline (queue → analyze → spec → `tests-generated` label). Secondary risk: **red smoke on eval PR branches** worsened on `38130553514` (**10** failures vs **4** on `38043492542`) without triage — likely DS-2 edit regressions or drift.

## Next action

1. **Authenticate Atlassian MCP** for Cloud Agent **or** inject `ATLASSIAN_EMAIL` + `ATLASSIAN_API_TOKEN` + `ATLASSIAN_BASE_URL` into the automation environment (GitHub `dev1` secrets already used in GHA).
2. **Triage** smoke failures on run `38130553514` (DS-2 edit cluster) before the next generation batch.
3. Grant **`workflow_dispatch`** (or a PAT with `actions:write`) on `test-generation.yml` so cron can delegate to GHA with secrets when MCP auth is unavailable.
