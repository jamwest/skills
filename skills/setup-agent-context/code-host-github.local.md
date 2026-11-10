# GitHub on this machine: gh

Local to this machine — this file is gitignored. The shared facts (repo, PR rules) are in
`docs/agents/code-host.md`.

Use the `gh` CLI for all host-level operations.

## Conventions

- **Open a PR**: `gh pr create --title "..." --body "..."`. Use a heredoc for multi-line bodies. Add `--draft` for WIP.
- **View a PR**: `gh pr view <number> --comments`
- **List open PRs**: `gh pr list --state open --json number,title,headRefName,author --jq '[.[] | {number, title, branch: .headRefName, author: .author.login}]'`
- **Checkout a PR branch**: `gh pr checkout <number>`
- **Merge a PR**: `gh pr merge <number> --squash --delete-branch` (or `--merge` / `--rebase`)
- **CI status**: `gh pr checks <number>` or `gh run list --branch <branch>`
- **Repo URL**: infer from `git remote get-url origin`; `gh` resolves this automatically when run inside a clone.
- **PR for this branch**: `gh pr view` (no number needed — `gh` infers the current branch's PR).

## Quirks on this machine

Record workarounds here as you find them, so the next run doesn't rediscover them.
