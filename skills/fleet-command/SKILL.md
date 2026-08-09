---
name: fleet-command
description: Take a parent ticket whose subtasks already exist (from /break-it-down), work out which subtasks are independent and can run in parallel versus which have to wait on another finishing first, then dispatch one /implement subagent per subtask into its own git worktree and branch off a shared integration branch. Commits each subtask's finished work and tears down its worktree, then — once the fleet finishes — offers, but never assumes, to push the branches and open PRs (via /pr-description) into the integration branch. Use when the user wants to execute a multi-subtask ticket across several agents at once, says "run the fleet on X", "work these subtasks in parallel", or has just run /break-it-down and is ready to start execution.
subagent-role: orchestrator
compatibility: claude-code
argument-hint: "parent ticket key or path (e.g. PROJ-123, GH-42, .claude/scratch/<slug>/) with subtasks already created by /break-it-down"
---

# Fleet Command

Take a parent ticket with subtasks already in the tracker, plan which subtasks can run in
parallel, and dispatch one `/implement` subagent per subtask — each in its own git worktree and
branch — to do the work. This is an execution-time alternative to running `/implement` on each
subtask one at a time: same pipeline position (`grill → blueprint → break-it-down → implement`),
but fanned out across agents instead of one session at a time.

## What this skill does NOT do

- **Decompose a ticket into subtasks** — that's `/break-it-down`. Fleet-command requires subtasks
  to already exist; it doesn't create them.
- **Implement anything itself** — every line of code comes from an `/implement` subagent. This
  skill's own job is planning, dispatching, committing, and cleaning up worktrees.
- **Merge branches** — subtask branches merge into the integration branch, and the integration
  branch into `main`, only through reviewed PRs. Nothing in this skill merges anything.
- **Resolve conflicts between subtask branches** — if two subtasks land conflicting changes,
  that's a `/rebase` or `/tidy-branch` job once you're looking at the PRs.
- **Update ticket status or close subtasks** — issue management stays manual, same convention
  `/implement` uses.

## Process

### 1. Read repo context

- `docs/agents/issue-tracker.md` — required to fetch the parent ticket and its subtasks. If
  missing, stop: _"This repo hasn't been initialised. Run `/setup-agent-context` first."_
- `docs/agents/code-host.md` — needed later for pushing branches and opening PRs.
- `CONTRIBUTING.md` — base branch, branch naming prefix (`feat/`, `fix/`), and commit format.

### 2. Resolve the parent ticket and its subtasks

- **No argument** — ask: _"Which ticket's fleet should I run? Give me the parent key or path."_
- **Ticket key or path given** — fetch it per `docs/agents/issue-tracker.md`'s conventions, then
  fetch every linked subtask's title, description, and acceptance criteria.

If the parent has no subtasks yet, stop: _"PROJ-123 has no subtasks. Run `/break-it-down` first."_

### 3. Plan the dependency graph (silent)

Read every subtask's title, description, and acceptance criteria together. Group them into
layers — Layer 1 has no unresolved dependency, Layer 2 depends on something finishing in Layer 1,
and so on. Infer ordering only from real signals:

- Explicit language ("requires", "after", "blocked by", "needs the endpoint from")
- One subtask defines an interface/schema/contract another subtask consumes
- Shared surface where sequencing avoids rework (e.g. a migration before the code that reads it)

Subtasks with no such signal between them are independent — default to parallel, don't invent an
ordering that isn't there. `break-it-down` doesn't record explicit dependency edges today, so this
is inference, not ground truth — present it as a proposal in the next step, not a fact.

### 4. Show the plan, get confirmation

Present the layers, the integration branch name, and the concurrency cap before touching git:

```
Parent: PROJ-123 — Payment Retry Logic
Integration branch: feat/proj-123-payment-retry  (will create)
Concurrency cap: 4

Layer 1 — dispatch now (parallel):
  PROJ-124  Add /payments/retry endpoint
  PROJ-126  Dead-letter queue infra

Layer 2 — waits on Layer 1:
  PROJ-125  Retry button + error state handling  ← depends on PROJ-124 (needs the endpoint contract)
```

