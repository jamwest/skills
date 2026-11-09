---
name: break-it-down
description: Decompose a blueprint document into actionable subtasks in the configured issue tracker (Jira subtasks, GitHub Issues, or local markdown files). Use after /blueprint to create the actual work items. Triggers on "break this down", "create issues from this blueprint", "decompose this", or "make tasks from this". Reads docs/agents/issue-tracker.md — never asks which tracker to use if the repo has been initialised.
subagent-role: worker
argument-hint: "path to blueprint file (optional — auto-detects most recent in .claude/blueprints/ if absent)"
---

# Break It Down

Read a blueprint document and decompose it into actionable subtasks in the configured issue tracker.
This is the third step in the pipeline: `grill → blueprint → break-it-down → implement`. Each subtask
must be sized for a single `implement` invocation — one coherent change, one surface, completable in
a focused session.

Output differs by tracker:
- **Jira** — a Story (created if `issue:` is `~`, or linked from existing key) + Jira subtasks beneath it
- **GitHub Issues** — a tracking issue with a task list + one child issue per subtask
- **Local Markdown** — a folder at `.claude/scratch/<blueprint-slug>/issues/` with one markdown file per subtask

Never create anything in the issue tracker without first showing a dry-run summary and receiving
explicit confirmation.

## Process

### 1. Read repo context

Check whether `docs/agents/issue-tracker.md` exists at the repo root. If so, read it and extract:
- **Tracker type**: `jira`, `github`, or `local`
- **Jira**: project key (e.g. `PROJ`), `atlassian-cli` availability
- **GitHub**: repo slug (e.g. `owner/repo`), `gh` CLI availability
- **Local**: base path under `.claude/scratch/`

When tracker is **GitHub**, also check whether the `gh-sub-issue` extension is installed:

```bash
gh extension list | grep -q 'yahsan2/gh-sub-issue'
```

Record the result as `GH_SUBISSUE_AVAILABLE` (true/false). If false, note it — you'll surface
a disclaimer in the dry-run and fall back to plain linked issues at creation time.

If `docs/agents/issue-tracker.md` doesn't exist, stop:

> _"This repo hasn't been initialised. Run `/setup-agent-context` first so I know which issue
> tracker to use."_

Do not guess the tracker type. Do not ask the user which tracker to use. Do not proceed.

### 2. Resolve the blueprint file

Check whether an argument was passed:

- **Path argument** (starts with `/` or `./`, or ends in `.md`) — read that file as the blueprint
- **No argument** — scan `.claude/blueprints/` and select the file with the most recent `date:`
  frontmatter value. If two or more files share the same date, list them and ask the user to pick.
  If `.claude/blueprints/` is empty or absent, stop:

> _"No blueprint found in .claude/blueprints/. Run `/blueprint` first, or pass a path:
> `/break-it-down .claude/blueprints/my-feature.md`."_

Validate the file against [../blueprint/blueprint-format.md](../blueprint/blueprint-format.md).
A valid blueprint must have: `title` and `date` frontmatter, a **Problem Statement**, a **Solution**,
and a **Work Items** section. If any required section is missing, stop and name the missing section.

### 3. Decompose into subtasks

Read the **Work Items** section. Each bullet is the seed for one or more subtasks.

For each work item produce a subtask with:
- **Title** — short, action-oriented: verb + object (e.g. "Add `/payments/retry` endpoint")
- **Description** — what the implementer does, what done looks like, and any constraints drawn from
  **Design Decisions** and **Out of Scope**

Size each subtask for a single `implement` session:
- Touches one surface (API layer, one frontend component, one infra resource, one data model change)
- Roughly 200–400 lines changed; no cross-service coordination within the same task
- Flag any task you judge too large with ⚠️ and a note explaining why (e.g.
  "⚠️ spans UI and state layer — consider splitting before /implement")

Read the **Open Questions** section. For each unresolved question that blocks a subtask, mark that
subtask 🚫 **Blocked** with the dependency named. Do not include blocked subtasks in the proposed
creation list — hold them for the dry-run report.

### 4. Show dry-run summary

Present the full decomposition before writing anything:

```
Blueprint: Payment Retry Logic (ready)
Tracker:   Jira — PROJ
Parent:    create new Story  (issue: ~ in frontmatter)

Subtasks:
  1. Add /payments/retry endpoint
     POST endpoint, idempotent, logs failed events to dead-letter queue
  2. ⚠️  Retry button + error state handling
     May need splitting — spans UI component and state management layer
  3. Dead-letter queue infra
     SQS queue + DLQ policy; Terraform module

Open Questions (will NOT be created):
  🚫  Which queue service? (would block queue-infra task if unresolved)
```

When tracker is **GitHub** and `GH_SUBISSUE_AVAILABLE` is false, append this block to the dry-run
before the confirmation prompt:

```
⚠️  Sub-issue support not available
    The gh-sub-issue extension is not installed. Child issues will be created as regular
    GitHub issues with a "Part of #<parent>" reference line instead of true sub-issues.

    To enable sub-issue linking, install the extension first:
      gh extension install yahsan2/gh-sub-issue

    Proceed without sub-issues, or install the extension and re-run?
```

Wait for the user's answer. If they want to install first, stop and let them do so. Once they
confirm to proceed (with or without the extension), continue to step 5.

Ask:

> _"Does this look right? You can ask me to split, rename, or drop any task before I create
> anything."_

Wait for explicit confirmation ("yes", "go ahead", "looks good") before proceeding. If the user
requests changes, apply them, re-show the updated list, and ask again.

### 5. Create issues

Create the parent first, then subtasks in order. Follow the conventions in
`docs/agents/issue-tracker.md` for all tool use and CLI commands, plus the creation steps for
the tracker resolved in Step 1 — read only the one that matches:

- **Jira** → [create-jira.md](./create-jira.md)
- **GitHub Issues** → [create-github.md](./create-github.md)
- **Local Markdown** → [create-local.md](./create-local.md)

If any creation fails (API error, missing CLI, permission denied), stop immediately without creating
further items and report:

> _"Failed to create subtask 2 — [error]. Fix the issue and re-run, or create it manually."_

### 6. Update blueprint frontmatter

After all tasks are created successfully:
- Write the parent issue key or path into `issue:` in the blueprint's frontmatter (if it was `~`):
  e.g. `PROJ-123`, `GH-42`, or `.claude/scratch/payment-retry-logic/`
- Update `status:` to `in-progress`

### 7. Report

Print a final summary:

```
✓ 3 subtasks created under PROJ-123
  PROJ-124  Add /payments/retry endpoint
  PROJ-125  ⚠️  Retry button + error state handling  ← consider splitting before /implement
  PROJ-126  Dead-letter queue infra

Held (need open questions resolved first): 0
Blueprint updated: .claude/blueprints/payment-retry-logic.md

Next: run /implement PROJ-124 to start work.
```

If any subtasks were held back due to open questions, list them here with the blocking question.
