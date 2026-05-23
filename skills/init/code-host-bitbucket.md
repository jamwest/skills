# Code host: Bitbucket

This repository lives on Bitbucket Cloud or Bitbucket Server. Use the `bb` CLI for all host-level operations.

## Conventions

- **Open a PR**: `bb pr create --title "..." --description "..."`. Add `--reviewers <username>` to request reviewers.
- **View a PR**: `bb pr view <id>`
- **List open PRs**: `bb pr list --state OPEN`
- **Checkout a PR branch**: `bb pr checkout <id>`
- **Merge a PR**: `bb pr merge <id>`
- **CI status**: `bb pipeline list --branch <branch>` or `bb pipeline get <pipeline-id>`
- **Repo slug and workspace**: infer from `git remote get-url origin`; `bb` resolves this automatically when run inside a clone.

> **Note:** `bb` refers to the [`bb-cli`](https://github.com/bb-cli/bb-cli) tool. Install with `npm install -g @afontcu/bb` if not present.

## When a skill says "open a pull request"

Run `bb pr create` with a descriptive title and description. Mention the related Jira issue key in the description if one exists (Bitbucket auto-links Jira keys).

## When a skill says "get the PR for this branch"

Run `bb pr list --state OPEN --source <branch>` to find the PR for the current branch.