Ask: _"Does this look right? Say if something should move layers, run independently, or if the cap
should change."_ Wait for explicit confirmation before creating any branch, worktree, or agent.

### 5. Create the integration branch

If `feat/<ticket-slug>` (or `fix/` per the ticket type) doesn't already exist, create it off
`CONTRIBUTING.md`'s base branch. If it already exists — e.g. a previous fleet run for the same
ticket — use it as-is.

### 6. Dispatch layer by layer

**Branch naming is flat, not nested:** `feat/<ticket-slug>--<subtask-slug>` (double-dash, one path
segment). Never name a subtask branch as a path under the integration branch
(`feat/<ticket-slug>/<subtask-slug>`) — git stores branches as a ref hierarchy, so a branch
`feat/<ticket-slug>` and a branch `feat/<ticket-slug>/<subtask-slug>` cannot coexist; git refuses
to create the second because the first occupies that path as a file, not a directory.

**Worktree location:** `.worktrees/<subtask-branch>/` at the repo root. Add `.worktrees/` to
`.gitignore` if it isn't already ignored.

For each subtask in the current layer, up to the concurrency cap at a time:

1. `git worktree add -b feat/<ticket-slug>--<subtask-slug> .worktrees/<branch> feat/<ticket-slug>`
   from the main working copy.
2. Spawn one Agent-tool subagent (background), briefed explicitly since none of this is otherwise
   discoverable to it:
   - The absolute worktree path to work in (it must `cd` there — this is a separate working tree,
     not the main one)
   - The subtask's key
   - Instruction to run `/implement <subtask-key>`, then once it's done, run `/commit` in that
     worktree to commit the finished work (reuses `/commit`'s own `CONTRIBUTING.md`-aware message
     format rather than reinventing one here)
3. Track dispatched agents. When a slot frees up, pull the next queued subtask from the *current*
   layer into it. Don't start a Layer N+1 subtask until every Layer N subtask it depends on has
   actually finished — a free slot alone isn't permission to skip ahead.

When an agent reports done:

- Confirm a commit landed on its branch (`git log` in the worktree). If nothing committed, treat
  it as a failure (see below).
- `git worktree remove .worktrees/<branch>`. The branch persists in the repo; only the working
  tree goes away.

**On failure** (agent errors, or reports it couldn't finish): leave that worktree in place —
don't remove evidence of a broken run. Hold any subtask that depended on it (don't dispatch it).
Surface immediately, don't wait for the batch: _"PROJ-124 failed — [reason]. Retry, skip it (drops
PROJ-125, which depends on it), or abort the rest of the run?"_ Subtasks already dispatched and
running keep going regardless of the answer — only *dispatching new work* pauses.

### 7. Final report

```
✓ PROJ-124  Add /payments/retry endpoint         → feat/proj-123-payment-retry--add-retry-endpoint
✓ PROJ-126  Dead-letter queue infra               → feat/proj-123-payment-retry--dlq-infra
✓ PROJ-125  Retry button + error state handling   → feat/proj-123-payment-retry--retry-button

Integration branch: feat/proj-123-payment-retry
Nothing pushed yet — branches are local, ready for you to review (diff/log) before anything ships.
```

List held or failed subtasks separately, with the reason, if any remain unresolved.

### 8. Offer to publish

Ask once, for the whole successful batch: _"Push these N branches and open PRs into
feat/proj-123-payment-retry?"_ Never assume — wait for explicit yes.

If yes, per branch:

1. `git push -u origin <branch>`
2. Invoke `/pr-description`, passing the integration branch as its base-branch override, so the
   PR targets the integration branch rather than `CONTRIBUTING.md`'s repo-wide default.

Exclude held or failed subtasks from the offer; name them separately as still needing a decision.
