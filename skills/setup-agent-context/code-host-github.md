# Code host: GitHub

This repository lives on GitHub (or GitHub Enterprise) at `<OWNER>/<REPO>`. This file holds the
facts every developer shares. The commands for reaching GitHub live on each developer's machine —
see below.

## How your machine talks to GitHub

Each developer reaches GitHub their own way (the `gh` CLI, a GitHub MCP, the web UI).
The commands for this machine live in `.claude/agent-context/code-host.local.md`, which is gitignored.
Read it before you call anything. If it's missing, ask the developer how they reach GitHub, and
offer to write it with `/setup-agent-context`.

## When a skill says "open a pull request"

Open a PR with a descriptive title and body. Link the relevant issue in the body (e.g.
`Closes #42`).

## When a skill says "get the PR for this branch"

Look up the open PR whose head is the current branch.
