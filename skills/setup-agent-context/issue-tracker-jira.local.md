# Jira on this machine: atlassian-cli

Local to this machine — this file is gitignored. The shared facts (project key, issue types,
wayfinding) are in `docs/agents/issue-tracker.md`; take `<PROJECT_KEY>`, `<BOARD_ID>` and
`<STORY_POINTS_FIELD>` and `<SUBTASK_TYPE>` from there.

Use [`atlassian-cli`](https://github.com/omar16100/atlassian-cli) for every operation. Requires `atlassian-cli` ≥ 0.12 (`brew upgrade atlassian-cli`) and an authenticated profile (`atlassian-cli auth status`).

Keep output small: pass `--format json` and pipe through `jq` to pull only the fields you need. Use `--fields` on `get`/`search` to limit what Jira returns.

## Discovering site values

Used by `/setup-agent-context` to fill `docs/agents/issue-tracker.md`.

- **Board ID**: `atlassian-cli jira api /rest/agile/1.0/board --query projectKeyOrId=<PROJECT_KEY> --format json | jq '.values[] | {id, name}'`
- **Story points field**: `atlassian-cli jira fields list --format json | jq '.[] | select(.name | test("story point"; "i")) | {id, name}'`
- **Subtask type name**: `atlassian-cli jira api /rest/api/3/issue/createmeta/<PROJECT_KEY>/issuetypes`

## Conventions

- **Create an issue**: `atlassian-cli jira issue create --project <PROJECT_KEY> --issue-type Story --summary "..." --description "..."`. The description takes markdown (converted to ADF).
- **Create a subtask**: `atlassian-cli jira issue create --project <PROJECT_KEY> --issue-type <SUBTASK_TYPE> --summary "..." --description "..." --field 'parent={"key":"PROJ-123"}'`.
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

## Wayfinding commands

- **Map / ticket**: `issue create` with `--field 'labels=["wayfinder-<type>"]'`, plus `--field 'parent={"key":"<map-key>"}'` for tickets.
- **Blocking**: `atlassian-cli jira issue links create <blocker> <blocked> --link-type blocks`. Check the direction with `issue links list` after the first one.
- **Frontier query**: `issue search --jql '<JQL from docs/agents/issue-tracker.md>'`, then `issue links list <KEY>` on each to drop blocked ones.
- **Close with resolution**: `issue comments add`, then `issue transition --to-status Done`.

## Quirks on this machine

Record workarounds here as you find them (wrong flag names, PATH issues, IDs you had to look up),
so the next run doesn't rediscover them.
