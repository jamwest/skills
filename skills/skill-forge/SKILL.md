---
name: skill-forge
description: Create a new skill for this skills repo. Grills the user to understand what the skill needs to do, checks for overlap with existing skills, then writes a SKILL.md (and dependent files if needed) that follows the repo's conventions — explicit enough for a local LLM, subagent-role aware, and wired to CONTEXT.md and docs/agents/ where relevant. Use when the user says "create a skill", "add a skill", "forge a skill", or describes a repeatable workflow they want to codify.
---

# Skill Forge

Guide the user through designing and writing a new skill. The output is a `SKILL.md` — and optionally a folder of dependent files — that follows the conventions of this repo and is explicit enough to run reliably on a local LLM.

This skill uses `grill` internally. Follow the same one-question-at-a-time discipline: recommend first, then hear the user's answer, then resolve or drill deeper.

## Process

### 1. Explore existing skills

Before asking anything, silently scan the skills repo:

- List every skill folder under `skills/` and read each `SKILL.md` frontmatter (`name`, `description`)
- Check `AGENTS.md` or `CLAUDE.md` for the `## Agent skills` block — confirms this is a skills repo and surfaces any repo-level conventions already recorded

If a skill already exists that substantially overlaps with what the user described, surface it immediately before continuing:

> _"There's already a `review` skill that covers code review. Is this a refinement of that, or something genuinely different?"_

Only proceed if the new skill is distinct or the user wants to replace/extend an existing one.

### 2. Grill the design

Walk through the design one question at a time. Give your recommendation before hearing theirs.

**Branch A — Purpose and trigger**

- What does this skill do in one sentence?
- When should an agent invoke it — what does the user say or what situation arises? This becomes the `description` in frontmatter and must be specific enough that an agent picks it over other skills.
- What does it explicitly _not_ do? (Sharpens the boundary with neighbouring skills.)

**Branch B — Input**

- What does the skill receive? A file path, a PRD, a codebase, free text, nothing?
- Does it take arguments (like `handoff`'s `argument-hint`)? If so, what are they?
- Does it need to read `CONTEXT.md`, `docs/adr/`, or `docs/agents/`? If yes, flag that the skill should check for an `## Agent skills` block first.

**Branch C — Output**

- What does the skill produce? A file, a folder, inline output, side effects (edits to existing files), or a mix?
- Where does output land? Repo root, OS temp dir, a specific path, or determined at runtime?
- If it produces files: are they ephemeral (temp dir) or committed (in the repo)?

**Branch D — Process shape**

- Is this skill interactive (multi-turn conversation with the user) or deterministic (explore → write, no back-and-forth)?
- Does it have distinct phases? (e.g. Explore → Present → Confirm → Write, like `init`)
- Does it delegate to subagents? If yes, which roles — `scout`, `researcher`, `worker`, `reviewer`? (See [subagent-roles.md](./subagent-roles.md))
- Should it set `disable-model-invocation: true`? (Use this for deterministic skills that should run without a model loop — rare.)

**Branch E — Dependencies**

- Does it reference format specs, templates, or seed files? (e.g. `grill` bundles `adr-format.md` and `context-format.md`)
- Does it call other skills by name? List them explicitly so the dependency is visible.
- Will it work on a local LLM without browser access? If it relies on web search or external APIs, flag that `researcher` subagent role is needed and it will degrade on the pi.

**Branch F — Subagent role tag**

Every skill gets a role tag in frontmatter so `fleet-command` knows how to delegate it. Pick the best fit:

- `orchestrator` — decomposes work, delegates to other agents, never writes code directly
- `scout` — explores the codebase, reads files, maps structure, no external calls
- `researcher` — external knowledge, may use web search or browser
- `worker` — writes code, edits files, runs tests
- `reviewer` — reads output and gives structured feedback
- `interactive` — multi-turn conversation with the user, doesn't fit the above

Most skills that talk to the user are `interactive`. Most skills that produce files are `worker`. When in doubt, ask.

### 3. Check for dependent files

Based on the design, determine if the skill needs a folder:

- **Single `SKILL.md`** — self-contained, no templates or format specs needed
- **Folder** — skill references dependent files (seed templates, format specs, config stubs)

If a folder is needed, list the dependent files and confirm with the user before writing any of them.

### 4. Confirm and write

Show the user a draft of:

- The full `SKILL.md` content
- Any dependent files, with their paths relative to the skill folder

Let them edit before writing. Then write all files in one pass.

**Frontmatter conventions:**

```yaml
---
name: skill-name           # short, memorable, verb-friendly (e.g. grill, forge, review)
description: ...           # specific enough for an agent to pick over neighbouring skills
subagent-role: ...         # orchestrator | scout | researcher | worker | reviewer | interactive
argument-hint: "..."       # only if the skill accepts a freetext argument (optional)
disable-model-invocation: true  # only for fully deterministic skills (rare)
---
```

**SKILL.md structure conventions:**

- Lead with a one-paragraph summary of what the skill does and its goal
- Use `## Process` with numbered `### N. Step name` subsections for sequential skills
- Use bold **Branch labels** for interactive decision trees (like this skill)
- Reference dependent files with relative markdown links: `[adr-format.md](./adr-format.md)`
- Be explicit at every decision point — don't rely on the model to infer intent
- Prefer concrete examples over abstract descriptions wherever the behaviour might be ambiguous
- Write imperative instructions: "Read X before Y", not "You might want to read X"

### 5. Register the skill

After writing, remind the user to add the skill to `AGENTS.md` or `CLAUDE.md` if their agent config lists available skills explicitly. Check whether the existing `## Agent skills` block needs updating — if it does, propose the addition and confirm before editing.