---
name: pr-description
description: Write a concise markdown PR description from the diff between the current branch and a base branch, so a reviewer gets full context in one skim. Detects a linked issue key from the branch name or commits and pulls its title, decides whether the change has a visible UI effect and if so invokes `ui-evidence` to capture the shots the /change-plan plan lists (once, at PR time; on a rework only the screens whose files changed), then offers to open or update the PR via the host CLI — except a draft PR opened for /implement or /fleet-command, which it opens without asking. Use when the user says "write a PR description", "describe this branch", "draft the PR", "what should the PR say", or is about to open a pull request.
subagent-role: worker
model: sonnet
argument-hint: "optional base branch (defaults to the base branch recorded in CONTRIBUTING.md)"
---

# PR Description

A reviewer opens a PR description before the diff. A good one answers *what changed and
why* in a few seconds, so they read the diff already oriented. This skill builds that
from the branch's actual commits and diff — not by asking the user to summarize their
own work, and not by restating the diff line by line.

## Process

### 1. Resolve the branches

- Current branch: `git branch --show-current`.
- Base branch: the argument if one was given; otherwise the base branch recorded in
  `CONTRIBUTING.md`. If that file doesn't exist or has no base branch recorded,
  ask once rather than guessing — and suggest running `setup-agent-context` so future
  runs don't need to ask.
- Confirm there's something to describe: `git diff <base>...HEAD --stat`. If it's empty,
  say so and stop — there's nothing to write a description for.

### 2. Read the change

- `git log <base>..HEAD --oneline` for the commit story.
- `git diff <base>...HEAD` for the full diff. Read it, don't skim filenames — a small
  diff read in full, a large one read file-by-file grouped into the areas it touches.
- Note which files are tests/config versus behavior. Test-only churn rarely earns a line
  in the summary.

### 3. Find a linked issue, opportunistically

- Look for an issue key in the branch name and commit messages, using the key pattern
  recorded in `docs/agents/issue-tracker.md` (e.g. `PROJ-123`).
- If found, fetch its title with the commands in the `.claude/agent-context/issue-tracker.local.md`
  that file points to (`gh issue view`, a Jira MCP tool, etc.).
- If not found, or the lookup fails, continue without one. Never block the draft on this.

### 4. Decide if this needs UI evidence

Apply the same test `ui-evidence` itself uses: **would this change alter what a page
renders, or how it behaves when clicked?** Judge it from the files touched — component,
route, style, or template files say yes; pure backend, type-only, test, or config files
say no.

- If yes: derive a slug for this PR — the issue key found in step 3 if there was one
  (e.g. `GROOV-2452`), otherwise the current branch name with any `/` replaced by `-`.
  **Shot list.** If the run file `~/runs/<repo>/<ticket>.md` (see
  [run-format.md](../change-plan/run-format.md)) lists shots for this subtask, pass that list to
  `ui-evidence`: one shot per line, the screen and state, and the acceptance criterion it proves.
  With no list, `ui-evidence` picks the states itself.

  **Capture once.** Evidence is captured here, at PR time, not during the build. On a rework of a
  branch that already has evidence, retake only the shots whose screens' files changed since the
  last capture, and keep the rest. After each capture, write the commit it was taken at as
  `capturedAt` in the evidence folder's `evidence.json` (build-pdf.mjs ignores the field). On a
  rework, a shot needs retaking when `git diff --stat <capturedAt>` shows a file the screen
  renders: its route, components, styles, copy or the data it shows. When unsure, retake.

  Invoke `ui-evidence` with that slug as its output-directory argument:
  `.claude/pr/<slug>/`. It writes screenshots there, and one annotated PDF to `~/Desktop/PR evidence/<slug>.pdf`, and
  returns a markdown block already shaped for a PR description — use that block as-is
  under an "Evidence" heading. Don't re-caption or re-summarize it.
- If `ui-evidence` can't run (no dev server, services down, a broken local database, a login
  with no test account), **stop and tell the user before the PR is opened**, so they
  can start what's missing. Don't open it first and note the gap afterwards. One exception: a
  draft PR for `/implement` or `/fleet-command` still opens, with **Evidence blocked** and what is
  missing at the top of the description. A draft notifies no one, and missing evidence blocks
  marking it ready ([pr-lifecycle.md](./pr-lifecycle.md)). This holds
  when another skill or agent called you too: a brief that says to skip evidence doesn't
  override it. Never write "not checked in a browser" under Evidence; the only alternatives to
  shots are omitting the section (no UI change) or the user's own choice to skip, below.
- If `ui-evidence` comes back without screenshots because the user chose to skip them,
  omit the Evidence heading and say in your handover that the description is going out
  unverified in a browser. Don't leave an empty heading, and don't imply shots exist.
- If no: skip the section entirely. Don't write "No UI changes" — omission is the signal,
  and a line saying nothing happened is one more line the reviewer has to skim past.

### 5. Draft the description

Read [description-format.md](./description-format.md) for the section shape, title
format, and the conciseness bar — conciseness is a hard requirement here, not a nice
option.

- **Title**: `<issue-key> | <short imperative summary>` if step 3 found a key, matching
  the PR title format recorded in `CONTRIBUTING.md`. If that file doesn't
  mention a ticket-prefixed format yet, use the pattern anyway and tell the user
  `CONTRIBUTING.md` is missing it — don't silently improvise a different one next time.
  Without an issue key, just the short summary.
- **Body**: a Summary of 2-4 bullets (what and why, never a restated diff), the
  **Left, with reason** list if the caller (`/implement`) passed one, the Evidence block from
  step 4 if one exists, and nothing else — unless something is genuinely risky (migration,
  flag flip, breaking change), in which case one Note bullet, no more.

### 6. Present, then offer to push

- **Called by `/implement` or `/fleet-command` for a draft PR**: open it as a draft with no
  reviewers, without asking, per [pr-lifecycle.md](./pr-lifecycle.md), and return the link.
  Updating that draft's description later doesn't need asking either. Marking it ready does.
- **Otherwise**, show the full draft as the deliverable, then:
- Ask whether the user wants it opened or applied via the host CLI, using the "open a
  pull request" convention in `docs/agents/code-host.md` and the commands in
  `.claude/agent-context/code-host.local.md` (e.g. `atlassian-cli bb pr create <repo> ... --description
  "..."`, `gh pr edit --body "..."`). Run that command only
  after they say yes *for this run* — a prior yes doesn't carry forward.
- If they decline or don't say, leave the draft as text. They paste it into the PR
  description themselves.
- Either way, the evidence PDF has to be attached to the PR in the web UI by hand — the
  CLI can't attach it, and Bitbucket shows only images inline. It is in
  `~/Desktop/PR evidence/<slug>.pdf`; name it and remind the user to attach it.

## Finally

If `CONTRIBUTING.md`, `docs/agents/code-host.md`, or `docs/agents/issue-tracker.md` is
missing a field this skill needed, name the exact field and point at
`setup-agent-context` rather than guessing at it silently every run.
