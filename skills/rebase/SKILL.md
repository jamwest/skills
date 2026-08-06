---
name: rebase
description: Rebase the current branch onto its base branch, resolving each conflict as it surfaces by tracing both sides back to their primary source (commit message, PR, issue) rather than picking `--ours`/`--theirs` blind. Runs the repo's checks before finishing, never aborts. Use when the user says "rebase this", "rebase onto main", "catch this branch up", or the branch has drifted behind its base and needs the latest changes merged in.
subagent-role: worker
argument-hint: "optional base branch override (defaults to CONTRIBUTING.md's Base branch, or auto-detected)"
---

# Rebase

Bring the current branch up to date with its base by rebasing onto it, resolving conflicts as they surface rather than resolving an already-stuck merge. The resolution discipline — trace each side to its primary source before touching a hunk — is what separates this from letting a conflict get flag-resolved into something that compiles but silently drops someone's change.

## What this skill does NOT do

- Reorder, squash, or reshape commits — that's [tidy-branch](../tidy-branch/SKILL.md). This skill replays existing commits verbatim onto a new base; it doesn't rewrite messages or restructure history beyond what rebasing itself requires.
- Push branches to remote — left to the user, with a force-push reminder at the end.
- Diagnose why merged-but-conflict-free code misbehaves — that's [bug](../bug/SKILL.md). This skill's job ends at a clean, checked tree.

## Process

### 1. Preflight

1. **Detect the base branch** — read `CONTRIBUTING.md`'s "Base branch" section if present; otherwise check `git branch -a` for `main`, `master`, `develop` in that order; otherwise ask once. An argument passed to this skill overrides all of the above.
2. **Refuse a no-op** — if the current branch *is* the base branch, stop and say so.
3. **Fetch the base** — `git fetch origin <base>` so the rebase target is the remote tip, not a stale local copy. Fall back to the local branch if there's no remote.
4. **Check for uncommitted changes** — `git status`. If the tree isn't clean, `git stash push -u` before continuing; remember to pop it back in step 5. If the stash pop later conflicts, stop and hand it back rather than guessing at a resolution for changes that were never committed.
5. **Check for an already-in-progress rebase** (`.git/rebase-merge` or `.git/rebase-apply` exists) — if one is stuck, skip straight to step 3's conflict loop on the commit it's already stopped at, instead of starting a new rebase.
6. **Create a backup branch** — `git branch backup/<current-branch>-pre-rebase`. Announce it: _"Created backup at `backup/<name>-pre-rebase` — delete it once you're happy with the result."_
7. **Confirm once** — state what will happen: _"About to rebase N commits from `<branch>` onto `<base>` (now at `<short-sha>`). This rewrites history — you'll need a force-push after. Proceed?"_

### 2. Start the rebase

`git rebase origin/<base>` (or `<base>` if there's no remote). If it completes with no conflicts, skip to step 4.

### 3. Resolve each conflict

Git stops at the first conflicting commit. For each one, in order:

1. **Orient yourself — and mind the inversion.** During a rebase, `HEAD`/"ours" is the base branch's content (what's already been replayed), and "theirs" is the incoming commit being replayed on top. This is the **opposite** of a merge's ours/theirs, and resolving on autopilot from merge habits picks the wrong side silently. Confirm which is which with `git status` before touching anything.
2. **Find the primary sources for each side.** For the commit being replayed: its own message, and the PR/issue it references (fetch via `docs/agents/issue-tracker.md` / `docs/agents/code-host.md` if one's linked). For the base side: `git log`/`git show` on the conflicting base commits, and whatever they reference. Understand why each change was made before deciding between them.
3. **Resolve each hunk.** Preserve both intents where they're compatible. Where they genuinely aren't, keep the side that matches the *replayed commit's* stated goal — it's the change actively being brought forward — and note the trade-off (you'll fold these notes into the final report). Never invent behaviour neither side has.
4. **Stage and continue.** `git add <resolved files>`, then `git rebase --continue`. Repeat from (1) for the next conflict.
5. **Never `git rebase --abort`.** The rebase is going to happen; if a hunk is genuinely undecidable even after checking primary sources, stop and ask the user rather than guessing or bailing out.

### 4. Run checks

Once every commit has replayed cleanly, discover the repo's own automated checks (typecheck, then tests, then format/lint — check `package.json` scripts, `CONTRIBUTING.md`, or equivalent) and run them. Fix anything the rebase's conflict resolutions broke before moving on.

### 5. Finish

1. If a stash was created in preflight, `git stash pop` it back.
2. Confirm a clean tree and no rebase in progress (`git status`).
3. Report: commits replayed, each conflict's trade-off note (if any), check results, the backup branch name, and a reminder that history was rewritten — push with `git push --force-with-lease`.

Do not push. Do not open a PR.
