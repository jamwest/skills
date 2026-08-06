# Issue tracker: Local Markdown

Issues and PRDs for this repo live as markdown files in `.claude/scratch/`. This is skillset
working state, not project documentation — it stays out of version control.

## Conventions

- One feature per directory: `.claude/scratch/<feature-slug>/`
- The PRD is `.claude/scratch/<feature-slug>/PRD.md`
- Implementation issues are `.claude/scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`
- State is recorded as a `Status:` line near the top of each issue file (e.g. `todo`, `in-progress`, `done`)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Before the first write, check the repo's `.gitignore` for a `.claude/scratch/` entry — if
it's missing, add it. Then create a new file under `.claude/scratch/<feature-slug>/`
(creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Wayfinding operations

Used by `/wayfinder` for its map and decision tickets.

- **The map**: `.claude/scratch/wayfinder/<slug>/map.md` — body follows the template in
  `skills/wayfinder/map-format.md`.
- **Tickets**: `.claude/scratch/wayfinder/<slug>/tickets/<NN>-<slug>.md`, numbered from `01`. Each
  carries `Type:` (`grilling` / `prototype` / `research` / `task`), `Status: open | claimed |
  closed`, and zero or more `Blocked by: <NN>-<slug>.md` lines near the top.
- **Claim a ticket**: set `Status: claimed`.
- **Blocking / frontier**: the frontier is every ticket with `Status: open` and no unresolved
  `Blocked by` line — a blocker only counts as resolved once its own file is `Status: closed`.
- **Close with resolution**: append a `## Resolution` section to the ticket file, set
  `Status: closed`, then append one line to the map's `## Decisions so far`.
