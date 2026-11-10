# Bitbucket on this machine: atlassian-cli

Local to this machine — this file is gitignored. The shared facts (repo, PR rules) are in
`docs/agents/code-host.md`.

Use the [`atlassian-cli`](https://github.com/omar16100/atlassian-cli) `bitbucket` command (alias `bb`) for all host-level operations. Requires `atlassian-cli` ≥ 0.12 (`brew upgrade atlassian-cli`) and an authenticated profile (`atlassian-cli auth status`).

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

## PR for this branch

```
atlassian-cli bb api /2.0/repositories/<workspace>/<repo>/pullrequests \
  --query 'q=source.branch.name="<branch>" AND state="OPEN"' --format json | jq '.values[0] | {id, title}'
```

## Quirks on this machine

Record workarounds here as you find them, so the next run doesn't rediscover them.
