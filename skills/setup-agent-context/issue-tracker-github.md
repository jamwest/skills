# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues in `<OWNER>/<REPO>`. This file holds the facts
every developer shares. The commands for reaching GitHub live on each developer's machine — see
below.

## How your machine talks to GitHub

Each developer reaches GitHub their own way (the `gh` CLI, a GitHub MCP, the web UI). The
commands for this machine live in `.claude/agent-context/issue-tracker.local.md`, which is gitignored.
Read it before you call anything. If it's missing, ask the developer how they reach GitHub, and
offer to write it with `/setup-agent-context`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue in `<OWNER>/<REPO>`.

## When a skill says "fetch the relevant ticket"

Fetch the issue by number, with its labels and comments.

## Wayfinding operations

Used by `/wayfinder` for its map and decision tickets.

- **Create the map**: an issue titled with the destination, labelled `wayfinder:map`. Create the
  labels the first time: `wayfinder:map`, `wayfinder:grilling`, `wayfinder:prototype`,
  `wayfinder:research`, `wayfinder:task`.
- **Create a ticket**: an issue labelled `wayfinder:<type>`, added as a sub-issue of the map. If
  sub-issues aren't available, put a `Part of #<map-number>` line in the body instead.
- **Blocking**: GitHub has no issue-to-issue blocking primitive. Put a `Blocked by: #<N>` line in
  the ticket body.
- **Claim a ticket**: assign it to yourself.
- **Frontier query**: the map's open, unassigned child issues, minus any with an unresolved
  `Blocked by` line.
- **Close with resolution**: comment with the resolution, then close the issue.
