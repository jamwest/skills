# Code host: GitHub

This repository lives on GitHub at `github.com/jamwest/skills`. Use the `gh` CLI for all host-level operations.

## Conventions

- **Open a PR**: `gh pr create --title "..." --body "..."`. Use a heredoc for multi-line bodies. Add `--draft` for WIP.
- **View a PR**: `gh pr view <number> --comments`
- **List open PRs**: `gh pr list --state open --json number,title,headRefName,author --jq '[.[] | {number, title, branch: .headRefName, author: .author.login}]'`
- **Checkout a PR branch**: `gh pr checkout <number>`
- **Merge a PR**: `gh pr merge <number> --squash --delete-branch` (or `--merge` / `--rebase`)
- **CI status**: `gh pr checks <number>` or `gh run list --branch <branch>`
- **Repo URL**: `github.com/jamwest/skills` — `gh` resolves this automatically when run inside a clone.

## When a skill says "open a pull request"

Run `gh pr create` with a descriptive title and body. Link the relevant issue number in the body (e.g. `Closes #42`).

## When a skill says "get the PR for this branch"

Run `gh pr view` (no number needed — `gh` infers the current branch's PR).
