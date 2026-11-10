---
name: review
description: Review the diff between HEAD and a fixed point (commit, branch, tag, or merge-base) along three axes — Standards (does the code follow this repo's documented coding standards?), Spec (does the code match what the originating issue or blueprint asked for?), and Behaviour (is it correct on the paths the spec doesn't list — sibling branches, concurrent repeats, partial failure, the error the user sees?). Runs each axis as a parallel sub-agent so none sees another's reasoning, then reports them side by side without merging or reranking. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to "review since X".
subagent-role: reviewer
argument-hint: "fixed point to diff against (commit, branch, tag, or merge-base), and optionally a spec path"
---

# Review

Three-axis review of the diff between `HEAD` and a fixed point the user supplies:

- **Standards** — does the code conform to this repo's documented coding standards?
- **Spec** — does the code faithfully implement the originating issue or blueprint?
- **Behaviour** — is the code correct on the paths the spec doesn't list: sibling branches, the same request twice at once, failure part-way through, and what the user sees when it fails?

All three axes run as **parallel sub-agents** via the Agent tool so none pollutes another's context, then this skill aggregates their findings.

The issue tracker should already be configured — run `/setup-agent-context` first if `docs/agents/issue-tracker.md` is missing.

## Process

### 1. Pin the fixed point

Whatever the user said is the fixed point — a commit SHA, branch name, tag, `main`, `HEAD~5`, etc. If they didn't specify one, ask for it.

Capture the diff command once: `git diff <fixed-point>...HEAD` (three-dot, so the comparison is against the merge-base). Also note the commit list via `git log <fixed-point>..HEAD --oneline`.

Before going further, confirm the fixed point resolves (`git rev-parse <fixed-point>`) and the diff is non-empty. A bad ref or empty diff should fail here — not inside three parallel sub-agents.

### 2. Identify the spec source

Look for the originating spec, in this order:

1. Issue references in the commit messages or branch name (`#123`, `Closes #45`) — fetch the full issue via the workflow in `docs/agents/issue-tracker.md`, using the commands in the `.claude/agent-context/issue-tracker.local.md` it points to.
2. A path the user passed as an argument.
3. A blueprint file under `.claude/blueprints/` matching the branch name or feature (the output of `/blueprint`, which `/break-it-down` turns into the issue this branch implements).
4. If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent is skipped and the report says so — never infer requirements from the code.

### 3. Identify the standards sources

`CONTRIBUTING.md`'s "Coding standards" section is this repo's canonical source — see `AGENTS.md`'s `## Agent skills` block. If that section says standards aren't established yet, or `CONTRIBUTING.md` doesn't exist, the Standards axis runs on the baseline alone.

On top of whatever the repo documents, the Standards axis always carries the **smell baseline** below — a fixed set of Fowler code smells (_Refactoring_, ch.3) that applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation — and, like any standard here, skip anything tooling already enforces.

Each smell reads _what it is_ → _how to fix_; match it against the diff:

- **Mysterious Name** — a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code** — the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy** — a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps** — the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession** — a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches** — the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery** — one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change** — one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality** — abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- **Message Chains** — long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man** — a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest** — a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

### 4. Spawn the sub-agents in parallel

Send a single message with three `Agent` tool calls (two if the Spec sub-agent is skipped), `subagent_type: general-purpose` for each.

Every prompt must end with: _"Do not invoke `/review` or spawn additional agents — perform this review directly."_ Without this line, a sub-agent can rediscover this skill mid-review and fan out again.

**Standards sub-agent prompt** — include:

- The full diff command and commit list.
- The contents of `CONTRIBUTING.md`'s "Coding standards" section (or a note that none exist), **plus the smell baseline from step 3** pasted in full — the sub-agent has no other access to it.
- The brief: "Report — per file/hunk where relevant — (a) every place the diff violates a documented standard: cite the standard (file + the rule); and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls — documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces. Under 400 words."

**Spec sub-agent prompt** — include:

- The diff command and commit list.
- The path or fetched contents of the spec.
- The brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Quote the spec line for each finding. Under 400 words."

**Behaviour sub-agent prompt** — include:

- The diff command and commit list. No spec: this axis judges the code against what it does, not what was asked, and reads surrounding code as needed to trace each path.
- The brief: "Check the diff for three things.
  (a) **Paths.** For each entry point the diff adds or changes (server function, route handler, exported function), list its outcome branches (e.g. created, linked, restored, refused). Flag any branch that skips a step its sibling branches do — saving an answer, crediting, writing the session, recording an audit.
  (b) **Repeats and partial failure.** For each sequence of writes or external calls, ask: what if the same request runs twice at once? What if it fails between steps? Flag any state left half-written, duplicated or orphaned, and any two writes in separate transactions that must succeed or fail together.
  (c) **Failure the user sees.** For each failure return or caught error, trace it to what the user is shown. Flag a message that blames the wrong thing, a failure swallowed with nothing shown, and a retry that cannot succeed.
  Each finding cites file:line and gives a concrete scenario ('two submits from one account: …'). A Behaviour finding is never a judgement call — the scenario is real or it isn't. Never label a finding 'edge case' or 'low risk' to soften it. Under 400 words."

If the spec is missing, skip the Spec sub-agent and note this in the final report. Standards and Behaviour still run.

### 5. Aggregate

Present the reports under `## Standards`, `## Spec` and `## Behaviour` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings — the axes are deliberately separate (see _Why three axes_). Don't soften a Behaviour finding into an "edge case" while cleaning it up.

End with a one-line summary: total findings per axis, and the worst issue _within each axis_ (if any). Don't pick a single winner across axes — that's the reranking the separation exists to prevent.

## Why three axes

A change can pass one axis and fail another:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**
- Code that does what the issue asked, the way the repo likes, but leaves an orphan row when two submits overlap, skips a step on one of three paths, or tells the user the wrong thing failed → **Standards and Spec pass, Behaviour fail.** Specs list the happy paths; Spec review checks against that list, so bugs on paths the spec never names fall between the other two axes.

Reporting them separately stops one axis from masking another.
