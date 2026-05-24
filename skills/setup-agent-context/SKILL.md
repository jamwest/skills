---
name: setup-agent-context
description: Sets up an `## Agent skills` block in AGENTS.md/CLAUDE.md and `docs/agents/` so skills know this repo's issue tracker (GitHub, Jira, or local markdown), code host (GitHub, Bitbucket, GitLab, etc.), workflow conventions (branch naming, commit format, merge strategy, PR title format), and domain doc layout. Run before first use of `break-it-down`, `blueprint`, `implement`, `deepen`, or `fleet-command` — or if those skills appear to be missing context about the issue tracker, code host, or domain docs.
disable-model-invocation: true
subagent-role: interactive
---

# Setup Agent Docs

Scaffold the per-repo configuration that the engineering skills assume:

- **Issue tracker** — where issues live (local markdown by default; GitHub Issues and Jira are also supported out of the box)
- **Code host** — where the repository lives and how to open PRs/MRs (detected from `git remote`)
- **Workflow conventions** — branch naming, commit message format, merge strategy, and PR title format (detected from config files and git history)
- **Domain docs** — where `CONTEXT.md` and ADRs live, and the consumer rules for reading them

This is a prompt-driven skill, not a deterministic script. Explore, present what you found, confirm with the user, then write.

## Process

### 1. Explore

Look at the current repo to understand its starting state. Read whatever exists; don't assume:

- `git remote -v` and `.git/config` — is this a GitHub repo? Bitbucket repo? GitLab? Which host?
- `AGENTS.md` and `CLAUDE.md` at the repo root — does either exist? Is there already an `## Agent skills` section in either?
- `CONTEXT.md` and `CONTEXT-MAP.md` at the repo root
- `docs/adr/` and any `src/*/docs/adr/` directories
- `docs/agents/` — does this skill's prior output already exist?
- `.scratch/` — sign that a local-markdown issue tracker convention is already in use

### 2. Present findings and ask

Summarise what's present and what's missing. Then walk the user through the four decisions **one at a time** — present a section, get the user's answer, then move to the next. Don't dump them all at once.

Assume the user does not know what these terms mean. Each section starts with a short explainer (what it is, why these skills need it, what changes if they pick differently). Then show the choices and the default.

**Section A — Issue tracker.**

> Explainer: The "issue tracker" is where issues live for this repo. Skills like `fleet-command`, `blueprint`, and `break-it-down` read from and write to it — they need to know whether to call `gh issue create`, use Jira via the Atlassian MCP, write a markdown file under `.scratch/`, or follow some other workflow you describe. Pick the place you actually track work for this repo.

Default posture: local markdown unless the user says otherwise. If a `git remote` points at GitHub and the user seems to be tracking work there, surface GitHub Issues as a suggestion. If a Jira domain is discoverable (from environment variables, a `.jira` config file, or the user mentions it), surface Jira as a suggestion. Always confirm before writing.

- **Local markdown** (default) — issues live as files under `.scratch/<feature>/` in this repo (good for solo projects or repos without a remote)
- **GitHub** — issues live in the repo's GitHub Issues (uses the `gh` CLI)
- **Jira** — issues live in a Jira project (uses the Atlassian MCP or the `jira` CLI)
- **Other** (Linear, Bitbucket Issues, etc.) — ask the user to describe the workflow in one paragraph; the skill will record it as freeform prose

**Section B — Code host.**

> Explainer: The "code host" is where the repository lives. This is separate from the issue tracker — it affects how skills open pull requests or merge requests, navigate branches, and fetch CI status. Skills like `review` and `fleet-command` need to know this to call the right CLI.

Detect from `git remote -v` and propose the match. If no remote is present or the host is ambiguous, ask.

- **GitHub** — code lives on GitHub or GitHub Enterprise (uses the `gh` CLI)
- **Bitbucket** — code lives on Bitbucket Cloud or Bitbucket Server
- **GitLab** — code lives on GitLab.com or a self-hosted instance (uses the `glab` CLI)
- **No remote / other** — ask the user to describe; the skill will record it as freeform prose

**Section C — Workflow conventions.**

> Explainer: "Workflow conventions" are the team rules for branching, committing, and merging. Skills that create branches, write commits, or open pull requests read `docs/agents/workflow.md` to match your team's standards — so they don't open PRs with the wrong title format or name branches in a way that breaks your CI or review process.

Detect first, then confirm, then fill gaps:

