# GitLab on this machine: glab

Local to this machine — this file is gitignored. The shared facts (repo, PR rules) are in
`docs/agents/code-host.md`.

Use the `glab` CLI for all host-level operations.

## Conventions

- **Open an MR**: `glab mr create --title "..." --description "..."`. Add `--draft` for WIP. Use `--assignee <username>` and `--reviewer <username>` as needed.
- **View an MR**: `glab mr view <id> --comments`
- **List open MRs**: `glab mr list --state opened`
- **Checkout an MR branch**: `glab mr checkout <id>`
- **Merge an MR**: `glab mr merge <id>` (add `--squash` or `--rebase` as appropriate; `--remove-source-branch` to clean up)
- **CI status**: `glab ci status` (current branch) or `glab ci list --branch <branch>`
- **View pipeline jobs**: `glab ci view`
- **Repo URL**: infer from `git remote get-url origin`; `glab` resolves this automatically when run inside a clone.
- **MR for this branch**: `glab mr view` (no ID needed — `glab` infers the current branch's MR).

> **Note:** Install `glab` via `brew install glab` (macOS) or see [glab.readthedocs.io](https://glab.readthedocs.io/en/latest/installation.html). Authenticate with `glab auth login`.

## Quirks on this machine

Record workarounds here as you find them, so the next run doesn't rediscover them.
