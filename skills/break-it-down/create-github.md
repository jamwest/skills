# Creating subtasks: GitHub Issues

Read this only when Step 1 resolved the tracker as `github`.

1. Create a tracking issue: title = blueprint title, body = Problem Statement + Solution +
   GitHub-style checkbox task list. Apply a `blueprint` label if it exists in the repo.
2. Create each non-blocked subtask as a separate issue. Body = description + a reference line:
   `_Part of #<tracking-issue-number>._`
3. If `GH_SUBISSUE_AVAILABLE` is true, link each child to the tracking issue as a sub-issue:
   ```bash
   gh sub-issue add --parent <tracking-issue-number> --child <child-issue-number>
   ```
   If `GH_SUBISSUE_AVAILABLE` is false, skip this step — the `Part of #N` reference in each
   issue body is the only link. (The user was already warned in the dry-run.)
4. Print each issue number and title as it is created.
