# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v` — `gh` does this automatically when run inside a clone.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Wayfinding operations

Used by `/wayfinder` for its map and decision tickets.

- **Create the map**: `gh issue create --title "<destination>" --body "..." --label "wayfinder:map"`. Create the label first if it doesn't exist (`gh label create wayfinder:map --color <hex>`), and likewise for `wayfinder:grilling`, `wayfinder:prototype`, `wayfinder:research`, `wayfinder:task`.
- **Create a ticket**: `gh issue create --title "..." --body "..." --label "wayfinder:<type>"`. Link it as a child of the map with `gh sub-issue add --parent <map-number> --child <ticket-number>` if the `gh-sub-issue` extension is installed (same `GH_SUBISSUE_AVAILABLE` check `break-it-down` uses) — otherwise add a `Part of #<map-number>` line in the body instead.
- **Blocking**: there's no native `gh` CLI primitive for issue-to-issue blocking as of this writing. Record it as a `Blocked by: #<N>` line in the ticket body; compute the frontier by reading each open, unassigned child issue's body for unresolved `Blocked by` lines.
- **Claim a ticket**: `gh issue edit <number> --add-assignee @me`.
- **Frontier query**: list the map's open, unassigned child issues (`gh sub-issue list --parent <map-number>` if the extension is installed, otherwise search issue bodies for `Part of #<map-number>`), then filter out any with an unresolved `Blocked by` line.
- **Close with resolution**: `gh issue comment <number> --body "<resolution>"`, then `gh issue close <number>`.
