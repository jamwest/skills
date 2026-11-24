---
name: implement
description: Implement a task from the issue tracker. First plans the subtask against the code as it is now (/change-plan subtask size), then builds it in three disciplined phases — make it work (red-green TDD, planned seam commits first), make it right (check the plan was followed), make it fast (only for a stated perf requirement or obvious hotspot) — runs one review-and-fix round against the plan, then commits, pushes and opens a draft PR. Use when starting work on a subtask, or on one small change — accepts an issue key (PROJ-124, GH-42) or a local .claude/scratch path. Pipeline: grill → change-plan → implement (or fleet-command) → review.
subagent-role: worker
argument-hint: "issue key or path (e.g. PROJ-124, GH-42, .claude/scratch/slug/issues/01-task.md)"
---

# Implement

Take a task from the issue tracker, plan it against the current code, and implement it in three
phases — **make it work, make it right, make it fast**
([c2](https://wiki.c2.com/?MakeItWorkMakeItRightMakeItFast)) — with test-driven development
driving the first. Pipeline: `grill → change-plan → implement (or fleet-command) → review`.

The change stays as small as the plan. `/change-plan` found the seams and sibling paths before
any code existed. This skill builds what the plan says, notes every file it didn't plan, and stops
to re-plan when the change outgrows the plan.

The output is working, tested code, one review-and-fix round against the plan (step 8), and a
draft PR (step 10).

## Process

### 1. Read repo context

Check whether these exist at the repo root, and read whichever are present:

- `docs/agents/issue-tracker.md` — needed to fetch the task description. Use the commands in the
  `.claude/agent-context/issue-tracker.local.md` it points to
- Also note the current `git rev-parse HEAD` before making any changes — call it `<start-sha>`.
  Steps 5, 7 and 8 diff against this point.
- Once step 2 knows the task: the run file and questions file for its ticket, `~/runs/<repo>/<ticket>.md` and
  `<ticket>.questions.md` (see [run-format.md](../change-plan/run-format.md) for the names). An
  answered question is settled. Before asking the user anything, follow the questions-file rules
  in [questions-format.md](../change-plan/questions-format.md).
- `docs/agents/domain.md` — confirms whether `CONTEXT.md` is single or multi-context
- `CONTEXT.md` — read for domain vocabulary; use it consistently in all identifiers and test names
- `CONTRIBUTING.md` — its "Coding standards" section records this repo's actual style, lint, and
  architectural conventions; write code that matches it rather than inventing your own patterns

If none exist, continue — domain docs are optional but preferred.

### 2. Resolve the task

Check whether an argument was passed:

- **Issue key** (`PROJ-124`, `GH-42`) — fetch the full task from the configured tracker. Extract
  title, description, and acceptance criteria.
- **Local path** (starts with `.claude/scratch/` or ends in `.md`) — read that file directly.
  Extract title and description.
- **Freetext** — treat it directly as the task description.
- **No argument** — ask: _"What are we implementing? Paste a task description or give me an
  issue key."_

**Overrides.** If the brief, the user, or an earlier decision changes what the issue asks for
(a bullet dropped, a value added, a rule reversed), list each change as an override: the issue's
wording, the new decision, and who made it. The issue is now out of date. The Spec review in
step 8 gets the list, and the report names it under **Ticket out of date** so the issue gets
updated before the PR, not after a reviewer finds the gap.

A usable task must have: a clear title, what done looks like, and at least one implied public
interface. If these are present, proceed directly to step 3 without asking.

Only interrupt the user if something critical is genuinely missing:

- Scope is ambiguous — two valid interpretations would lead to different interfaces
- No public interface can be inferred from the description
- The task appears to span multiple surfaces and hasn't been flagged for splitting. Suggest
  `/change-plan <ticket>` at ticket size instead.

If you must ask, ask **one targeted question**, not a checklist, through the questions file. If
the task came from `/change-plan`, it will almost always have enough context to proceed silently.

### 3. Plan the subtask

Run `/change-plan`'s **subtask size** for this task, inline in this session (not a subagent). It
reads the ticket plan's section for this subtask, checks it against the code as it is now, and
writes `## <KEY> plan` to the run file: the exact non-test files (the file budget), the seam
commits in order, the behaviour commits, the checklist answers and the behaviours to test. With no
ticket plan (one small change), it plans the change on its own.

It stops only for a product call the plan didn't settle, a file list over budget, or a
contradiction with the ticket plan. Then this skill stops too and asks, through the questions
file. Otherwise carry on without asking.

Also note, in context:

- The public interface(s) to add or change — the shape callers need, nothing more
- System boundaries that require mocking — see [mocking.md](./mocking.md)
- Any performance requirement the task states (latency, throughput, size limits) — step 6 needs it

The work then runs in three phases, in order — **make it work, make it right, make it fast**.
Never mix them: don't design while RED, and don't optimise before the code is right.

### 4. Make it work

**Seam commits first.** Before any behaviour change, make each seam commit the plan lists, in
order. Each is a refactor with no behaviour change: the existing tests stay green without edits to
what they assert (see [refactoring.md](./refactoring.md)). Run the full suite, then commit it on
its own as a `refactor` commit in `CONTRIBUTING.md`'s format. A latent bug found while making a
seam is fixed only as the plan allows: its own commit, with a regression test that fails before
the fix (see `/change-plan` T3).

Then the behaviour: red → green, one behavior at a time, with a small tidy after each green.
Correct and ugly beats elegant and unproven — design comes in step 5.

Follow strict vertical slicing — **one test → one implementation → repeat**. Never write more
than one failing test at a time.

**Anti-pattern — horizontal slicing (forbidden):**

```
WRONG: RED: test1, test2, test3 → GREEN: impl1, impl2, impl3
RIGHT: RED→GREEN: test1→impl1 → RED→GREEN: test2→impl2 → ...
```

See [tests.md](./tests.md) for examples of good vs bad tests.

**Tracer bullet first:**

Write ONE test that confirms ONE end-to-end behavior — the smallest thing that proves the
path works. Confirm it fails (RED), then write minimal code to pass it (GREEN).

**Increment through the remaining behaviors:**

For each behavior from the acceptance criteria:

```
RED:   Write next test → confirm it fails
GREEN: Write minimal code to pass → confirm it passes
TIDY:  Clean up only the code written this cycle → confirm still green
```

Rules per cycle:

- One test at a time
- Only enough code to pass the current test
- Tests use public interfaces only — no testing of internal collaborators
- Don't anticipate future tests
- If a new test passes without any code change, the behavior was already covered — move on
- RED must fail for the reason the test names. A test that fails because of something else
  (a missing column, an older query that filters differently) proves nothing about the code you
  are about to write. Read the failure message before writing the code
- **Prove each decision after GREEN.** For each decision line this cycle added (a sort order, a
  filter, a branch, an argument passed on, a fallback, a refetch option), delete or invert it and
  run the tests. At least one must go red. If none does, the test data can't tell the cases apart:
  change it (for example store the rows in the opposite order to the one the code sorts into)
  until one goes red, then restore the line. Code added several lines at once gets this check one
  line at a time
- TIDY is local: rename, inline, remove duplication *within this cycle's code*. No new
  abstractions, no touching code from earlier cycles or existing files — that's step 5.
- Run the full test suite after each GREEN and each TIDY to confirm no regressions

### 5. Make it right

All acceptance criteria are covered and the suite is green. The seams came from the plan, before
the code, so this step is a check, not a redesign. Over the whole diff (`git diff <start-sha>`):

- **Each planned seam done?** Every seam commit the plan lists is in the commit list, with no
  behaviour change in it.
- **Each off-list file noted?** List the non-test files the diff changes (tests and fixtures
  don't count) against the plan's file list. Write one line for each file not on the list: why the
  work needed it. These go in the run file's `### Actual` section and the report.
- **Code this task added is clean?** Any refactor of the task's own code that keeps tests green is
  fine (see [refactoring.md](./refactoring.md), [deep-modules.md](./deep-modules.md),
  [interface-design.md](./interface-design.md)). Code the task didn't add gets nothing beyond a
  small tidy in a file already touched.
- **Second copy?** If the diff adds a second copy of something that already exists (a lookup, a
  formatter, a type), point both at one shared version. That file is off-list: note it.

A seam the plan missed (the change grew because each caller wires the same thing) is not built
here. If it pushes the file list over budget, step 7 stops for a re-plan. If not, name it in the
report as a seam the plan missed: it feeds the next plan.

**Never refactor while RED.** Run the full test suite after each refactor step.

If this pass established or reinforced a real pattern that isn't in `CONTRIBUTING.md`'s Coding
standards section yet — a deliberate architectural choice, not an incidental one — offer to add
it before moving on: _"Want me to record 'X' as a coding standard?"_ Apply this inline, like
`grill` does for `CONTEXT.md`; don't batch it to the end of the task.

### 6. Make it fast

Only optimise when one of these holds:

- **Stated requirement** — step 3 noted a performance requirement from the task.
- **Obvious hotspot in the diff** — a blatant, mechanical problem in code this task wrote: an N+1
  query, a nested loop over unbounded input, repeated I/O inside a loop, loading a whole
  collection to read one item. Not "this could be faster" — something clearly wrong at realistic
  scale.

Otherwise skip this step and say so in the report (_"Make it fast: skipped — no perf requirement,
no hotspot"_).

When it applies:

1. **Measure first.** For a stated requirement, write a test or benchmark that encodes it and
   confirm it fails. For a hotspot, a test that proves the fix (e.g. query count, call count at a
   real boundary) is enough — don't build a benchmark harness for an obvious N+1.
2. Optimise the smallest piece that fixes it, inside the diff only. Same scope rules as step 5.
3. Confirm the measurement passes and the full suite stays green.

Perf concerns outside the diff, or ones you can't measure, go in the report — don't act on them.

### 7. Diff-scope check

Before review, list everything the task changed: `git diff --stat <start-sha>` plus
`git status --short` for new untracked files.

Compare the non-test files with the ticket plan's file list for this subtask (or the subtask plan's
list, when there's no ticket plan):

- **Re-plan** when there are more than 3 non-test files beyond that list, or any off-list file in an
  area the plan didn't cover (another app, a new package). Stop, run `/change-plan` subtask size
  again with what you found, and continue only from the new plan. If the new plan changes the
  split, that's the user's call (`/change-plan` T8).
- **Otherwise** each off-list file needs its one-line why from step 5. A file with no honest why
  — a "while I was here" fix, an unrelated formatting change — gets reverted and named in the
  report. Re-run the full suite after any revert.

Write the run file's `### Actual` section under `## <KEY> plan`
([run-format.md](../change-plan/run-format.md)): planned vs actual non-test files, each off-list
file with its why.

### 8. Review once, against the plan

Once the diff-scope check is done and the full suite passes, spawn two fresh Agent-tool
subagents **in parallel** (single message, two tool calls): one runs `/review`'s process, the other
runs `/brittle-tests`'s process, both against the work so far. Independence is the point — don't just
follow either skill's steps inline in this same session, which holds every assumption that shaped
the code.

Brief the `/review` subagent explicitly, since none of this is otherwise discoverable:

- **Fixed point**: `<start-sha>` from step 1. Seam commits are committed and the behaviour change
  isn't yet, so tell the subagent to diff with
  `git diff <start-sha>` (working tree included) instead of review's usual three-dot `...HEAD`
  form.
- **Spec**: the issue content already fetched in step 2, plus the overrides list from
  step 2. Skip review's own spec-source discovery entirely — the spec is already known. Tell the
  Spec sub-agent to review against the issue text and report every difference, including ones an
  override explains. Those are labelled "override, issue needs updating", not dropped.
- **Plan**: the run file path and the `## <KEY> plan` section, so the Behaviour axis checks the
  code against the plan's checklist answers, step 4c checks the file list, and step 6 records the
  findings in the run file.

Brief the `/brittle-tests` subagent:

- **Fixed point**: the same `<start-sha>`, with the same two-dot override — tell it to diff with
  `git diff <start-sha>` (working tree included) instead of its usual three-dot form, for the same
  reason.

From the reports that come back:

- **Fix directly**: hard violations of a documented standard, any Spec finding (missing, partial,
  or wrong against what was asked for), any Behaviour finding, and any **High**-confidence
  brittle-tests finding — an unambiguous instance, not a judgement call.
- **Decide**: baseline-smell findings, any Standards finding that isn't a hard violation, and
  any **Medium**/**Low**-confidence brittle-tests finding. For each, choose: fix it now if it's
  cheap and inside step 5's scope, or leave it. Either way, record it in the report as a decision
  (see Report below), not as an open question.

**A finding a reviewer reports as wrong is a defect, not a decision.** Before you treat one as a
defect, check it against what is already settled: the issue, its parent ticket, the plan, the
answered questions and the overrides. Behaviour the spec asks for on purpose is not a defect; record it as a decision
citing the line that settles it, and don't send it to the user to decide again.

A real defect inside the task's goal gets fixed, even when the fix needs a file the diff didn't
touch yet: a server check the spec implies, the same rule applied on a sibling path. Step 5's
scope limits tidying, not fixing what the task exists to deliver. A file the fix adds is
off-list: note it, and it counts toward step 7's re-plan limit. A Spec "wrong" or a Behaviour
finding may stay unfixed only when the fix belongs to a different task, or needs a product
decision the spec doesn't answer. Then it goes in the report's **Known defects** section: the reviewer's
text quoted word for word, the concrete scenario, and why it wasn't fixed. Never reword it as a
decision, an "edge case" or "low risk", and never leave it out — whoever reads the report decides
whether the scenario matters, not you.

After fixing, re-run the full test suite. Run both reviews a **second time** only if the first
round found a bug (a Spec missing or wrong finding, or a Behaviour finding) or a wrong plan
answer. Otherwise one round is enough. In the second round, fix any new hard violation, Spec or
Behaviour finding, or **High**-confidence brittle-tests finding and re-run the suite; don't send
it back unfixed. Stop there — no third round. A wrong plan answer also gets corrected in the
`## <KEY> plan` section, marked "(corrected)", so the next subtask plans from the right answer.

**When review may be skipped.** Only for a subtask kind (seam or behaviour) whose last 5 reviewed
subtasks in `~/runs/<repo>/` all had `clean: yes`, with no "Human reviewer miss" since. Count it
from the run files and name the count in the report. A human reviewer's miss puts that kind back
to always reviewed. `/brittle-tests` still runs.

Report decisions, not open questions. Known defects go in their own section. Every other
judgement call goes in the report: a spec gap you filled, a review finding you fixed or left, an
off-list file you kept, a copy choice the spec didn't cover. Write each as:

- **Chose**: what you did
- **Why**: the reason, citing the spec, a standard, or the code
- **Impact**: what it affects beyond the agreed scope — other files, other subtasks, the spec,
  stored data — or "none"

Escalate as a question only what is genuinely the user's call: a choice that contradicts the spec
or the plan, product or copy direction the spec doesn't cover and that can't be undone cheaply,
or an irreversible action. Ask it through the questions file
([questions-format.md](../change-plan/questions-format.md)), with what you'd choose and why.

**When step 8 can't run.** A forked agent, or any agent without the Agent tool, cannot spawn the
review subagents. Don't skip step 8 quietly. Put **Review not run** as the first line of the
report, with the fixed point, so whoever reads it runs `/review` and `/brittle-tests` before the
PR. This applies to rework too: any later change to this task's code (a rework after a user
decision, a fix-up, a refactor pass) ends with step 8 against the commit the change started from,
with the same one-round rule.

### 9. Quick checks in a browser

Evidence for the PR is captured once, at PR time, by `/pr-description` (step 10), following the
plan's shot list. Don't build the evidence PDF here.

While building, you may take quick check shots with `/ui-evidence`'s headless browser to get a
screen right: does the new state render, is the label right. Bugs they show are fixed with a test,
like any other. If a screen the plan's shot list names can't be reached (a login with no test
account, a service that isn't running), say so at the top of the report, with what is missing:
step 10's evidence will hit the same wall.

### 10. Commit, push, open a draft PR

When the suite, lint and typecheck pass and step 8 is done, follow
[pr-lifecycle.md](../pr-description/pr-lifecycle.md) without asking: commit the behaviour change
(seam commits are already in), using `CONTRIBUTING.md`'s format, on the subtask's branch (create
it per `CONTRIBUTING.md` if you're on the base branch), push, and open a **draft** PR with no
reviewers through `/pr-description`. It captures the evidence from the plan's shot list. Tell it
the PR is a draft opened by `/implement`, so it doesn't stop to ask.

When a caller (such as `/fleet-command`) names the branch and the PR base, use those.

Skip this step when `CONTRIBUTING.md` says the repo is trunk-based with no PRs: commit to the base
branch and stop. Don't push without the user's word in that case.

Never mark the PR ready here. When the ready checks in
[pr-lifecycle.md](../pr-description/pr-lifecycle.md) hold, say so and ask once.

Report:

- **Ticket out of date**: each override from step 2, or "none"
- **Plan vs actual**: planned and actual non-test file counts, each off-list file with its why,
  plan answers that were wrong, and any seam the plan missed
- What got fixed, and anything either review still flags (with its citations)
- **Known defects**: every Spec "wrong" or Behaviour finding left unfixed, quoted word for word,
  with the scenario and why it wasn't fixed (see above). Write "none" if there are none
- Decisions, in the Chose / Why / Impact form above
- **Questions**: open entries in the questions file, or "none"
- Make it fast: what was optimised and the measurement, or that it was skipped and why
- Anything reverted by step 7 as out of scope
- **PR**: the draft PR link, and which ready checks still fail

Always end the report with one line offering `/retro`. If the run hit friction — the second
review round still flagged findings, step 7 reverted files or forced a re-plan, a plan answer was
wrong, or a lot of effort went into finding something — name it in that line. Don't run it; it's the
user's call.

## Checklist per cycle

```
[ ] Test describes behavior, not implementation
[ ] Test uses public interface only
[ ] Test would survive an internal refactor
[ ] RED failed for the reason the test names
[ ] Every decision line added this cycle turns a test red when deleted or inverted
[ ] Test creates and cleans up its own data — no hardcoded IDs/rows assumed to pre-exist
[ ] UI/E2E tests use semantic selectors and condition-based waits, not positional locators or fixed sleeps
[ ] Code is minimal for this test
[ ] No speculative features added
[ ] TIDY touched only this cycle's code
```
