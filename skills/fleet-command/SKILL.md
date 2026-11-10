---
name: fleet-command
description: Take a parent ticket whose subtasks already exist (from /break-it-down), work out which subtasks are independent and can run in parallel versus which have to wait on another finishing first, then dispatch one /implement subagent per subtask into its own git worktree, each branched from the work it depends on (stacked on its blockers, or off a shared integration branch). Commits each subtask's finished work and tears down its worktree, runs a consolidation pass (/review then /deepen) over the whole fleet's output, then offers, but never assumes, to push the branches and open PRs (via /pr-description) into the integration branch. Use when the user wants to execute a multi-subtask ticket across several agents at once, says "run the fleet on X", "work these subtasks in parallel", or has just run /break-it-down and is ready to start execution.
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
- **Merge into shared branches** — subtask branches merge into the integration branch, and the
  integration branch into `main`, only through reviewed PRs. The only merges this skill makes are
  local ones that build a dependent subtask's starting point from its blockers' branches (step 6).
- **Update ticket status or close subtasks** — issue management stays manual, same convention
  `/implement` uses.

## Process

### 1. Read repo context

- `docs/agents/issue-tracker.md` — required to fetch the parent ticket and its subtasks. If
  missing, stop: _"This repo hasn't been initialised. Run `/setup-agent-context` first."_
- `docs/agents/code-host.md` — needed later for pushing branches and opening PRs.
- `.claude/agents/issue-tracker.local.md` and `.claude/agents/code-host.local.md` — this
  machine's commands for both, which the two docs above point to.
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
- **A structural change to files others edit.** A subtask that moves, splits or renames a file
  blocks every subtask that edits that file, even when neither mentions the other. Run in
  parallel, the others edit the old file and every one of them conflicts with the move.

Subtasks with no such signal between them are independent — default to parallel, don't invent an
ordering that isn't there. Start from the dependencies `break-it-down` recorded (`Blocked by`
lines or links), then add any it missed, the structural rule above especially. Present the result
as a proposal in the next step, not a fact.

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
            base: feat/proj-123-payment-retry--add-retry-endpoint
```

Each dependent subtask shows its base (step 6): its blocker's branch, or the blockers it will
merge.

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

1. Create the worktree on the subtask's **base** — the branch it starts from:
   - **No blockers**: the integration branch.
   - **One blocker**: that blocker's branch, so the subtask builds on the work it depends on.
   - **Several blockers**: the first blocker's branch, then merge each other blocker's branch into
     it (see *Merging a base* below).

   `git worktree add -b feat/<ticket-slug>--<subtask-slug> .worktrees/<branch> <base>` from the
   main working copy. Branch from the integration branch alone and a dependent subtask starts
   without the code it depends on.
2. Spawn one Agent-tool subagent (background), briefed explicitly since none of this is otherwise
   discoverable to it:
   - The absolute worktree path to work in (it must `cd` there — this is a separate working tree,
     not the main one)
   - The subtask's key. For a local-markdown tracker, the **absolute path to the issue file in the
     main working copy**, not a copy inside the worktree: tracker files are usually gitignored, so
     a copy disappears with the worktree, taking the agent's status and comment updates with it.
   - The absolute paths to `.claude/agents/issue-tracker.local.md` and `code-host.local.md` in the
     main working copy. They're gitignored, so the worktree doesn't have them
   - What its base already contains: which blockers' work is merged in and what each provides
     (components, interfaces, files moved), so it doesn't rebuild or work around them
   - Its own pair of ports for any dev, preview or test server, if the repo's config reads ports
     from the environment. Parallel worktrees on the same hard-coded port test each other's servers.
     If ports are hard-coded, say so in the brief and have the agent wait for a free port
   - **Briefs give context, never scope.** Scope comes only from the issue. Don't add constraints
     ("don't touch X") that the issue doesn't state; if the issue and a background doc disagree,
     the issue wins
   - **Decide, don't defer**: the agent makes every judgement call within its subtask and reports
     each as Chose / Why / Impact (per `/implement`'s report), escalating only spec contradictions
     and irreversible actions
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
- If its report has **Known defects**, copy them word for word into every progress update you
  give the user from now on, until the user decides on each one. Never summarise, merge, reword
  or drop them — a defect compressed into "low risk, not fixed" is a defect lost.

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

### 7. Consolidate

No single `/implement` agent sees the whole fleet's output, so duplication across subtasks goes
unseen: two agents each write a unit lookup, a date formatter, a type, and the copies drift apart.
Once every subtask has finished:

1. Create `feat/<ticket-slug>--consolidate` off the branch that holds all the work (the last
   stacked branch, or a merge of every subtask branch built as in *Merging a base*).
2. Run `/review` against the integration branch as the fixed point, and collect the seam
   candidates and duplications the `/implement` reports named. Its Behaviour axis now sees the
   whole fleet's output at once, so it can catch paths that only diverge across subtasks. Spec
   "wrong" and Behaviour findings are not `/deepen` work: add each to **Known defects**, quoted
   word for word.
3. Run `/deepen` on them in that worktree: fold duplicates into one shared version, build the
   confined seams. No new behaviour; the full suite, end-to-end and visual specs stay green.
4. Commit, and list it in the final report as one more branch.

Skip steps 3–4 only if the review finds no cross-subtask duplication and no reported seam is
confined. Say so in the report. Step 2's review always runs.

### 8. Final report

```
✓ PROJ-124  Add /payments/retry endpoint         → feat/proj-123-payment-retry--add-retry-endpoint
✓ PROJ-126  Dead-letter queue infra               → feat/proj-123-payment-retry--dlq-infra
✓ PROJ-125  Retry button + error state handling   → feat/proj-123-payment-retry--retry-button

Integration branch: feat/proj-123-payment-retry
Nothing pushed yet — branches are local, ready for you to review (diff/log) before anything ships.
```

List held or failed subtasks separately, with the reason, if any remain unresolved.

Below the table, first:

- **Known defects** — every Known defect from every `/implement` report and from step 7's review,
  copied word for word with its subtask, scenario and why it wasn't fixed. Never summarise, merge
  or drop one, and don't move one into Decisions. Each needs the user's call: fix now, file it, or
  accept it. Write "none" if there are none.

Then, for the user to review rather than answer:

- **Decisions** the agents made, gathered from their reports in Chose / Why / Impact form. Lead
  with the ones whose impact reaches beyond their own subtask.
- **Merges** you resolved while building bases, and how.
- **Questions**, only for what an agent escalated as genuinely the user's call, each with the
  choice the agent would make.

If any subtask was held or failed, or any `/implement` report named friction in its `/retro`
line, add one line suggesting `/retro` on this session, naming which subtasks hit friction. Its
subagent transcripts are part of the session, so one retro covers the whole fleet. Don't run it;
it's the user's call.

### 9. Offer to publish

Ask once, for the whole successful batch: _"Push these N branches and open PRs into
feat/proj-123-payment-retry?"_ Never assume — wait for explicit yes.

If yes, per branch:

1. `git push -u origin <branch>`
2. Invoke `/pr-description`, passing the integration branch as its base-branch override, so the
   PR targets the integration branch rather than `CONTRIBUTING.md`'s repo-wide default.

Exclude held or failed subtasks from the offer; name them separately as still needing a decision.
