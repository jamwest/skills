# Contributing

Thanks for contributing. This doc covers how we commit and the coding conventions we follow —
read it before your first commit.

The AI skills in this repo (`commit`, `tidy-branch`, `pr-description`, `implement`,
`fleet-command`, and eventually `review`) follow the same conventions, so this file stays the one
source of truth for both.

## Workflow

### Trunk-based

Commit directly to `main` — no feature branches, no PRs. Split work into small, logical commits
(one skill or one concern per commit) so history reads cleanly without a squash. Run any checks
before you push.

### Commit message format

Conventional Commits: `<type>(<scope>): <description>`

- `type` is one of: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`
- `scope` is optional — use it when the change is scoped to a specific skill or subsystem (e.g. `feat(grill): ...`, `feat(init): ...`)
- `description` is lowercase, imperative mood, no trailing period

No issue numbers in the subject line. When a commit resolves a GitHub issue, put `Closes #42` in
the commit body.

## Coding standards

Not yet established — this repo is mostly markdown and a couple of small scripts, so no
patterns have needed recording yet. `implement` and `review` add entries here as real
conventions emerge (e.g. "capture scripts use stdlib only, no third-party dependencies" — see
`ui-evidence`'s `capture-tab.sh`) rather than front-loading rules nothing has tested yet.
