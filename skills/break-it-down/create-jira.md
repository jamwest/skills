# Creating subtasks: Jira

Read this only when Step 1 resolved the tracker as `jira`.

1. Check `issue:` in the blueprint's frontmatter:
   - `~` → offer to create a Story. Title = blueprint title. Description = Problem Statement +
     Solution. Confirm, create, record the returned key.
   - Already set (e.g. `PROJ-123`) → use that key as the parent; do not create a new story.
2. Create each non-blocked subtask as a Jira subtask under the parent story. Use the Atlassian MCP
   if available; fall back to `jira` CLI.
3. Print each subtask key and title as it is created.
