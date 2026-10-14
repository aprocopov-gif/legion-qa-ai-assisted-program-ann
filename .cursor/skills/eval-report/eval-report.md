# Suite reliability report

**Suite:** Legion QA Playwright (Didaxis Studio)  
**Repo:** `legion-qa-ai-assisted-program-ann`  
**Window:** `e2e.yml` runs 2026-10-11 → 2026-10-13 (daily backlog-scan PR/push pairs) + this session’s queue probe  
**Generated:** 2026-10-14  

**Note:** Cursor has **no built-in telemetry** for these metrics. Every number below was measured from CI logs (`gh`), PR history, and session review. Refresh via the `eval-report` skill — do not invent numbers; use `insufficient data` when evidence is missing.

**This refresh trigger:** **Backlog mode** cron (06:00 EST / 10:00 UTC). **0 / 5** tickets processed — Jira queue could not be read authentically; no specs generated.

---

## Flake rate

| | |
|---|---|
| **Number** | **0** tests marked `flaky` in run `38382234080` (2026-10-13 smoke, **5 failed / 35 passed**, 1 skipped). Prior run `38233900026` (2026-10-12): **12 failed / 26 passed**; `38130553514` (2026-10-11): **10 failed / 28 passed** — no `flaky` keyword in any of the three. |
| **How measured** | `gh run list --workflow=e2e.yml --limit 15`; `gh run view 38382234080 --log` (and prior IDs) grepped for `flaky`, `Retry #`, `failed`, `passed (`. Retries appear on failing tests but none labeled flaky. |
| **What it tells us** | Eval PR smoke **improved** on 10-13 (5 failures vs 12 on 10-12) while flake signal stays **0** — hard failures still dominate; DS-2 edit specs still appear in failure logs. |

---

## Heal success rate

| | |
|---|---|
| **Number** | **Unchanged: 1 / 2 (50%)** — no new locator-heal PRs this window. **Masked-regression count: 0**. |
| **How measured** | `gh pr list --state all --limit 15` — recent PRs are `docs(eval)` backlog scans; no `heal/*` or “Heal:” titles since prior window. |
| **What it tells us** | Heal path idle; smoke failures on scan PRs were not triaged/healed this window. |

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
| **How measured** | Session review. Atlassian MCP `needsAuth` (interactive OAuth unavailable in Cloud Agent); unauthenticated Jira REST (`legionqaschool.atlassian.net/rest/api/3/search/jql`, JQL: In Progress DS without `tests-generated`) returned empty `issues[]` (HTTP 200 — false empty); did **not** pick tickets from stale memory snapshot. `gh workflow run test-generation.yml` → 403 (integration token). Agent run: https://cursor.com/agents/bc-560a1f9c-1ea0-488d-a8b1-c4e8559a1045 |
| **What it tells us** | Guardrail held: empty/unauthenticated Jira ≠ “no work in Jira”; automation correctly no-oped rather than guessing DS keys. |

---

## Top reliability risk

**Jira authentication gap in Cloud Agent** blocks the entire backlog pipeline (queue → analyze → spec → `tests-generated` label). Secondary risk: **red smoke on eval PR branches** persists (5 failures on `38382234080`) without triage — likely edit/list drift or product regressions.

## Next action

1. **Authenticate Atlassian MCP** for the Cloud Agent environment (or inject `ATLASSIAN_EMAIL` + `ATLASSIAN_API_TOKEN` into the automation env) so queue fetch and labeling work.
2. Grant **`workflow_dispatch`** on `test-generation.yml` for the automation token as a fallback path with authenticated Jira in `dev1` secrets.
3. When smoke stabilizes or a ticket generation PR lands, triage remaining **DS-2** failures on eval PRs and open a `heal/*` PR if classified as drift.
