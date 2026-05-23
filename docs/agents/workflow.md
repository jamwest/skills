# Workflow conventions

Team standards for branching, committing, and merging. Skills that create branches, write commits, or open pull requests read from here to operate consistently with the team's standards.

## Base branch

`main` — the default target for all pull requests.

## Branch naming

`feat/<slug>` for new features, `fix/<slug>` for bug fixes. Use lowercase kebab-case for the slug. Example: `feat/grill-skill`, `fix/workflow-missing`.

## Commit message format

Conventional Commits: `<type>(<scope>): <description>`

- `type` is one of: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`
- `scope` is optional — use it when the change is scoped to a specific skill or subsystem (e.g. `feat(grill): ...`, `feat(init): ...`)
- `description` is lowercase, imperative mood, no trailing period

## Merge strategy

Squash and merge; delete the branch after merge. The squashed commit title should follow the same Conventional Commits format as above.

## PR title format

Mirrors the commit message format — Conventional Commits `<type>(<scope>): <description>`. GitHub uses the PR title as the squashed commit message, so it must be valid Conventional Commits syntax.
