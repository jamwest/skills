# Mapping: mattpocock/skills → this repo

`mps/` (gitignored, see [README.md](../README.md)) is a live clone of
[github.com/mattpocock/skills](https://github.com/mattpocock/skills) — the jumping-off point for
several skills here. This doc tracks the lineage: which of his skills we adapted, which of ours
have no counterpart over there, and which of his we've looked at and passed on. Its job is to make
a `git pull` inside `mps/` fast to triage — diff against the checkpoint below, skim what's new, and
you already know what's settled versus what's actually worth a look.

**Checkpoint**: reviewed at his commit `8b36d4f` (2026-08-05). To see what's landed since:

```bash
cd mps && git log 8b36d4f..HEAD --oneline
```

Update the checkpoint SHA here whenever this doc gets a fresh pass.

## Adapted from his skills

| Ours | His | Notes |
|---|---|---|
| `grill` | `productivity/grilling`, `productivity/grill-me`, `engineering/grill-with-docs` | Merged his freeform and doc-anchored variants into one skill with mode detection, instead of separate skills. |
| `implement` | `engineering/implement`, `engineering/tdd` | Merged spec-execution and TDD loop into one skill. `mocking.md`/`tests.md` mirror his `tdd/mocking.md`/`tdd/tests.md`. Step 6 (added 2026-08-06) restores something close to his own design, where `/implement` "closes out by running `/code-review`... before committing" — ours runs `/review` as a fresh Agent-tool subagent once, auto-fixes hard/spec findings, re-reviews once, then stops regardless of outcome (bounded, not a loop until clean), and leaves committing to the user rather than doing it automatically, since this repo's `implement` never commits on its own. |
| `setup-agent-context` | `engineering/setup-matt-pocock-skills` | Direct adaptation, genericized (his hardcodes his own name; ours is agent-agnostic per this repo's own convention). We split **issue tracker** and **code host** as two separate dimensions — his `issue-tracker-gitlab.md` conflates them. We don't have his `triage-labels.md` (no `triage` skill here). Workflow conventions + coding standards now live in a canonical `CONTRIBUTING.md`, not a `docs/agents/workflow.md` stub. |
| `skill-forge` | `productivity/writing-for-agents` | His is authoring guidance (a doc to read); ours is an active interactive tool that grills the user and writes the `SKILL.md` itself. (Note: this used to be named `writing-great-skills` in an older snapshot — he's renamed it.) |
| `blueprint` | `engineering/to-spec` | Same idea (conversation → structured doc → publish), but his skips the interview and publishes straight to the tracker; ours interviews for gaps, writes a local `.claude/blueprints/` file first, and confirms before publishing. |
| `break-it-down` | `engineering/to-tickets` | Same idea (decompose into tracked work), but his models explicit blocking edges between tracer-bullet tickets; ours does parent+subtask hierarchy per tracker with a dry-run confirmation step. |
| `review` | `engineering/code-review` | Named `review` (not `code-review`) to dodge the shadowing collision with Claude Code's own built-in `/code-review` that his FAQ documents. Same two-axis design (Standards + Spec, parallel sub-agents, no merged verdict), with the Standards source pointed at `CONTRIBUTING.md`'s "Coding standards" section and the Spec-source lookup order adjusted for our own pipeline (issue tracker → argument path → `.claude/blueprints/` file → ask). Also bakes in the one-line recursion guard his FAQ names as the community fix for sub-agents rediscovering the skill and fanning out. |
| `bug` | `engineering/diagnosing-bugs` | Renamed — the original name was too long to type as a slash command. Kept the six-phase gate structure and the HITL script (`hitl-loop.template.sh`) verbatim. Added two guards his open FAQ items name and haven't landed upstream: a calibration line so quick questions skip the phase gate instead of over-firing on them, and a redaction step before captured artifacts/output get pasted into chat, a commit, or a PR. Hands off to `/deepen` instead of his `improve-codebase-architecture`. |
| `rebase` | `engineering/resolving-merge-conflicts` | Redesigned, not a direct port: his skill resolves an already-stuck merge/rebase; ours *initiates* the rebase onto the base branch and resolves conflicts as they surface commit-by-commit. Kept his core insight — trace each side to its primary source before resolving a hunk, never abort — and added a rebase-specific gotcha his merge-only version didn't need: `ours`/`theirs` are inverted during a rebase versus a merge. Also added a backup-branch + one-time-confirm step (matching `tidy-branch`'s pattern) and auto-stash/pop for uncommitted changes, since this one's meant for day-to-day use rather than a stuck one-off. |
| `which-skill` | `engineering/ask-matt` | Fully rewritten map over *this* repo's actual skill set (14 skills, not his 22) rather than a genericized version of his — the flows, on-ramps, and precondition don't transfer, only the shape (map, recommend-and-stop, hand-maintained, explicit-invoke-only). Kept `disable-model-invocation: true` from his design so it never hijacks a task mid-flow. While building it, caught a third dangling reference his mapping never had to deal with: `implement` pointed at a future `/ship` skill with no stub and no build-order entry. Resolved by cutting the reference — `implement` recommends manual, one-at-a-time next steps (`/pr-description`, `/tidy-branch`, closing the issue) rather than adding `/ship` to the backlog. (`implement` later grew its own bounded, automatic `/review` round — see that row above — so "recommends and stops" now applies only to what comes *after* review, not to review itself.) |
| `handoff` | `productivity/handoff` + `in-progress/claude-handoff` | Merged both shapes into one skill that branches on situation, resolving the "worth deciding which shape, or both" note below — settled on both. Default path writes the portable markdown file to the OS temp dir (agent-agnostic, matches `productivity/handoff`); the fork path (same harness, same directory, keep working now) launches a live `claude --bg --name` background agent (matches `in-progress/claude-handoff`). No `compatibility: claude-code` tag on the whole skill, since only the fork branch needs the `claude` CLI — it checks `command -v claude` first and falls back to the file path if it's unavailable, rather than statically declaring the whole skill incompatible elsewhere. |
| `deepen` | `engineering/improve-codebase-architecture` | Scan-and-rank kept, the HTML report dropped — output is concise markdown instead: a couple of full-detail "should-do-now, easy win" candidates (before/after + cost estimate), larger ones named but left thin until asked for. Scope cut down from his version too: his skill continues into a grilling loop and domain-modeling side effects once a candidate is picked; ours stops after presenting candidates and hands the pick to `/grill` or `/wayfinder` — no duplicate grilling loop living in two skills. His `setup-ts-deep-modules` (dependency-cruiser wiring) folded in as a detection input to the scan itself (a throwaway, non-persisted config run against TypeScript repos) rather than becoming its own skill or a separate permanent-install step. Extended `implement`'s `deep-modules.md` in place with his `codebase-design` skill's fuller vocabulary (seam, adapter, leverage, locality, the deletion test) rather than writing a second vocabulary doc — both skills now share the one file. |
| `wayfinder` | `engineering/wayfinder` | Same core design (map, decision tickets, fog of war, frontier, HITL/AFK ticket types) — this is the one skill here closest to a straight port. Two real adaptations: `grilling`+`domain-modeling` collapse into a single `/grill` call (matches how this repo already merged those), and the `research`/`prototype` ticket types — which lean on his dedicated `/research` and `/prototype` skills, neither built here — resolve inline instead: `research` spins up a general-purpose Agent-tool subagent directly, `prototype` writes the throwaway artifact directly on a `prototype/<name>` branch, both without a dedicated skill wrapping them. Added a "Wayfinding operations" section to each of `setup-agent-context`'s three tracker templates (GitHub, Jira, local) for the map/ticket/blocking mechanics, the same pattern `break-it-down`'s `create-*.md` files already established — GitHub blocking has no native `gh` CLI primitive, so it falls back to a `Blocked by:` body convention there, same as local markdown. |

## Original to this repo (no counterpart over there)

- `commit` — no commit-message skill in his repo at all.
- `pr-description` — no PR-description skill; his `code-review` reviews existing changes but doesn't draft descriptions.
- `release-notes` — no equivalent.
- `tidy-branch` — no history-reshaping skill; his `resolving-merge-conflicts` is adjacent but solves a different problem (conflicts, not reshaping) — see `rebase` below for where that one actually landed.
- `ui-evidence` — no browser-automation evidence-capture skill. First skill tagged `compatibility: claude-code` (see ADR-0001).

## Planned here, with a likely analog over there

Stub directory that exists in `skills/` but has no `SKILL.md` yet. Build order, settled
2026-08-06 (`review`, `bug`, `rebase`, `which-skill`, `handoff`, `deepen`, `wayfinder` done —
see the table above):

1. `fleet-command` — last; orchestration only pays off once there's real parallel work from the
   others to orchestrate. No direct mps analog anymore now that `wayfinder` covers the
   planning/tracking half of what it used to point at — its remaining job is purely execution-time,
   orchestrating multiple agents across already-decided parallel work.

Pipeline shape: `deepen` (find + rank) → `grill` (small-scope item) or `wayfinder`
(session-spanning item) → `blueprint` → `break-it-down` → `implement` (single task) or
`fleet-command` (orchestrated, once built).

## Distributed here rather than a standalone skill

- `engineering/domain-modeling` — his skill is a dedicated CONTEXT.md/ADR/glossary tool. We don't
  have a standalone equivalent; the same responsibility is split across `grill`'s doc-anchored mode
  and `setup-agent-context`'s domain-docs section.

## Reviewed, worth adopting eventually (no urgency)

- `engineering/research` — investigates a question against primary sources, captures findings as markdown. Real value, no pressing gap it fills right now.
- `engineering/wizard` — generates an interactive bash wizard for human-only setup steps (credentials, infra, unfamiliar dashboards).
- `productivity/to-questionnaire` — turns an unanswerable decision into a questionnaire for someone else.

## Reviewed, not adopting

- `misc/setup-pre-commit` (Husky/lint-staged) — stack mismatch, we don't use pre-commit hooks.
- `in-progress/setup-ts-deep-modules` — folded into `deepen`'s design instead of standing alone.
- `misc/git-guardrails-claude-code` — uncertain value, revisit if the appetite comes back.
- `productivity/wait-what` — wouldn't reach for it.
- `engineering/triage` — a full state-machine for a live external-PR backlog is heavier process than fits how this repo is used right now.
- `in-progress/loop-me` — unfinished even in his own repo, scope unclear.
- `productivity/teach` — outside this repo's engineering-workflow focus.

## Out of scope for this repo

- `in-progress/writing-beats`, `in-progress/writing-fragments`, `in-progress/writing-shape` — personal article-writing craft, not engineering workflow.
- `misc/migrate-to-shoehorn`, `misc/scaffold-exercises` — narrow to his own library/course content.

## Not yet reviewed

Empty as of the 2026-08-06 pass — everything in the checkpoint above has a verdict somewhere in
this doc. Repopulate this section with whatever's new after the next `git pull` inside `mps/`.

When a skill gets evaluated, move it to whichever section above actually applies — don't leave a
skill in both places.
