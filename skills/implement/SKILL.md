---
name: implement
description: Implement a task from the issue tracker in three disciplined phases — make it work (red-green TDD), make it right (design pass scoped to the diff), make it fast (only for a stated perf requirement or obvious hotspot) — then run one bounded review-and-fix round before handing off. Use after /break-it-down when starting work on a subtask — accepts an issue key (PROJ-124, GH-42) or a local .claude/scratch path. The final step in the pipeline: grill → blueprint → break-it-down → implement.
subagent-role: worker
argument-hint: "issue key or path (e.g. PROJ-124, GH-42, .claude/scratch/slug/issues/01-task.md)"
---

# Implement

Take a task from the issue tracker and implement it in three phases — **make it work, make it
right, make it fast** ([c2](https://wiki.c2.com/?MakeItWorkMakeItRightMakeItFast)) — with
test-driven development driving the first. This is the final step in the pipeline:
`grill → blueprint → break-it-down → implement`.

The change stays as small as the task. Each phase has a scope rule, and step 7 checks the final
diff against it — improvements outside that scope get reported, not made.

The output is working, tested code plus one bounded review-and-fix round (step 8) — not a loop
until clean. Issue management (closing the issue, opening a PR, updating status) is out of scope
and stays manual — see the end of step 8.

## Process

### 1. Read repo context

Check whether these exist at the repo root, and read whichever are present:

- `docs/agents/issue-tracker.md` — needed to fetch the task description
- Also note the current `git rev-parse HEAD` before making any changes — call it `<start-sha>`.
  Steps 5, 7 and 8 diff against this point.
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

A usable task must have: a clear title, what done looks like, and at least one implied public
interface. If these are present, proceed directly to step 3 without asking.

Only interrupt the user if something critical is genuinely missing:

- Scope is ambiguous — two valid interpretations would lead to different interfaces
- No public interface can be inferred from the description
- The task appears to span multiple surfaces and hasn't been flagged for splitting

If you must ask, ask **one targeted question**, not a checklist. If the task came from
`break-it-down`, it will almost always have enough context to proceed silently.

### 3. Plan (silent)

Before writing any code, build a working plan in context — do not output it as a document:

- Identify the public interface(s) to add or change — the shape callers need, nothing more.
  Internal structure is decided in step 5, once there's working code to shape.
- List behaviors to test, drawn from acceptance criteria (not from implementation steps)
- Note system boundaries that require mocking — see [mocking.md](./mocking.md)
- Note any performance requirement the task states (latency, throughput, size limits) — step 6
  needs it
- Note the files you expect to touch. Step 7 checks the final diff against this list.

The work then runs in three phases, in order — **make it work, make it right, make it fast**.
Never mix them: don't design while RED, and don't optimise before the code is right.

### 4. Make it work

Red → green, one behavior at a time, with a small tidy after each green. Correct and ugly beats
elegant and unproven — design comes in step 5.

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
- TIDY is local: rename, inline, remove duplication *within this cycle's code*. No new
  abstractions, no touching code from earlier cycles or existing files — that's step 5.
- Run the full test suite after each GREEN and each TIDY to confirm no regressions

### 5. Make it right

All acceptance criteria are covered and the suite is green. Now make one design pass over the
whole diff (`git diff <start-sha>`) — see [refactoring.md](./refactoring.md) for candidates and
[deep-modules.md](./deep-modules.md) / [interface-design.md](./interface-design.md) for what
"right" looks like.

What you may change depends on where the code sits:

| Where | What's allowed |
| --- | --- |
| Code this task added or changed | Any refactor that keeps tests green — extract, deepen, rename, move. |
| Elsewhere in files the task already touched | Small, local "leave it better than you found it" tidies: a clearer name, dead code removed, a tiny extract next to your change. Nothing that changes an interface another file depends on. |
| Files the task didn't touch | Nothing, except the second-copy rule below. Record what you noticed for the report. |

**Second copy.** If the diff adds the second copy of something that already exists — a lookup
table, a formatter, a type, a helper — extract one shared version and point both copies at it,
even when the existing copy sits in a file the task didn't otherwise touch. This is allowed only
while the change stays confined: a few files and no change to a public interface. Two copies are
where drift starts (one reads `s`, the other `sec`), and the agent that writes the second copy is
the only one placed to notice it.

**Seam candidates.** If the work exposes an obvious missing seam or a shallow module in existing
code, decide. If it's confined and makes this change clearly simpler, build it now. Otherwise
leave it, and record it in the report as a decision for `/deepen`: where it is, what the seam
would be, roughly which files it'd touch, and why you didn't build it.

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

For each file, confirm it's either one step 3 expected, one the work genuinely needed (a new
test file, a wiring change), a step 5 tidy in an already-touched file, or a step 5 second-copy
extraction. Anything else — a
"while I was here" fix, an unrelated formatting change, a refactor in a file the task didn't
otherwise need — revert it and add it to the report instead. Re-run the full suite after any
revert.

### 8. Review once, fix once

Once the diff-scope check is done and the full suite passes, spawn two fresh Agent-tool
subagents **in parallel** (single message, two tool calls): one runs `/review`'s process, the other
runs `/brittle-tests`'s process, both against the work so far. Independence is the point — don't just
follow either skill's steps inline in this same session, which holds every assumption that shaped
the code.

Brief the `/review` subagent explicitly, since none of this is otherwise discoverable:

- **Fixed point**: `<start-sha>` from step 1. This task hasn't been committed, so tell the
  subagent to diff with `git diff <start-sha>` (working tree included) instead of review's usual
  three-dot `...HEAD` form — there's no merge-base to diff against yet.
- **Spec**: the issue/blueprint content already fetched in step 2. Skip review's own spec-source
  discovery entirely — the spec is already known.

Brief the `/brittle-tests` subagent:

- **Fixed point**: the same `<start-sha>`, with the same two-dot override — tell it to diff with
  `git diff <start-sha>` (working tree included) instead of its usual three-dot form, for the same
  reason: nothing is committed yet.

From the reports that come back:

- **Fix directly**: hard violations of a documented standard, any Spec finding (missing, partial,
  or wrong against what was asked for), and any **High**-confidence brittle-tests finding — an
  unambiguous instance, not a judgement call.
- **Decide**: baseline-smell findings, any Standards finding that isn't a hard violation, and
  any **Medium**/**Low**-confidence brittle-tests finding. For each, choose: fix it now if it's
  cheap and inside step 5's scope, or leave it. Either way, record it in the report as a decision
  (see Report below), not as an open question.

After fixing, re-run the full test suite, then run both reviews **one more time** against the same
fixed point to confirm the fixes landed and didn't introduce a new hard violation or brittle
pattern. Fixes follow step 5's scope rules — a finding that would need changes outside the diff
goes in the report instead. If the second round flags a new hard violation, Spec finding or
**High**-confidence brittle-tests finding, fix it and re-run the suite; don't send it back
unfixed. Stop there — no third review round.

Report decisions, not open questions. Every judgement call made along the way — a spec gap you
filled, a review finding you fixed or left, a seam you built or didn't, a copy choice the spec
didn't cover — goes in the report as:

- **Chose**: what you did
- **Why**: the reason, citing the spec, a standard, or the code
- **Impact**: what it affects beyond the agreed scope — other files, other subtasks, the spec,
  stored data — or "none"

Escalate as a question only what is genuinely the user's call: a choice that contradicts the spec
or blueprint, product or copy direction the spec doesn't cover and that can't be undone cheaply,
or an irreversible or outward-facing action. Even then, say what you'd choose and why.

Report:

- What got fixed, and anything either review still flags (with its citations)
- Decisions, in the Chose / Why / Impact form above
- Make it fast: what was optimised and the measurement, or that it was skipped and why
- Seam candidates left for `/deepen`, with why each wasn't built
- Anything reverted by step 7 as out of scope
- If the run hit real friction — the second review round still flagged findings, step 7 reverted
  files, or a lot of effort went into finding something — one line suggesting `/retro`, naming
  the friction. Don't run it; it's the user's call.

Then note that opening the PR (`/pr-description`), cleaning up history (`/tidy-branch`), and
closing the issue stay the user's call, made one at a time — this skill doesn't chain into any of them on its own.

## Checklist per cycle

```
[ ] Test describes behavior, not implementation
[ ] Test uses public interface only
[ ] Test would survive an internal refactor
[ ] Test creates and cleans up its own data — no hardcoded IDs/rows assumed to pre-exist
[ ] UI/E2E tests use semantic selectors and condition-based waits, not positional locators or fixed sleeps
[ ] Code is minimal for this test
[ ] No speculative features added
[ ] TIDY touched only this cycle's code
```
