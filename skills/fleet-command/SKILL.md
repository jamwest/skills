---
name: fleet-command
description: Run a parent ticket's approved /change-plan across several agents at once. Reads the split (seam subtasks first, then behaviour subtasks, with what each depends on) from ~/runs/<repo>/<ticket>.md, then dispatches one /implement subagent per subtask into its own git worktree, each branched from the work it depends on. Each agent plans its subtask against current code, builds it, reviews it once against the plan, and pushes a draft PR. Tears down worktrees, runs a duplication check of the fleet's output against the plan, and reports planned vs actual. Use when the user wants to execute a multi-subtask ticket across several agents at once, says "run the fleet on X", "work these subtasks in parallel", or has just approved a /change-plan split.
subagent-role: orchestrator
compatibility: claude-code
argument-hint: "parent ticket key or path (e.g. PROJ-123, GH-42, .claude/scratch/<slug>/) with an approved /change-plan"
---

# Fleet Command

Take a parent ticket whose `/change-plan` split is approved and whose subtasks exist, and dispatch
one `/implement` subagent per subtask — each in its own git worktree and branch — to do the work.
This is an execution-time alternative to running `/implement` on each subtask one at a time:
same pipeline position (`grill → change-plan → implement → review`), but fanned out across agents.

## What this skill does NOT do

- **Plan the split or the dependencies** — that's `/change-plan`. The approved plan says which
  subtasks exist, in what order, and what each depends on. Fleet-command dispatches from it.
- **Implement or refactor anything itself** — every line of code comes from an `/implement`
  subagent, seam refactors included. This skill's own job is dispatching, branching, and cleaning
  up worktrees.
- **Merge into shared branches** — subtask branches merge into the merge target from step 4 only
  through reviewed PRs. The only merges this skill makes are
  local ones that build a dependent subtask's starting point from its blockers' branches (step 6).
- **Update ticket status or close subtasks** — issue management stays manual, same convention
  `/implement` uses.

## Process

### 1. Read repo context

- `docs/agents/issue-tracker.md` — required to fetch the parent ticket and its subtasks. If
  missing, stop: _"This repo hasn't been initialised. Run `/setup-agent-context` first."_
- `docs/agents/code-host.md` — needed later for pushing branches and opening PRs.
- `.claude/agent-context/issue-tracker.local.md` and `.claude/agent-context/code-host.local.md` — this
  machine's commands for both, which the two docs above point to.
- `CONTRIBUTING.md` — base branch, branch naming prefix (`feat/`, `fix/`), and commit format.
- The run file `~/runs/<repo>/<ticket>.md` and the questions file next to it
  ([run-format.md](../change-plan/run-format.md)). Before asking the user anything, follow
  [questions-format.md](../change-plan/questions-format.md).

### 2. Resolve the parent ticket and its subtasks

- **No argument** — ask: _"Which ticket's fleet should I run? Give me the parent key or path."_
- **Ticket key or path given** — read the run file. It must have `status: approved` and a key next
  to every subtask. If there's no run file, or it isn't approved, stop: _"PROJ-123 has no approved
  plan. Run `/change-plan PROJ-123` first."_ Then fetch every subtask's title, description and
  acceptance criteria from the tracker.

### 3. Read the layers from the plan

Group the subtasks into layers from the split's "Depends on" column: Layer 1 depends on nothing,
Layer 2 on something in Layer 1, and so on. Seam subtasks come first by construction. Don't add or
drop dependencies: if one looks missing (two subtasks edit a file one of them moves, two add a
migration), that's a wrong plan. Say so and suggest a re-plan rather than fixing it here.

### 4. Show the run, then go

Show the layers, the branch names, the concurrency cap and where the PRs merge, in one message:

```
Parent: PROJ-123 — Payment Retry Logic   (plan approved 2026-11-24)
Integration branch: feat/proj-123-payment-retry  (will create)
Concurrency cap: 4
PRs: into main; dependent ones stacked on their blocker until it merges

Layer 1 — dispatch now (parallel):
  PROJ-124  Share one retry schedule (seam)
  PROJ-126  Dead-letter queue infra

Layer 2 — waits on Layer 1:
  PROJ-125  Retry button + error state  ← PROJ-124
            base: feat/proj-123-payment-retry--share-retry-schedule
```

