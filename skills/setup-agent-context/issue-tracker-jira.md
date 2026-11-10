# Issue tracker: Jira

Issues and PRDs for this repo live in Jira Cloud. This file holds the facts every developer
shares. The commands for reaching Jira live on each developer's machine — see below.

## Site values

Recorded when this file was written. Update them if they change.

- **Project key**: `<PROJECT_KEY>`. Every ticket is `<PROJECT_KEY>-<N>`.
- **Board ID**: `<BOARD_ID>`
- **Story points field**: `<STORY_POINTS_FIELD>` (e.g. `customfield_10016`)
- **Issue types**: `Story` for features, `Task` for chores, `Bug` for defects, `<SUBTASK_TYPE>`
  (`Sub-task` or `Subtask`) under a parent ticket.
- **Link types**: `Blocks` for dependencies, `Relates` for anything else.

## How your machine talks to Jira

Each developer reaches Jira their own way (`atlassian-cli`, the Atlassian MCP, the web UI). The
commands for this machine live in `.claude/agent-context/issue-tracker.local.md`, which is gitignored.
Read it before you call anything. If it's missing, ask the developer how they reach Jira, and
offer to write it with `/setup-agent-context`.

## When a skill says "publish to the issue tracker"

Search for an existing or overlapping ticket first. Then create a Jira issue in `<PROJECT_KEY>`,
using the issue types above.

## When a skill says "fetch the relevant ticket"

Fetch it by key. If only a number is given (e.g. `123`), prepend `<PROJECT_KEY>-`. If given a
Jira URL, take the key from the `browse/<KEY>` segment.

## Wayfinding operations

Used by `/wayfinder` for its map and decision tickets.

- **Create the map**: an Epic (or a Story if the project has no Epic type) titled with the
  destination, labelled `wayfinder-map`.
- **Create a ticket**: parent set to the map's key, labelled `wayfinder-<type>`
  (`wayfinder-grilling`, `wayfinder-prototype`, `wayfinder-research`, `wayfinder-task`).
- **Blocking**: a `Blocks` link from the blocker to the blocked ticket. Check the direction after
  the first one.
- **Claim a ticket**: assign it to yourself.
- **Frontier query**: JQL `parent = <map-key> AND status = "To Do" AND assignee is EMPTY`, then
  drop any ticket still blocked by an open issue.
- **Close with resolution**: comment with the resolution, then move the ticket to `Done`.
