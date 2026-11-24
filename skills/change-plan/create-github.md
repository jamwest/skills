# Creating subtasks: GitHub Issues

Read this only when the tracker is `github`.

1. The parent is the issue the plan is for. Never create a new tracking issue.
2. Check whether sub-issues are available, using the check in the local file (for `gh`, the
   `gh-sub-issue` extension): `gh extension list | grep -q 'yahsan2/gh-sub-issue'`.
3. Create each subtask from the approved split as its own issue, in split order (seams first), so
   blockers have numbers first. Body = what and why only, then `_Part of #<parent>._`, then one
   `Blocked by #<n>` line per entry in the split's "Depends on" column. No file lists.
4. If sub-issues are available, link each child to the parent:
   `gh sub-issue add --parent <parent> --child <child>`. If not, the `Part of #N` line is the only
   link; say so in the report.
5. Add a task list of the children to the parent issue's body.
6. Print each issue number and title as it is created.
