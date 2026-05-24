# Issue tracker: Jira

Issues and PRDs for this repo live in Jira. Use the Atlassian MCP tools (preferred when available) or the `jira` CLI as a fallback.

## Conventions

- **Jira project key**: recorded below when this file was written — update it if the project key changes.
- **Create an issue**: `mcp__claude_ai_Atlassian__createJiraIssue` with `projectKey`, `issuetype` (`Task`, `Story`, `Bug`), `summary`, and `description`.
- **Read an issue**: `mcp__claude_ai_Atlassian__getJiraIssue` with the full issue key (e.g. `PROJ-123`). If given a Jira URL, extract the key from the `browse/<KEY>` segment.
- **List issues**: `mcp__claude_ai_Atlassian__searchJiraIssuesUsingJql` with a JQL query — e.g. `project = PROJ AND sprint in openSprints() ORDER BY created DESC`.
- **Comment on an issue**: `mcp__claude_ai_Atlassian__addCommentToJiraIssue` with the issue key and comment body.
- **Update fields**: `mcp__claude_ai_Atlassian__editJiraIssue` (summary, description, assignee, labels, priority, etc.).
- **Change status / transition**: `mcp__claude_ai_Atlassian__getTransitionsForJiraIssue` to list available transitions, then `mcp__claude_ai_Atlassian__transitionJiraIssue` to apply one.
- **Close / resolve**: transition the issue to `Done` (or the project's equivalent) via `mcp__claude_ai_Atlassian__transitionJiraIssue`.

If the Atlassian MCP is unavailable, fall back to the `jira` CLI:

```
jira issue create --project PROJ --type Task --summary "..." --body "..."
jira issue list --project PROJ --status "To Do"
jira issue view PROJ-123
jira issue comment add PROJ-123 "..."
jira issue move PROJ-123 "Done"
```

## Project key

`<PROJECT_KEY>` — set this when running `/init`.

## When a skill says "publish to the issue tracker"

Create a Jira issue with `mcp__claude_ai_Atlassian__createJiraIssue`. Use `Story` for feature work, `Task` for chores, and `Bug` for defects unless the project has a different convention.

## When a skill says "fetch the relevant ticket"

Call `mcp__claude_ai_Atlassian__getJiraIssue` with the issue key. If only a number is given (e.g. `123`), prepend the project key from the section above.
