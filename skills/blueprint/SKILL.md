---
name: blueprint
description: Turn a grill session or freetext brief into a structured design document committed to docs/blueprints/. Use when the user says "write a blueprint", "document this design", or has just finished a grill session and wants to record the outcome as the source of truth for break-it-down.
subagent-role: interactive
argument-hint: "grill session summary or path to handoff file"
---

# Blueprint

Take a grill session output or freetext brief and produce a structured design document — the blueprint. The blueprint is a committed markdown file in `docs/blueprints/` that becomes the source of truth for `break-it-down`, which decomposes it into issues or tasks. Blueprint is the middle step in the pipeline: `grill → blueprint → break-it-down → implement`.

## Process

### 1. Read repo context

Check for an `## Agent skills` block in `AGENTS.md` or `CLAUDE.md` at the repo root. If found, read:

- `docs/agents/issue-tracker.md` — determines what to offer when publishing (GitHub issue or Jira epic/story)
- `docs/agents/domain.md` — confirms whether `CONTEXT.md` is single or multi-context
- `CONTEXT.md` — read for domain vocabulary; use it consistently throughout every blueprint

If the `## Agent skills` block is absent, continue — domain docs are optional.

### 2. Receive input

Check whether an argument was passed:

- **Path to a file** (starts with `/` or `./`, or ends in `.md`) — read that file as the input brief
- **Freetext summary** — treat it directly as the brief
- **No argument** — proceed to step 3

If the argument is a handoff file written by `grill`, extract the summary and resolved decisions from it.

### 3. Brief-gather if input is absent or incomplete

A complete brief must cover: what problem is being solved, who it affects, what the solution is, and what is explicitly out of scope. If any of these are missing, ask for them — one question at a time.

Do not run a full grill session here. Cover only the missing fields. If scope is genuinely unclear, recommend the user run `/grill` first and pass the output back as an argument.

### 4. Detect workstreams

Read the brief and determine whether the work spans multiple independent workstreams — distinct problem domains, separate deployable surfaces, or work that could be tracked under different parent issues with no hard dependency between them.

If multiple workstreams are detected, surface them before drafting:

> _"This spans [N] workstreams: [list them]. I can produce one blueprint covering all, or [N] separate blueprints — one per workstream. Separate blueprints give each its own [GitHub issue / Jira epic/story]. Which do you prefer?"_

Wait for the user's answer before proceeding.

### 5. Draft the blueprint(s)

For each blueprint, produce a markdown file following [blueprint-format.md](./blueprint-format.md).

**Filename**: `docs/blueprints/<slug>.md` where `<slug>` is a lowercase-kebab summary of the feature (e.g. `docs/blueprints/payment-retry-logic.md`). For split workstreams, prefix with the workstream: `docs/blueprints/payments-api.md`, `docs/blueprints/payments-frontend.md`.

**Frontmatter** (always include):

```yaml
---
title: <feature name>
date: <today's date YYYY-MM-DD>
status: draft
issue: ~
---
```

The `issue` field stays `~` until published. Record the tracker key here after publishing (e.g. `GH-42` or `PROJ-123`).

Use domain vocabulary from `CONTEXT.md` consistently. If the brief introduces a new term, offer to add it to `CONTEXT.md` inline — don't batch updates to the end.

### 6. Show and confirm

Present the full draft(s) to the user before writing any files:

> _"Here's the draft blueprint. Does this look right? Any sections to adjust before I write it?"_

Apply feedback, then write all files in one pass. Create `docs/blueprints/` if it doesn't exist.

### 7. Offer to publish

After writing, offer to publish based on the configured issue tracker:

- **GitHub Issues**: _"Publish this as a GitHub issue? I'll record the issue number in the blueprint's frontmatter."_ Create the issue using `docs/agents/issue-tracker.md` conventions, then update `issue:` in the blueprint.
- **Jira**: _"Publish this as a Jira epic/story? I'll record the key in the blueprint's frontmatter."_ Create the epic/story using `docs/agents/issue-tracker.md` conventions, then update `issue:` in the blueprint.
- **No issue tracker configured**: skip this step.
