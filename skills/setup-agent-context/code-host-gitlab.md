# Code host: GitLab

This repository lives on GitLab.com or a self-hosted GitLab instance. Use the `glab` CLI for all host-level operations.

## Conventions

- **Open an MR**: `glab mr create --title "..." --description "..."`. Add `--draft` for WIP. Use `--assignee <username>` and `--reviewer <username>` as needed.
- **View an MR**: `glab mr view <id> --comments`
- **List open MRs**: `glab mr list --state opened`
- **Checkout an MR branch**: `glab mr checkout <id>`
- **Merge an MR**: `glab mr merge <id>` (add `--squash` or `--rebase` as appropriate; `--remove-source-branch` to clean up)
- **CI status**: `glab ci status` (current branch) or `glab ci list --branch <branch>`
- **View pipeline jobs**: `glab ci view`
- **Repo URL**: infer from `git remote get-url origin`; `glab` resolves this automatically when run inside a clone.

> **Note:** Install `glab` via `brew install glab` (macOS) or see [glab.readthedocs.io](https://glab.readthedocs.io/en/latest/installation.html). Authenticate with `glab auth login`.

## When a skill says "open a pull request"

Run `glab mr create` with a descriptive title and description. Link the relevant issue number in the description (e.g. `Closes #42`). GitLab calls these **Merge Requests (MRs)**, not pull requests.

## When a skill says "get the PR for this branch"

Run `glab mr view` (no ID needed — `glab` infers the current branch's MR).
