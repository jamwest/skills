# Creating subtasks: Jira

Read this only when Step 1 resolved the tracker as `jira`.

1. Check `issue:` in the blueprint's frontmatter:
   - `~` → offer to create a Story. Title = blueprint title. Description = Problem Statement +
     Solution. Confirm, create, record the returned key.
   - Already set (e.g. `PROJ-123`) → use that key as the parent; do not create a new story.
2. Create each non-blocked subtask as a Jira subtask under the parent story, using the "Create a
   subtask" command in `.claude/agent-context/issue-tracker.local.md`.
3. For each dependency from step 3, link the two subtasks with Jira's "is blocked by" link type.
   If the local file has no link command, add a `Blocked by: <KEY>` line to the subtask
   description instead.
4. Print each subtask key and title as it is created.
