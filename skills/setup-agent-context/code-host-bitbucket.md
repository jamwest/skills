# Code host: Bitbucket

This repository lives on Bitbucket Cloud. Use the [`atlassian-cli`](https://github.com/omar16100/atlassian-cli) `bitbucket` command (alias `bb`) for all host-level operations. Requires `atlassian-cli` ≥ 0.12 (`brew upgrade atlassian-cli`) and an authenticated profile (`atlassian-cli auth status`).

## Conventions

- **Repo slug and workspace**: PR commands take the repo slug as their first positional argument. Infer it (and the workspace) from `git remote get-url origin` — `bitbucket.org/<workspace>/<repo>`. Pass `--workspace <workspace>` if the profile's default workspace differs.
- **Open a PR**: `atlassian-cli bb pr create <repo> --title "..." --source <branch> --destination <base> --description "..." --default-reviewers`. Always pass `--default-reviewers` — PRs created via the API get none otherwise, which can leave them unmergeable. Extra reviewers: `--reviewers <uuid>,<uuid>`.
- **Update a PR description**: `atlassian-cli bb pr update <repo> <id> --description "..."` (also `--title`).
- **View a PR**: `atlassian-cli bb pr get <repo> <id> --format json`
- **Diff**: `atlassian-cli bb pr diff <repo> <id>`
- **List open PRs**: `atlassian-cli bb pr list <repo> --state OPEN --format json`
- **Comment**: `atlassian-cli bb pr comment <repo> <id> --text "..."`. Inline: add `--path <file> --line <n>`. Read: `atlassian-cli bb pr comments <repo> <id>`.
- **Approve / merge / decline**: `atlassian-cli bb pr approve|merge|decline <repo> <id>`. Merge takes `--strategy merge_commit|squash|fast_forward`.
- **CI status**: `atlassian-cli bb pipeline list <repo> --branch <branch> --format json`, or `--pr <id>`. Details: `atlassian-cli bb pipeline get <repo> <pipeline>`.
- **Anything else**: `atlassian-cli bb api /2.0/...` — raw authenticated REST, like `gh api`.

There is no `pr checkout` — use `git fetch origin <branch> && git switch <branch>`.

## When a skill says "open a pull request"

Run `atlassian-cli bb pr create` as above. Mention the related Jira issue key in the title or description if one exists (Bitbucket auto-links Jira keys).

## When a skill says "get the PR for this branch"

```
atlassian-cli bb api /2.0/repositories/<workspace>/<repo>/pullrequests \
  --query 'q=source.branch.name="<branch>" AND state="OPEN"' --format json | jq '.values[0] | {id, title}'
```

## Images in PR descriptions

Bitbucket Cloud has no public API for uploading images into a PR description, and `atlassian-cli` can't do it. Leave a placeholder in the description for each image and tell the user to drag the file onto the PR in the browser — Bitbucket hosts it and inserts the markdown.
