# Code host: Bitbucket

This repository lives on Bitbucket Cloud at `<WORKSPACE>/<REPO>`. This file holds the facts every
developer shares. The commands for reaching Bitbucket live on each developer's machine — see
below.

## How your machine talks to Bitbucket

Each developer reaches Bitbucket their own way (`atlassian-cli bb`, the Atlassian MCP, the web UI).
The commands for this machine live in `.claude/agent-context/code-host.local.md`, which is gitignored.
Read it before you call anything. If it's missing, ask the developer how they reach Bitbucket, and
offer to write it with `/setup-agent-context`.

## When a skill says "open a pull request"

Open a PR with the default reviewers added. PRs created through the API get none otherwise, which
can leave them unmergeable. Mention the related Jira issue key in the title or description if one
exists (Bitbucket auto-links Jira keys).

## When a skill says "get the PR for this branch"

Look up the open PR whose source branch is the current branch.

## Images in PR descriptions

Bitbucket Cloud has no public API for uploading images into a PR description. Leave a placeholder
in the description for each image and tell the user to drag the file onto the PR in the browser —
Bitbucket hosts it and inserts the markdown.
