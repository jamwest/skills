---
name: change-plan
description: Plan a change before any code is written. Reads the code the whole ticket touches, including sibling paths (every sender, every close path, every screen that shows the thing), finds shared seams, and splits the work into seam subtasks first and behaviour subtasks after, each with its list of non-test files. Answers the shared change checklist for each subtask and settles product calls through a questions file, showing what the patient or practitioner sees under each option. Two sizes - ticket size (after /grill; the user approves the split, then subtasks are created in the tracker) and subtask size (/implement runs it as its first step, no approval). Writes the plan to ~/runs/<repo>/<ticket>.md. Use when the user says "plan this change", "change plan", "split this ticket", "break this down", "how should we do this ticket", or has just grilled a ticket and wants to start.
subagent-role: interactive
model: opus
argument-hint: "ticket key (e.g. PROJ-123) for ticket size; /implement passes a subtask key for subtask size"
---

# Change Plan

Make the change easy, then make the easy change. Read the code the whole change touches before
anyone writes any, so the seams and the sibling paths are found here and not in review rounds.

Pipeline: `/grill` (what and why, in the ticket) → `/change-plan` (ticket size) →
`/fleet-command` or `/implement` (which runs subtask size first) → `/review` (against the plan).

The skill has two sizes:

- **Ticket size** reads across the whole ticket, proposes the split, settles product calls, and
  creates the subtasks once the user approves. Steps T1 to T9.
- **Subtask size** turns one subtask's part of the ticket plan into exact files and commits,
  against the code as it is now. `/implement` runs it as its first step. No approval. Steps S1 to
  S4. A single small change with no ticket plan gets subtask size alone.

## What this skill does not do

- **Write code.** Seam refactors are planned here and built by `/implement`.
- **Put file lists in the ticket.** The tracker holds what and why only. File lists live in the
  plan file and the PR.
- **Re-open what the ticket settles.** `/grill` wrote the what and why. A gap in it is a product
  call, not a reason to redesign.

## Files

- **Plan:** `~/runs/<repo>/<ticket>.md`. Format, sections and who writes each:
  [run-format.md](./run-format.md).
- **Questions:** `~/runs/<repo>/<ticket>.questions.md`. Format and the rules every asking skill
  follows: [questions-format.md](./questions-format.md).
- **Checklist:** [../review/change-checklist.md](../review/change-checklist.md). The same list
  `/review` checks the code against.

## Process

### 1. Read context

- `docs/agents/issue-tracker.md` and the `.claude/agent-context/issue-tracker.local.md` it points
  to. At ticket size, if missing, stop: _"Run `/setup-agent-context` first."_ Subtask size can run
  without it.
- `CONTEXT.md` for domain words, `docs/adr/` for settled decisions, `CONTRIBUTING.md` for the base
  branch and coding standards.
- The checklist.
- The run file and questions file for this ticket, if they exist. An answered question is settled.

### 2. Pick the size

- **Subtask size** when `/implement` runs this for a subtask, or the user asks for a plan of one
  small change. Go to S1.
- **Ticket size** otherwise. Go to T1. If an approved ticket plan already exists, say so and ask
  whether to re-plan. A re-plan shows what changed against the old split.

## Ticket size

### T1. Read the ticket

Fetch the ticket, its comments and any subtasks. The what and why come from the ticket text. If
the ticket has no clear what and why (no "done looks like"), stop and suggest `/grill <ticket>`
first.

If subtasks already exist, plan around them: keep the ones that fit, and propose changes to the
rest in the split.

### T2. Read the code, wide

For each thing the ticket changes, find and list as **Touch points** (file, one-line why):

- Every writer and reader of it. Grep the column, enum value, function and type names, across
  every app and package, not just the one the ticket names.
- Its sibling paths: every sender, every close, cancel or withdraw path, every scheduler or
  cadence that acts on it, every screen, email and SMS that shows it, every audit write.
- The tests that cover each.

These are the gaps reviews keep finding late. Examples: a daily job and a weekly job that must
agree on timing, but each works it out alone. A new close path that the invite-withdraw path
doesn't get. Audit rows written with the wrong accessor type on one path. A review screen that
uses labels for ongoing actions on one-time actions.

On a wide ticket, run up to three Explore subagents in parallel (`model: haiku`), one per area,
each given the ticket text and the names to trace. They only locate code; merge their lists
yourself.

### T3. Find the seams

A seam is a change with no behaviour change that makes the behaviour change small: one shared
function where several callers wire the same thing, one copy of a rule two places must agree on,
one place that picks a label several screens pick for themselves.

Look for repeated wiring across the touch points, and two copies of anything the ticket changes.
For each seam, note which subtasks use it:

- **Used by two or more subtasks** → its own seam subtask, its own PR, merged first. No behaviour
  change.
- **Used by one** → the first commits of that subtask's PR.

**A latent bug found while making a seam** may be fixed in the seam PR, as its own commit, with a
regression test that fails before the fix, named in the PR description as the PR's one behaviour
change. If the fix changes what a patient or practitioner sees in a way that is a product call, it
goes to the questions file first.

