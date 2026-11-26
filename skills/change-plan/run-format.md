# Run file format

One run file per parent ticket: `~/runs/<repo>/<ticket>.md`. It lives outside the repo, so it is
never committed. Several skills write to it, each to its own section:

| Section | Written by |
| --- | --- |
| Frontmatter, ticket plan (Touch points to Shots) | `/change-plan` ticket size |
| `## <KEY> plan` | `/change-plan` subtask size, run by `/implement` |
| `### Actual` under it | `/implement`'s report |
| `### Review` under it | `/review` |
| `## Fleet check` | `/fleet-command`'s duplication check |
| `## Open` | Whoever runs the session: `/fleet-command`'s coordinator, or `/implement` when it runs alone |

**`## Open`** is the short list of what is still live: what's pending, what waits on the user, holds
and their reason, standing rules the user gave in the conversation (e.g. "hold 3508/3509 until
3505/3506 ship"), and the next step. Rewrite it in place at each milestone (dispatch, an agent
done, a user decision, PR ready, merge); it is the current state, not a log. Keep it under about
15 lines. A SessionStart hook prints it after every compaction, so anything the session can't
afford to lose belongs here, not only in the conversation. Never written by fleet agents (they
have section files); only the session that talks to the user writes it.

`<repo>` is the last part of the `origin` remote URL without `.git` (`groov.hcp-portal`). A
worktree's folder name is not the repo name. `<ticket>` is the parent ticket key: given a subtask
key, fetch the subtask and use its parent's key. A single small change with no parent uses its own
key. With no key at all, use a short slug of the task title.

**Parallel writers.** Agents editing one file at once break each other's edits: an edit fails when
the file changed after it was read. So in a fleet, each agent writes to its own **section file**,
`~/runs/<repo>/<ticket>.<KEY>.md`, named by `/fleet-command` in its brief. The section file holds
`## <KEY> plan` and everything under it (`### Actual`, `### Review`). The agent reads the run file
but never writes it. When the agent finishes, `/fleet-command` appends the section file to the run
file and deletes it. When `/implement` runs are started side by side by hand, without
`/fleet-command`, each edits only its own `## <KEY> plan` section, with a targeted edit, never a
rewrite of the whole file.

The frontmatter totals are always a sum over every `### Review` section, never a running count.
`/review` recomputes them after each round when it writes to the run file. When it writes to a
section file, it skips that, and `/fleet-command` recomputes them once every section file is
folded in.

The file is Obsidian-friendly: YAML frontmatter, and `[[ticket]]` links to other run files.
`/retro` reads the frontmatter across `~/runs`.

```markdown
---
repo: groov.hcp-portal
ticket: GROOV-3347
title: Let patients choose their SMS check-in slot
date: 2026-11-24
status: draft            # draft | approved | done
approved: ~              # date approved
subtasks: 4
non_test_files_planned: 18
non_test_files_naive: 31 # ~ when not known
bugs: 0                  # totals across every ### Review below
wrong_plan_answers: 0
standards: 0
---

# [[GROOV-3347]] Let patients choose their SMS check-in slot

Questions: [[GROOV-3347.questions]]

## Touch points

- `apps/api/src/sms/daily-tick.ts` — sends the daily SMS; reads the slot
- `apps/api/src/check-in/weekly.ts` — weekly cadence; must agree with the daily tick
- ...

## Split

| # | Subtask | What | Non-test files | Depends on | Kind |
| --- | --- | --- | --- | --- | --- |
| 1 | Share one check-in schedule | Daily tick and weekly cadence read one schedule | 4 | — | seam |
| 2 | Store the chosen slot | ... | 5 | 1 | behaviour |

Size: 18 non-test files planned. Naive version (no seams): about 31.

## Seams

- **Share one check-in schedule** (subtasks 2, 3): own subtask and PR, merged first. Today the
  daily tick and the weekly cadence each work out the next send time.

## Subtasks

### 1. Share one check-in schedule (seam) — GROOV-3350

What: ... Why: ...

Files (non-test):
- `apps/api/src/check-in/schedule.ts` (new)
- ...

Checklist:
- (a) Paths: daily tick and weekly cadence both move onto the schedule; no other sender.
- (b) Repeats and partial failure: doesn't apply — no writes.
- ...
- (l) Every caller and screen: 2 callers, both moved; no screen shows it.

Shots: none (no screen changes)

### 2. Store the chosen slot (behaviour) — GROOV-3351

...

Shots:
- Patient settings, slot picker open — proves AC 1 (patient can pick a slot)
- Practitioner patient view, slot shown — proves AC 3

## Fleet check

Written by `/fleet-command` step 7: logic written more than once across subtasks, places that
should share a planned seam but don't, paths that diverge where the plan says they agree. Each
with file:line and what it feeds.

## Diagram (optional)

A Mermaid graph of the subtasks and what they depend on, when it helps.

## GROOV-3350 plan

Written by `/change-plan` subtask size, against the code at `<sha>`.

Files (non-test): the exact list. This is the file budget.

Seam commits, in order:
1. `refactor: extract nextSendTime into check-in schedule` — no behaviour change

Behaviour commits: none (seam subtask)

Checklist: each item again, updated for the current code, or "as ticket plan".

Tests: the behaviours to test, from the acceptance criteria.

### Actual

- Planned vs actual non-test files: 4 planned, 5 actual
- Off-list: `apps/api/src/cron/index.ts` — the job registry imports the old function
- Plan answers that were wrong: (b) — the weekly job does write, it marks the week sent

### Review

- kind: seam
- bugs: 1, wrong plan answers: 1, standards: 0
- Bug: `weekly.ts:41` two runs at once send twice. Breaks planned answer (b). Feeds: an automated check (a test for two runs at once)
- Wrong plan answer: (b) said "no writes", but the weekly job marks the week sent. Feeds: the checklist, a sharper Plan line for (b)
- Human reviewer miss: ~   # filled in later if a human reviewer finds what /review missed
```