Default merge target: `CONTRIBUTING.md`'s base branch, with seam PRs merged first and a dependent
PR based on its blocker's branch until that merges. Use the integration branch as a merge target
only when the subtasks can't ship alone (no flag, a migration that isn't expand-only); then say so
here.

Then start. The split was approved in `/change-plan`, and branches and worktrees are local and
cheap to undo, so don't wait for another yes. Stop and ask only if the plan leaves the merge target
open and the subtasks can't ship alone.

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

1. Create the worktree on the subtask's **base** — the branch it starts from:
   - **No blockers**: the merge target from step 4. When that's the base branch, start from its
     latest commit, not from an older integration branch, or the PR carries extra commits.
   - **One blocker**: that blocker's branch, so the subtask builds on the work it depends on.
   - **Several blockers**: the first blocker's branch, then merge each other blocker's branch into
     it (see *Merging a base* below).

   `git worktree add -b feat/<ticket-slug>--<subtask-slug> .worktrees/<branch> <base>` from the
   main working copy. Branch from the integration branch alone and a dependent subtask starts
   without the code it depends on.

   Then copy every gitignored env file (`.env`, `.env.local`, `.env.<name>`, but not
   `.env.example`) from the main working copy to the same path in the worktree. Look in the
   repo root and in each app and package. A new worktree has none of them, so its agent can't
   start a dev server, take screenshots or run integration tests, and reports "not checked"
   when it could have checked. Do the same for every worktree this skill makes, including
   any merge built for step 7.

   Then install dependencies in the worktree with the repo's package manager (`npm install`,
   `pnpm install`, `uv sync`…), and restore the lockfile if the install rewrote it. Without
   this, a monorepo's workspace imports resolve up to the main working copy's dependency
   folder and from there to the main copy's packages, so typecheck and tests pass against the
   base branch's code, not the subtask's. Every check the agent reports is then worthless.
