---
name: inbox
description: Summarise what's waiting on the user right now — Claude sessions blocked on input, PRs to review or re-review, their own PRs with changes requested or approved, and assigned Jira issues — from the command-center state files. Use when the user says "/inbox", "what's pending", "what needs me", "anything to review?", or when an agent needs to know the user's review queue before suggesting what to do next. Read-only; to actually review a PR use /pr-review.
subagent-role: scout
argument-hint: "optional filter: prs | sessions | jira"
---

# Inbox

Report what needs the user, most blocking first, from the files [command-center](https://github.com/jamwest/command-center) keeps up to date. End with one suggested next command. Never run it, post anything, or focus a window.

## Process

### 1. Read the state

- Inbox: `~/.claude/state/inbox.json` (written by `bin/poll.mjs`).
- Sessions: every `~/.claude/state/sessions/*.json` (written by the command-center Claude Code hook).
- Poll interval: `pollIntervalSec` in `~/.config/command-center/config.json`, default 120.

If neither the inbox nor the sessions directory exists, command-center isn't installed. Say so, point at its README, and stop. Don't fall back to querying Bitbucket or Jira yourself.

### 2. Refresh if stale

If `inbox.updatedAt` is older than the poll interval, run `node ~/Repos/command-center/bin/poll.mjs` and re-read. It exits 0 without writing when another poll holds the lock (the menu bar app polls too), so if it's still stale afterwards report its age rather than retrying.

Report every entry in `inbox.errors`. A failed poll leaves the previous data in place, so the summary is still useful, just old.

### 3. Apply the filter

With an argument, show only that part: `prs` (to review + mine), `sessions`, or `jira`. No argument: everything.

### 4. Summarise, blocking first

**Needs you now**, in this order:
1. Sessions with `state: "waiting"`: `project (worktree) · branch — message`, with `(worktree)` only when `worktree` is set.
2. `toReview` with `action: "re-review"`: new commits since the user last reviewed.
3. `toReview` with `action: "review"`.
4. `mine` with `status.kind: "changes-requested"`, naming `status.by`.

**Ready**: `mine` with `status.kind: "approved"`. Suggest merging.

**Also** (one line): count of sessions with `state: "done"`, count of `mine` still waiting on reviewers, and Jira issues counted by status. List Jira issues individually only when the filter is `jira`.

Finish with the inbox age, then `Next:` and the single most useful command for the top item: `/pr-review <id>` for a review or re-review, or the session's project for a waiting session ("switch to hcp-portal; it's waiting on a Bash permission"). Omit `Next:` when nothing needs the user.

Example:

```
Needs you now
  🟠 groov.hcp-portal (worktree) · GROOV-3321/store-sex-and-gender — Claude needs permission to use Bash
  🔁 #610 Backfill actions (Henry Xu) — new commits since your review
  👀 #692 Pathway import (Jack Xing)
  ✏️ #680 your PR — changes requested by Jack Xing

Ready
  ✅ #681 approved by Jack Xing — merge?

Also: 2 sessions finished · 6 PRs awaiting reviewers · Jira: 4 IN REVIEW, 3 Engineering In Progress, 2 Ready for Dev
Inbox 1m old

Next: /pr-review 610
```

Use the PR `url` and Jira `url` fields as links when the output renders markdown.
