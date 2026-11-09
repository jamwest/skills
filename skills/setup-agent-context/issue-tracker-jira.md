# Issue tracker: Jira

Issues and PRDs for this repo live in Jira Cloud. Use the [`atlassian-cli`](https://github.com/omar16100/atlassian-cli) for every operation — do not use the Atlassian MCP. Requires `atlassian-cli` ≥ 0.12 (`brew upgrade atlassian-cli`) and an authenticated profile (`atlassian-cli auth status`).

Keep output small: pass `--format json` and pipe through `jq` to pull only the fields you need. Use `--fields` on `get`/`search` to limit what Jira returns.

## Site values

Recorded when this file was written — update them if they change.

- **Project key**: `<PROJECT_KEY>`
- **Board ID**: `<BOARD_ID>` — find with `atlassian-cli jira api /rest/agile/1.0/board --query projectKeyOrId=<PROJECT_KEY> --format json | jq '.values[] | {id, name}'`
- **Story points field**: `<STORY_POINTS_FIELD>` (e.g. `customfield_10016`) — find with `atlassian-cli jira fields list --format json | jq '.[] | select(.name | test("story point"; "i")) | {id, name}'`

## Conventions

- **Create an issue**: `atlassian-cli jira issue create --project <PROJECT_KEY> --issue-type Story --summary "..." --description "..."`. The description takes markdown (converted to ADF).
- **Create a subtask**: `atlassian-cli jira issue create --project <PROJECT_KEY> --issue-type Sub-task --summary "..." --description "..." --field 'parent={"key":"PROJ-123"}'`. The subtask issue type name varies by project (`Sub-task`, `Subtask`) — check `atlassian-cli jira api /rest/api/3/issue/createmeta/<PROJECT_KEY>/issuetypes` if creation fails.
- **Read an issue**: `atlassian-cli jira issue get PROJ-123 --fields summary,status,description,assignee --format json`. If given a Jira URL, extract the key from the `browse/<KEY>` segment.
- **List issues**: `atlassian-cli jira issue search --jql "project = <PROJECT_KEY> AND sprint in openSprints() ORDER BY created DESC" --fields summary,status --format json`. Mine: `--assignee @me`.
- **Comment on an issue**: `atlassian-cli jira issue comments add PROJ-123 --body "..."`
- **Update fields**: `atlassian-cli jira issue update PROJ-123 --summary "..." --description "..." --priority High`. Any other field: `--field KEY=JSON_VALUE` (repeatable), e.g. `--field 'labels=["backend"]'`.
- **Assign to me**: `atlassian-cli jira issue assign PROJ-123 --assignee "$(atlassian-cli jira api /rest/api/3/myself --format json | jq -r .accountId)"`. `--assignee` wants an account ID. Unassign: `atlassian-cli jira issue unassign PROJ-123`.
- **Set story points**: `atlassian-cli jira issue update PROJ-123 --field <STORY_POINTS_FIELD>=3`
- **Move into the active sprint**: get the sprint ID, then update:
  ```
  SPRINT=$(atlassian-cli jira api /rest/agile/1.0/board/<BOARD_ID>/sprint --query state=active --format json | jq -r '.values[0].id')
  atlassian-cli jira issue update PROJ-123 --sprint "$SPRINT"
  ```
  Use `state=future` for the next sprint. Back to backlog: `atlassian-cli jira api /rest/agile/1.0/backlog/issue -X POST -d '{"issues":["PROJ-123"]}'`.
- **Change status**: `atlassian-cli jira issue transition PROJ-123 --to-status "In Progress"` walks the workflow to the target status. List what's available: `atlassian-cli jira issue transitions PROJ-123`.
- **Close / resolve**: `atlassian-cli jira issue transition PROJ-123 --to-status Done` (or the project's equivalent).
- **Attach a file**: `atlassian-cli jira attachment upload PROJ-123 --file ./screenshot.png` (repeat `--file` for several).
- **Link issues**: `atlassian-cli jira issue links create PROJ-1 PROJ-2 --link-type blocks`. List types: `atlassian-cli jira api /rest/api/3/issueLinkType`.
- **Anything else**: `atlassian-cli jira api <path>` — raw authenticated REST, like `gh api`. Supports `-X`, `-d` (inline JSON, `@file`, `-`), `--query k=v`.

## When a skill says "publish to the issue tracker"

Create a Jira issue with `atlassian-cli jira issue create`. Use `Story` for feature work, `Task` for chores, and `Bug` for defects unless the project has a different convention.

## When a skill says "fetch the relevant ticket"

Run `atlassian-cli jira issue get <KEY> --format json`. If only a number is given (e.g. `123`), prepend the project key from the section above.

## Wayfinding operations

Used by `/wayfinder` for its map and decision tickets.

- **Create the map**: create an Epic (or a Story if the project has no Epic issue type) titled with the destination, with `--field 'labels=["wayfinder-map"]'`.
- **Create a ticket**: `issue create` with `--field 'parent={"key":"<map-key>"}'` and `--field 'labels=["wayfinder-<type>"]'` (`wayfinder-grilling`, `wayfinder-prototype`, `wayfinder-research`, `wayfinder-task`).
- **Blocking**: `atlassian-cli jira issue links create <blocker> <blocked> --link-type blocks` — Jira's native issue links render this in the UI. Check the link direction with `issue links list` after the first one.
- **Claim a ticket**: assign to me (see above).
- **Frontier query**: `issue search --jql 'parent = <map-key> AND status = "To Do" AND assignee is EMPTY'`, then filter out any still linked as "is blocked by" an open issue (`issue links list <KEY>`).
- **Close with resolution**: `issue comments add` with the resolution, then `issue transition --to-status Done`.
