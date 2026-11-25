---
name: review
description: Review the diff between HEAD and a fixed point (commit, branch, tag, or merge-base) along three axes — Standards (does the code follow this repo's documented coding standards?), Spec (does the code match what the originating issue asked for?), and Behaviour (is it correct on the paths the spec doesn't list — sibling branches, concurrent repeats, partial failure, the error the user sees, who can reach each write, pages open across a deploy, rollback, audit, every caller and screen?). When a /change-plan plan exists, checks the code against the plan's checklist answers and file list, and records the findings in the plan's run file. Runs each axis as a parallel sub-agent so none sees another's reasoning, then reports them side by side without merging or reranking. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to "review since X".
subagent-role: reviewer
model: opus
argument-hint: "fixed point to diff against (commit, branch, tag, or merge-base), and optionally a spec path"
---

# Review

Three-axis review of the diff between `HEAD` and a fixed point the user supplies:

- **Standards** — does the code conform to this repo's documented coding standards?
- **Spec** — does the code faithfully implement the originating issue?
- **Behaviour** — is the code correct on the paths the spec doesn't list? The items live in [change-checklist.md](./change-checklist.md), the same list `/change-plan` answers before code exists: sibling branches, the same request twice at once, failure part-way through, what the user sees when it fails, who can reach each write, pages left open across a deploy, rollback, audit, and every caller and screen.

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
3. If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent is skipped and the report says so — never infer requirements from the code.

Then look for the **plan**: the run file `/change-plan` wrote, at `~/runs/<repo>/<ticket>.md` (see [run-format.md](../change-plan/run-format.md) for `<repo>` and `<ticket>`), where `<ticket>` is the issue's parent, or the issue itself when it has none. Take this subtask's `## <KEY> plan` section, or its entry in the ticket plan if there's no subtask section. No run file means no plan checks: say so in the report and carry on.

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

Send a single message with three `Agent` tool calls (two if the Spec sub-agent is skipped), `subagent_type: general-purpose` for each. Set `model` per axis: `sonnet` for Standards and Spec (matching the diff against written rules or a written spec), `opus` for Behaviour (tracing paths nobody wrote down is where the hard reasoning is).

Every prompt must end with: _"Do not invoke `/review` or spawn additional agents — perform this review directly."_ Without this line, a sub-agent can rediscover this skill mid-review and fan out again.

**Standards sub-agent prompt** — include:

- The full diff command and commit list.
- The contents of `CONTRIBUTING.md`'s "Coding standards" section (or a note that none exist), **plus the smell baseline from step 3** pasted in full — the sub-agent has no other access to it.
- The brief: "Report — per file/hunk where relevant — (a) every place the diff violates a documented standard: cite the standard (file + the rule); and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls — documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces. Under 400 words."

**Spec sub-agent prompt** — include:

- The diff command and commit list.
- The path or fetched contents of the spec.
- Any overrides the caller passed (decisions that changed the spec). Report each difference from the spec text anyway, labelled "override, issue needs updating".
- The brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Quote the spec line for each finding. Under 400 words."

**Behaviour sub-agent prompt** — include:

- The diff command and commit list. No spec: this axis judges the code against what it does, not what was asked, and reads surrounding code as needed to trace each path.
- The full contents of [change-checklist.md](./change-checklist.md), pasted in. The sub-agent checks each item's **Review** line.
- The plan's checklist answers for this subtask, if step 2 found a run file: the `## <KEY> plan` section, or the subtask's entry in the ticket plan.
- The brief: "Check the diff against every item in the checklist. Each finding cites file:line and gives a concrete scenario ('two submits from one account: …'). When plan answers are given, label each finding either **breaks a planned answer** (the plan got it right, the code doesn't do it: a bug) or **plan answered wrongly or missed it** (the plan's answer is wrong or the item wasn't answered), naming the item letter. A Behaviour finding is never a judgement call — the scenario is real or it isn't. Never label a finding 'edge case' or 'low risk' to soften it. When a finding means data saved against the wrong user, or access the user should not have, prove it: write a throwaway test that fails on the current code, run it, report the result, then delete it. Do not commit it. Existing tests are not evidence that a path is safe — they may encode the same bug. Under 500 words."

If the spec is missing, skip the Spec sub-agent and note this in the final report. Standards and Behaviour still run.

### 4b. Pull static analysis issues

Do this while the sub-agents run. It catches the rules the CI scanner runs and local lint doesn't.

Skip this step if the repo has no `sonar-project.properties` file, or if `SONAR_TOKEN` is not set. Say in the report that you skipped it.

1. Read `sonar.projectKey` from `sonar-project.properties`.
2. Find the open PR for the current branch using the code host CLI. With no PR, use `&branch=<branch>` instead of `&pullRequest=<id>`.
3. Fetch the PR's open issues. Never print the token:
   `curl -s -u "$SONAR_TOKEN:" "https://sonarcloud.io/api/issues/search?componentKeys=<key>&pullRequest=<id>&resolved=false&ps=100"`
4. List each issue as `severity rule file:line message`. Sonar only scans what was last pushed, so local commits after that push may already have fixed some issues. Say this if the branch is ahead of its remote.

A Sonar issue in code the diff touched is a hard violation. If a rule keeps coming up and local lint has a matching rule, say so. That rule belongs in the repo's lint config.

### 4c. Check the file list

Also while the sub-agents run, and only when step 2 found a plan. List the non-test files the diff changes (tests and fixtures don't count) and compare them with the plan's file list. Each file not on the list is a finding to explain: quote the one-line why the implementer gave (in the run file's `### Actual` section or the caller's report), or say none was given. Also list planned seam commits that aren't in the commit list.

### 5. Aggregate

Present the reports under `## Standards`, `## Spec`, `## Behaviour`, `## Plan` and `## Static analysis` headings, verbatim or lightly cleaned. The Plan section holds step 4c's results, or one line saying there was no plan. If step 4b was skipped, the Static analysis section is one line saying why. Do **not** merge or rerank findings — the axes are deliberately separate (see _Why three axes_). Don't soften a Behaviour finding into an "edge case" while cleaning it up.

End with a one-line summary: total findings per axis, and the worst issue _within each axis_ (if any). Don't pick a single winner across axes — that's the reranking the separation exists to prevent.

### 6. Record the findings

Only when step 2 found a run file. Add a `### Review` section under the subtask's `## <KEY> plan` section ([run-format.md](../change-plan/run-format.md)):

- `kind`: seam or behaviour, from the plan
- Counts, each finding counted once:
  - **bugs**: Spec missing or wrong findings, and Behaviour findings labelled "breaks a planned answer"
  - **wrong plan answers**: Behaviour findings labelled "plan answered wrongly or missed it"
  - **standards**: Standards and Static analysis findings
- Each finding in one line, with what it should feed: the checklist (which item), a coding standard, or an automated check

Then add this round's counts to the totals in the run file's frontmatter, unless the caller says the review is part of a fleet: then `/fleet-command` sums them (see run-format.md's parallel writers rule). A second round on the same subtask adds `### Review (round 2)` below the first; never overwrite a round.

## Why three axes

A change can pass one axis and fail another:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**
- Code that does what the issue asked, the way the repo likes, but leaves an orphan row when two submits overlap, skips a step on one of three paths, tells the user the wrong thing failed, or saves a stale tab's answers against the patient another tab signed in as → **Standards and Spec pass, Behaviour fail.** Specs list the happy paths; Spec review checks against that list, so bugs on paths the spec never names fall between the other two axes.

Reporting them separately stops one axis from masking another.
