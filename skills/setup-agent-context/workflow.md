This is the `## Workflow` section to write into `CONTRIBUTING.md` — not a standalone file.
If `CONTRIBUTING.md` already has a `## Workflow` section, update it in place instead of
duplicating.

## Workflow

### Base branch

[The default target for pull requests — e.g. `main`, `develop`. If long-lived branches like `release/*` exist, note them here but leave release flow decisions to the implementation.]

### Branch naming

[Describe the pattern, e.g. `feat/<slug>`, `fix/<slug>`, `<username>/<description>`, or note if there is no enforced convention.]

### Commit message format

[Describe the format, e.g. Conventional Commits `<type>(<scope>): <description>` where type is one of `feat`, `fix`, `chore`, `docs`, `refactor`, `test`. Or note if commits are freeform.]

[State whether ticket/issue numbers belong in the commit message. Default posture: they don't — if the branch name or PR already carries the ticket, repeating it in every commit is redundant. Record it here explicitly if this repo wants it done differently, e.g. `PROJ-1234` prefixed on every subject line.]

### Merge strategy

[Squash merge / rebase merge / merge commit. Note whether to delete the branch after merge. E.g. "Squash and merge; delete branch after merge."]

### PR title format

[Describe the expected format, e.g. mirrors the commit message format, or `PROJ-1234 | <description>` for Jira-linked work, or freeform.]
