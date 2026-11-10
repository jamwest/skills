# Code host: GitLab

This repository lives on GitLab (`<GITLAB_HOST>`) at `<GROUP>/<REPO>`. GitLab calls pull requests
**Merge Requests (MRs)**. This file holds the facts every developer shares. The commands for
reaching GitLab live on each developer's machine — see below.

## How your machine talks to GitLab

Each developer reaches GitLab their own way (the `glab` CLI, a GitLab MCP, the web UI).
The commands for this machine live in `.claude/agent-context/code-host.local.md`, which is gitignored.
Read it before you call anything. If it's missing, ask the developer how they reach GitLab, and
offer to write it with `/setup-agent-context`.

## When a skill says "open a pull request"

Open an MR with a descriptive title and description. Link the relevant issue in the description
(e.g. `Closes #42`).

## When a skill says "get the PR for this branch"

Look up the open MR whose source branch is the current branch.