Count the non-test files for the planned version and for the naive version (no seams), when you
can estimate it. The approval screen shows both.

### T4. Split

Seam subtasks first, then behaviour subtasks. Each behaviour subtask changes one behaviour, as
little as it can, in a PR a reviewer can read in one sitting. For each subtask:

- Title (verb and object), one-line what, and why
- **Non-test files**: the exact list. This is the subtask's file budget. Tests and fixtures don't
  count.
- Depends on, and kind (seam or behaviour)

Record a dependency when:

- One subtask builds or changes something another uses (a function, a component, a schema).
- One subtask moves, splits or renames a file others edit. It blocks every one of them, even when
  neither mentions the other.
- Two subtasks each add a migration. One waits for the other, or both take the same number.

**Keep the feature reachable.** If a subtask that waits on a product call also carries what every
other subtask needs to be used for real (the first config entry, the route that opens the new
screen), split that piece out so the rest can be tested for real.

**Check the docs against each other.** Read every document the ticket points at (designs, ADRs,
`CONTEXT.md`) side by side. A value, a piece of copy or a rule one states and another breaks is a
product call (T6).

### T5. Answer the checklist

For each subtask, answer every checklist item in one line, or "doesn't apply". Answer from the
code you read in T2, naming the files. An item you can't answer becomes either a product call (T6)
or a task inside a subtask (or a new subtask).

### T6. Product calls

A product call is a choice the ticket doesn't settle that changes what a patient or practitioner
sees, or what stops happening for them. Write each one to the questions file, following
[questions-format.md](./questions-format.md): options with what each person sees under each,
including what stops happening, a recommendation, and a one-sentence read-back of the behaviour
under each option. A question whose answer only shows up in code ("fallback or no fallback?") gets
misread. A question that says what the patient sees doesn't.

### T7. Shot list

For each subtask that changes a screen, list the evidence shots, one line each: the screen and
state, and the acceptance criterion it proves. `/ui-evidence` follows this list at PR time. Keep it
to what proves the criteria (2 to 5 shots for most subtasks).

### T8. Write the plan, show the approval screen

Write the run file with `status: draft` ([run-format.md](./run-format.md)). An optional Mermaid
diagram of the subtasks can go in the file, not the chat.

Then show the approval screen in chat, as markdown, with these four parts and nothing else:

1. **Split**: a table with subtask, one-line what, non-test file count, depends on, seam or
   behaviour.
2. **Product calls**: each with the options and what the patient or practitioner sees under each,
   the recommendation and its read-back.
3. **Risks**: only checklist answers of the form "yes, handled by X" for deploy, rollback and
   concurrency (items b, f, i, j).
4. **Size**: total non-test files, against the naive version when known.

End with the plan file path and: _"Approve the split? Answer the product calls by number."_ The
approval screen is the dry run: nothing goes to the tracker before the user approves it.

If the user changes the split, update the file and show the screen again. When they answer a
product call, write back the read-back of the chosen option and close the entry.

### T9. After approval

1. Set `status: approved` and the date in the run file.
2. Write each product-call answer into the ticket text, using the edit command in the
   issue-tracker doc, and mark it answered in the questions file.
3. Create the subtasks, what and why only, with their "Blocked by" links. Read only the file for
   this repo's tracker:
   - **Jira** → [create-jira.md](./create-jira.md)
   - **GitHub Issues** → [create-github.md](./create-github.md)
   - **Local Markdown** → [create-local.md](./create-local.md)

   If a creation fails, stop and report which one, without creating more.
4. Write each subtask's key into the run file, next to its title.
5. Report the keys and the next step: `/fleet-command <ticket>` for several subtasks,
   `/implement <first key>` for one at a time.

## Subtask size

### S1. Load

Find the ticket plan's section for this subtask in the parent's run file: its files, seams,
checklist answers and shots. With no ticket plan (a single small change), do T2 to T5 at the
scale of the change instead, in this run, with no subtasks and no approval. Write it to the run
file for the change's own key.

### S2. Check against the code now

Earlier subtasks may have merged since the ticket plan. Re-read the listed files and the touch
points they came from, and note what has moved.

### S3. Write the subtask section

Add `## <KEY> plan` to the run file ([run-format.md](./run-format.md)), with:

- The exact non-test files (the budget)
- Seam commits in order, each a refactor with no behaviour change
- Behaviour commits
- The checklist answers, updated for the current code ("as ticket plan" where nothing changed)
- The behaviours to test, from the acceptance criteria

### S4. Stop only if

- **A product call the ticket plan didn't settle.** Add it to the questions file and ask.
- **The file list goes over budget**: more than 3 non-test files beyond the ticket plan's list for
  this subtask, or
  any file in an area the plan didn't cover (another app, a new package). Say re-plan is needed and
  show the new list. If it changes the split, the user approves it as in T8.
- **The code contradicts the ticket plan** (a seam it assumed doesn't exist, a path it missed that
  changes the split). Say what and propose the change.

Otherwise hand back to `/implement` without asking anything.