- Scan for `.commitlintrc`, `commitlint.config.js`, `commitlint.config.ts`, `.commitlintrc.json`, `.commitlintrc.yml`, and the `commitlint` key in `package.json` — these reveal the commit message format.
- Check `CONTRIBUTING.md` and `.github/CONTRIBUTING.md` for branch naming rules, PR conventions, or merge strategy guidance.
- Sample `git log --oneline -20` and `git branch -a` to infer patterns already in use (e.g. `feat/`, `fix/`, `username/description`).
- Present what you found as a proposed draft, then ask the user to confirm or correct each field.
- Merge strategy **always requires an explicit answer** — it's a code host setting, not stored in the filesystem. Propose squash-and-delete-branch as the default.

Capture all five fields as freeform prose (not a fixed enum):

- **Base branch** — the default PR target; detect from `git symbolic-ref refs/remotes/origin/HEAD` or assume `main`. Note any other long-lived branches (e.g. `develop`, `release/*`) but don't try to describe the full release flow — that's a fleet concern.
- **Branch naming** — e.g. `feat/<slug>`, `fix/<slug>`, `<username>/<description>`, or no convention
- **Commit message format** — e.g. Conventional Commits `<type>(<scope>): <description>`, gitmoji, or freeform
- **Merge strategy** — squash / rebase / merge commit; note whether to delete the branch after merge
- **PR title format** — e.g. mirrors commit message format, `PROJ-1234 | <description>`, or freeform

**Section D — Domain docs.**

> Explainer: Some skills (`deepen`, `implement`) read a `CONTEXT.md` file to learn the project's domain language, and `docs/adr/` for past architectural decisions. They need to know whether the repo has one global context or multiple (e.g. a monorepo with separate frontend/backend contexts) so they look in the right place.

Confirm the layout:

- **Single-context** — one `CONTEXT.md` + `docs/adr/` at the repo root. Most repos are this.
- **Multi-context** — `CONTEXT-MAP.md` at the root pointing to per-context `CONTEXT.md` files (typically a monorepo).

### 3. Confirm and edit

Show the user a draft of:

- The `## Agent skills` block to add to whichever of `CLAUDE.md` / `AGENTS.md` is being edited (see step 4 for selection rules)
- The contents of `docs/agents/issue-tracker.md`, `docs/agents/code-host.md`, `docs/agents/workflow.md`, and `docs/agents/domain.md`

Let them edit before writing.

### 4. Write

**Pick the file to edit:**

- If `CLAUDE.md` exists, edit it.
- Else if `AGENTS.md` exists, edit it.
- If neither exists, ask the user which one to create — don't pick for them.

Never create `AGENTS.md` when `CLAUDE.md` already exists (or vice versa) — always edit the one that's already there.

If an `## Agent skills` block already exists in the chosen file, update its contents in-place rather than appending a duplicate. Don't overwrite user edits to the surrounding sections.

The block:

```markdown
## Agent skills

### Issue tracker

[one-line summary of where issues are tracked]. See `docs/agents/issue-tracker.md`.

### Code host

[one-line summary of code host — e.g. "GitHub" or "Bitbucket"]. See `docs/agents/code-host.md`.

### Workflow conventions

[one-line summary — e.g. "Conventional Commits, feat/* branches, squash merge"]. See `docs/agents/workflow.md`.

### Domain docs

[one-line summary of layout — "single-context" or "multi-context"]. See `docs/agents/domain.md`.
```

Then write the docs files using the seed templates in this skill folder as a starting point:

- [issue-tracker-github.md](./issue-tracker-github.md) — GitHub issue tracker
- [issue-tracker-jira.md](./issue-tracker-jira.md) — Jira issue tracker
- [issue-tracker-local.md](./issue-tracker-local.md) — local-markdown issue tracker
- [code-host-github.md](./code-host-github.md) — GitHub code host
- [code-host-bitbucket.md](./code-host-bitbucket.md) — Bitbucket code host
- [code-host-gitlab.md](./code-host-gitlab.md) — GitLab code host
- [workflow.md](./workflow.md) — workflow conventions (universal; not per-host)
- [domain.md](./domain.md) — domain doc consumer rules + layout

For "other" issue trackers or code hosts, write the relevant `docs/agents/` file from scratch using the user's description.

### 5. Done

Tell the user the setup is complete and which engineering skills will now read from these files. Mention they can edit `docs/agents/*.md` directly later — re-running this skill is only necessary if they want to switch issue trackers, change code host, change workflow conventions, or restart from scratch.
