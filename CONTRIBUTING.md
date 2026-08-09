# Contributing

Thanks for contributing. This doc covers how we branch, commit, and merge, and the coding
conventions we follow — read it before opening your first PR.

The AI skills in this repo (`commit`, `tidy-branch`, `pr-description`, `implement`,
`fleet-command`, and eventually `review`) follow the same conventions, so this file stays the one
source of truth for both.

## Workflow

### Base branch

`main` — the default target for all pull requests.

### Branch naming

`feat/<slug>` for new features, `fix/<slug>` for bug fixes. Use lowercase kebab-case for the slug. Example: `feat/grill-skill`, `fix/workflow-missing`.

### Commit message format

Conventional Commits: `<type>(<scope>): <description>`

- `type` is one of: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`
- `scope` is optional — use it when the change is scoped to a specific skill or subsystem (e.g. `feat(grill): ...`, `feat(init): ...`)
- `description` is lowercase, imperative mood, no trailing period

No issue/ticket numbers in the commit message — this repo tracks work via GitHub Issues,
and the issue number belongs in the PR body (`Closes #42`, see `docs/agents/code-host.md`), not
repeated in every commit.

### Merge strategy

Squash and merge; delete the branch after merge. The squashed commit title should follow the same Conventional Commits format as above.

### PR title format

Mirrors the commit message format — Conventional Commits `<type>(<scope>): <description>`. GitHub uses the PR title as the squashed commit message, so it must be valid Conventional Commits syntax.

## Coding standards

Not yet established — this repo is mostly markdown and a couple of small scripts, so no
patterns have needed recording yet. `implement` and `review` add entries here as real
conventions emerge (e.g. "capture scripts use stdlib only, no third-party dependencies" — see
`ui-evidence`'s `capture-tab.sh`) rather than front-loading rules nothing has tested yet.
