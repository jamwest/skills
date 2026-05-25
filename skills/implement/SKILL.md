---
name: implement
description: Implement a task from the issue tracker using TDD (red-green-refactor). Use after /break-it-down when starting work on a subtask — accepts an issue key (PROJ-124, GH-42) or a local .scratch path. The final step in the pipeline: grill → blueprint → break-it-down → implement.
subagent-role: worker
argument-hint: "issue key or path (e.g. PROJ-124, GH-42, .scratch/slug/issues/01-task.md)"
---

# Implement

Take a task from the issue tracker and implement it using test-driven development. This is the
final step in the pipeline: `grill → blueprint → break-it-down → implement`.

The only output is working, tested code. Issue management (closing the issue, opening a PR,
updating status) is out of scope — a future `/ship` skill handles that.

## Process

### 1. Read repo context

Check for an `## Agent skills` block in `AGENTS.md` or `CLAUDE.md` at the repo root. If found, read:

- `docs/agents/issue-tracker.md` — needed to fetch the task description
- `docs/agents/domain.md` — confirms whether `CONTEXT.md` is single or multi-context
- `CONTEXT.md` — read for domain vocabulary; use it consistently in all identifiers and test names

If the `## Agent skills` block is absent, continue — domain docs are optional but preferred.

### 2. Resolve the task

Check whether an argument was passed:

- **Issue key** (`PROJ-124`, `GH-42`) — fetch the full task from the configured tracker. Extract
  title, description, and acceptance criteria.
- **Local path** (starts with `.scratch/` or ends in `.md`) — read that file directly. Extract
  title and description.
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

- Identify the public interface(s) to add or change
- List behaviors to test, drawn from acceptance criteria (not from implementation steps)
- Identify [deep module](./deep-modules.md) opportunities — small interface, deep implementation
- Design interfaces for [testability](./interface-design.md) — dependency injection, return
  results over side effects
- Note system boundaries that require mocking — see [mocking.md](./mocking.md)

### 4. TDD loop

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
```

Rules per cycle:

- One test at a time
- Only enough code to pass the current test
- Tests use public interfaces only — no testing of internal collaborators
- Don't anticipate future tests
- If a new test passes without any code change, the behavior was already covered — move on
- Run the full test suite after each GREEN to confirm no regressions

### 5. Refactor

After all acceptance criteria are covered and all tests pass, look for
[refactor candidates](./refactoring.md):

- [ ] Extract duplication
- [ ] Deepen modules — move complexity behind simpler interfaces
- [ ] Apply SOLID principles where natural
- [ ] Consider what new code reveals about existing code

**Never refactor while RED.** Get to GREEN first, always.

Run the full test suite after each refactor step.

## Checklist per cycle

```
[ ] Test describes behavior, not implementation
[ ] Test uses public interface only
[ ] Test would survive an internal refactor
[ ] Code is minimal for this test
[ ] No speculative features added
```