2. Spawn one Agent-tool subagent (background), briefed explicitly since none of this is otherwise
   discoverable to it:
   - The absolute worktree path to work in (it must `cd` there — this is a separate working tree,
     not the main one)
   - The subtask's key. For a local-markdown tracker, the **absolute path to the issue file in the
     main working copy**, not a copy inside the worktree: tracker files are usually gitignored, so
     a copy disappears with the worktree, taking the agent's status and comment updates with it.
   - The absolute path of every file in `.claude/agent-context/` in the main working copy
     (`issue-tracker.local.md`, `code-host.local.md`, and any others such as a database or
     code-quality note), each with a one-line note on what it covers. They're gitignored, so the
     worktree doesn't have them
   - What its base already contains: which blockers' work is merged in and what each provides
     (components, interfaces, files moved), so it doesn't rebuild or work around them
   - Its own pair of ports for any dev, preview or test server, if the repo's config reads ports
     from the environment. Parallel worktrees on the same hard-coded port test each other's servers.
     If ports are hard-coded, say so in the brief and have the agent wait for a free port
   - That its env files are already copied in, so it can run servers and integration tests
   - How to make changes safely when its worktree is nested inside a session that is isolated
     to its own worktree (Claude Code's worktree guard refuses shell commands it can't verify):
     change files with the Edit and Write tools, never with shell heredocs, `sed -i` or
     `cat >>`, because the tools fail loudly and a refused shell edit can be lost without a
     sign. Run one git command per call, without `&&` chains or `git -C`. For anything else
     the guard refuses, write the script to `/tmp` and run it as one command. `cd` does not
     carry between shell calls, so give the agent a ready-made wrapper: copy
     [wt-git.sh](./wt-git.sh) to `/tmp` and tell it to run every git command as
     `sh /tmp/wt-git.sh <worktree> <git args>`. Agents that improvise one have run a
     cherry-pick in the parent checkout by mistake
   - The run file and questions file paths (absolute, in the home directory, shared by every
     agent). `/implement` writes its `## <KEY> plan`, `### Actual` and review sections there, and
     checks the questions file before asking anything. Say it runs in a fleet, so it
     edits only its own section and its `/review` leaves the frontmatter totals alone
   - The branch name and the PR base (its blocker's branch, or the merge target from step 4), for
     `/implement`'s draft PR
   - **Evidence is part of the PR.** `/implement` opens the draft PR through `/pr-description`,
     which captures the plan's shots. Never switch that off in a brief. If the agent cannot reach
     a screen (a login, a missing service), it reports the blocker; it never writes "not checked"
     and carries on
   - **Briefs give context, never scope.** Scope comes from the issue and the plan's file list.
     Don't add constraints ("don't touch X") that neither states; if the issue and a background
     doc disagree, the issue wins
   - **Decide, don't defer**: the agent makes every judgement call within its subtask and reports
     each as Chose / Why / Impact (per `/implement`'s report), escalating only spec contradictions
     and irreversible actions
   - Instruction to run `/implement <subtask-key>`. It plans the subtask, builds it, reviews it
     once against the plan, commits, pushes and opens a draft PR with no reviewers
     ([pr-lifecycle.md](../pr-description/pr-lifecycle.md))
3. Track dispatched agents. When a slot frees up, pull the next queued subtask from the *current*
   layer into it. Don't start a Layer N+1 subtask until every Layer N subtask it depends on has
   actually finished — a free slot alone isn't permission to skip ahead.

When an agent reports done:

- Confirm a commit landed on its branch (`git log` in the worktree) and the draft PR exists. If
  nothing committed, treat it as a failure (see below). If it stopped for a re-plan or a question,
  hold it and its dependents, and bring the question to the user.
- `git worktree remove .worktrees/<branch>`. The branch persists in the repo; only the working
  tree goes away.
- If its report has **Known defects**, copy them word for word into every progress update you
  give the user from now on, until the user decides on each one. Never summarise, merge, reword
  or drop them — a defect compressed into "low risk, not fixed" is a defect lost.

**Rework after a user decision.** When a decision changes a finished subtask (a redesign, a dropped
requirement, a new state), dispatch it again as `/implement <subtask-key>` in a worktree on that
subtask's branch. Pass the decisions as the overrides list for `/implement` step 2. Don't send a
free-form "make these changes" prompt: it skips step 8, so the reworked code ships with less review
than the first version. The rework gets one review round, and a second only if the first found a
bug or a wrong plan answer. `/pr-description` retakes only the shots whose screens' files changed. A fork can't spawn the review subagents. If you use one, run `/review` and
`/brittle-tests` yourself on its output before you report it done.

**Restacking.** When a fix lands on a lower branch of a stack, rebase every branch above it with
[restack.sh](./restack.sh): `sh restack.sh <worktree> <lower-branch> <old-lower-tip> <branch>…`,
where `<old-lower-tip>` is the commit the lower branch pointed at before the fix and the branches
above it are listed lowest first. It runs `git rebase --onto` up the chain and stops at the first
conflict, with the rebase left in progress for you to resolve and continue. Then push each
restacked branch with `--force-with-lease` while its PR is a draft; ask first once it's ready
([pr-lifecycle.md](../pr-description/pr-lifecycle.md)).
Don't spawn an agent for a restack that applies cleanly. Then check at this depth, not more:

- Lint, typecheck and unit tests on **every** restacked branch. These are cheap and catch a
  commit that needs code from a later branch.
- The slow suites (database integration, end-to-end) only on the **branch that changed** and the
  **top of the stack**, which holds everything. Running them on each branch in between repeats
  the same tests on a subset of the code.

**When the user decides a Known defect**, check their reason against how the defect works before
recording it as decided. If the reason contradicts the scenario (e.g. "the unique ID means this
can't happen" when the unique constraint is what produces the orphan), say so plainly, explain the
scenario again, and ask again. A decision made on a wrong premise isn't a decision.

**Merging a base.** Merge the blockers in, then verify before dispatching anything onto it:

- **Resolve each conflict from both sides' intent**, not by picking one. When one side moved or
  split a file and the other edited the old copy, keep the move and re-apply the edit in the new
  location. When both sides appended to the same file (stylesheets especially), keep both blocks
  whole: check every rule's braces close. Deleting conflict markers from interleaved blocks
  leaves broken code that typecheckers and unit tests don't read.
- **Run every check the repo has** on the merged base: build, typecheck, lint (including any CSS
  or style lint), unit tests, end-to-end, screenshot or visual specs. A merge that only passes
  typecheck and unit tests isn't verified.
- **Commit the merge** and record what you resolved; it goes in the final report.
- Escalate a conflict only when resolving it needs a product call the spec doesn't answer. Say
  which resolution you'd pick and why.

**On failure** (agent errors, or reports it couldn't finish): leave that worktree in place —
don't remove evidence of a broken run. Hold any subtask that depended on it (don't dispatch it).
Surface immediately, don't wait for the batch: _"PROJ-124 failed — [reason]. Retry, skip it (drops
PROJ-125, which depends on it), or abort the rest of the run?"_ Subtasks already dispatched and
running keep going regardless of the answer — only *dispatching new work* pauses.

### 7. Check for duplication

The plan put shared code into seam subtasks before any agent started. Check that it held. Once
every subtask has finished, spawn one fresh subagent over the combined diff (the top of the stack,
or a local merge of every subtask branch built as in *Merging a base*), with the run file's Seams
section. Ask it to report:

- Logic written more than once across subtasks (two formatters, two lookups, two types for one
  thing), with file:line for each copy
- Places that should share a planned seam but don't
- Paths that diverge across subtasks where the plan says they agree

This is a check, not a refactor pass. Each real duplication goes in the final report, and into the
run file's `## Fleet check` section ([run-format.md](../change-plan/run-format.md)), so the next
plan catches it. Then sum every subtask's `### Review` counts into the run file's frontmatter. Fixing one is a rework of the subtask that caused it (see *Rework*), and only when the
user asks.

### 8. Final report

```
✓ PROJ-124  Share one retry schedule (seam)  → feat/proj-123-payment-retry--share-retry-schedule  PR #41 (draft)
✓ PROJ-126  Dead-letter queue infra         → feat/proj-123-payment-retry--dlq-infra             PR #42 (draft)
✓ PROJ-125  Retry button + error state      → feat/proj-123-payment-retry--retry-button          PR #43 (draft)

Draft PRs open, no reviewers. Plan: 18 non-test files; actual: 20 (2 off-list, each noted).
```

List held or failed subtasks separately, with the reason, if any remain unresolved.

Below the table, first:

- **Known defects** — every Known defect from every `/implement` report,
  copied word for word with its subtask, scenario and why it wasn't fixed. Never summarise, merge
  or drop one, and don't move one into Decisions. Each needs the user's call: fix now, file it, or
  accept it. Write "none" if there are none.

Then, for the user to review rather than answer:

- **Plan vs actual** per subtask: planned and actual non-test files, off-list files with their
  why, plan answers that were wrong, and step 7's duplication findings.
- **Decisions** the agents made, gathered from their reports in Chose / Why / Impact form. Lead
  with the ones whose impact reaches beyond their own subtask.
- **Merges** you resolved while building bases, and how.
- **Questions**: open entries in the questions file, each with the choice the agent would make.

If any subtask was held or failed, or any `/implement` report named friction in its `/retro`
line, add one line suggesting `/retro` on this session, naming which subtasks hit friction. Its
subagent transcripts are part of the session, so one retro covers the whole fleet. Don't run it;
it's the user's call.

### 9. Ready

Every successful subtask already has a draft PR. Follow
[pr-lifecycle.md](../pr-description/pr-lifecycle.md) for each: before marking any ready, rebase the
stack onto the latest base branch (a base that moved during the run often brings a migration
number clash), re-run the checks per *Restacking*, and force-push with lease. When a PR passes the
ready checks, say so and ask once to mark it ready and add reviewers. Seam PRs go first.

Held or failed subtasks have no PR; name them separately as still needing a decision.
