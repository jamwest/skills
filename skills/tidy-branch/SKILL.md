---
name: tidy-branch
description: Analyze a branch's commit history vs main/equivalent, propose a cleaner logical commit structure (optionally split into PR chains), iterate on the plan conversationally, then execute via non-interactive rebase. Use when the user says "tidy my branch", "clean up my commits", "reorganize my history", "reshape this branch", or "rewrite my commit history".
subagent-role: interactive
argument-hint: "optional hints for grouping strategy (e.g. 'keep migrations separate', 'group by feature area')"
---

# Tidy Branch

Analyze a branch's commits versus the base branch, propose a cleaner logical commit structure — optionally split into multiple PR chains — iterate on the plan conversationally, then execute via non-interactive rebase. Auto-creates a backup branch before touching anything.

## What this skill does NOT do

- Touch the working tree or staging area — only committed history
- Push branches to remote — left to the user
- Open PRs or update the issue tracker

## Process

### 1. Gather context

1. **Detect base branch** — check for `main`, `master`, `develop` in that order via `git branch -a`. If none found, ask the user once.
2. **Read commit range** — `git log <base>..<current-branch> --oneline` to list commits to reshape. If the result is empty (no commits ahead of base), stop and tell the user.
3. **Read workflow conventions** — if `CONTRIBUTING.md` exists, read it for branch naming format and commit message style. If absent, check `git log --oneline -20` to infer whether conventional commits are in use.
4. **Read the full diff** — `git diff <base>..<current-branch> --stat` plus `git show` per commit to understand what changed and why.

If the user passed an argument hint (e.g. "keep migrations separate"), carry it into step 2.

### 2. Analyze and plan

Group the commits into a proposed logical sequence. Look for:

- **Natural clusters** — commits touching the same subsystem or accomplishing one coherent goal
- **PR chain opportunities** — independent units that could merge sequentially (e.g. a refactor that unblocks a feature). Suggest a split only when the units are genuinely independent.
- **Noise** — WIP saves, fixups, "oops" commits — absorb into nearest logical parent

For each proposed commit decide: its message (conventional format if detected, otherwise inferred from content), which original commits it absorbs, and which files it touches.

### 3. Present the plan

Output a numbered list in this format:

```
Proposed commit structure (8 commits → 3):

1. feat(auth): extract token validation into middleware
   absorbs: "wip auth stuff", "move token check", "fix token edge case"
   files: src/middleware/auth.ts, src/middleware/index.ts

2. feat(auth): add refresh token endpoint
   absorbs: "refresh endpoint first pass", "refresh endpoint tests"
   files: src/routes/auth.ts, src/routes/auth.test.ts

3. chore: update auth docs
   absorbs: "update readme"
   files: docs/auth.md
```

If a PR chain is suggested, add a grouping block after:

```
PR chain suggestion:
  PR 1 — feat/auth-middleware: commits 1
  PR 2 — feat/auth-refresh: commits 2–3
```

Branch names come from `CONTRIBUTING.md` if present; otherwise inferred from recent history; otherwise ask the user once for the naming pattern before presenting the plan.

End with: _"Does this look right? You can ask me to move, split, merge, or rename any commit."_

### 4. Iterate

Accept free-text feedback and revise the plan. Re-present the full updated list after each revision. Handle at minimum:

- "Move commit X before Y" — reorder
- "Split commit X into A and B" — ask what goes in each half if unspecified
- "Merge commits X and Y" — combine, propose a new message
- "Rename commit X to ..." — update message
- "Don't split into PRs" / "Make it N PRs" — re-cluster

Continue until the user approves ("looks good", "ship it", "go ahead", "do it").

### 5. Execute

1. **Create backup branch** — `git branch backup/<current-branch-name>`. Announce: _"Created backup at `backup/<name>` — delete it once you're happy."_
2. **Confirm once** — state what will happen in one sentence, e.g. _"About to rebase 8 commits into 3 on `feat/auth-flow`. This rewrites history — the branch will need a force-push when you're ready."_ Then ask: "Proceed?"

On confirmation:

**Single-branch path:**

1. Build the rebase todo (pick / squash / fixup / reword lines) from the approved plan.
2. Write the todo to a temp file and run `git rebase -i <base>` non-interactively by setting `GIT_SEQUENCE_EDITOR="cp /tmp/rebase-todo"` so the pre-written file is used instead of opening an editor.
3. If the rebase hits a conflict: stop, report the conflicting files and which original commits are involved, and show the abort command (`git rebase --abort`).

**PR chain path (if a split was approved):**

1. Rebase the current branch first to produce a clean linear history.
2. For each PR branch in order: create it off `<base>` and cherry-pick the relevant commits from the rebased branch.
3. Announce each branch as it's created.

### 6. Wrap up

After execution output:

- `git log --oneline` for each branch created
- Reminder: _"Branches need a force-push: `git push --force-with-lease`"_
- Name of the backup branch

Do not push. Do not open PRs.
