# Creating subtasks: Jira

Read this only when the tracker is `jira`.

1. The parent is the ticket the plan is for. Never create a new story.
2. Create each subtask from the approved split as a Jira subtask under the parent, in split order
   (seams first), using the "Create a subtask" command in
   `.claude/agent-context/issue-tracker.local.md`. Title = the split's title. Description = what
   and why only. No file lists: they live in the plan file and the PR.
3. For each dependency in the split's "Depends on" column, link the two subtasks with Jira's "is
   blocked by" link type. If the local file has no link command, add a `Blocked by: <KEY>` line to
   the subtask description instead.
4. Print each subtask key and title as it is created.
