# GitHub issues on this machine: gh

Local to this machine — this file is gitignored. The shared facts (repo, labels, wayfinding) are
in `docs/agents/issue-tracker.md`.

Use the `gh` CLI for every operation. It infers the repo from `git remote -v` when run inside a
clone.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --json number,title,body,labels,comments`.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Create a label**: `gh label create <name> --color <hex>`
- **Assign to me**: `gh issue edit <number> --add-assignee @me`
- **Close**: `gh issue close <number> --comment "..."`

## Sub-issues

Sub-issues need the `gh-sub-issue` extension. Check with
`gh extension list | grep -q 'yahsan2/gh-sub-issue'`.

- **Add**: `gh sub-issue add --parent <parent-number> --child <child-number>`
- **List**: `gh sub-issue list --parent <parent-number>`

Without it, search issue bodies for `Part of #<parent-number>` instead.

## Quirks on this machine

Record workarounds here as you find them, so the next run doesn't rediscover them.
