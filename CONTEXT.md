# Skills

A collection of reusable agent behaviors. Skills are designed to be agent-agnostic — any compatible agent that can read markdown and follow prose instructions should be able to run them. Agent-specific skills may live in separate directories in future.

## Language

**Skill**:
A self-contained agent behavior, packaged as a `SKILL.md` plus optional bundled resources. The unit of reuse in this repo.
_Avoid_: Plugin, extension, command, tool

**SKILL.md**:
The entry point for a skill. Contains YAML frontmatter (`name`, `description`, optional flags) and the runbook body the agent executes.
_Avoid_: Skill file, config file

**Runbook**:
The instructions inside a `SKILL.md` that the agent follows. Not a script — prose that the agent interprets and adapts to context.
_Avoid_: Script, prompt, instructions

**Bundled resource**:
A file co-located with `SKILL.md` that the skill references at runtime (e.g., format specs, templates, reference docs). Read lazily by the agent as needed.
_Avoid_: Asset, attachment, dependency

**Trigger**:
The user intent or phrasing that causes an agent to invoke a skill. Defined in the `description` frontmatter field.
_Avoid_: Activation, match, condition

**Agent-agnostic skill**:
A skill with no dependency on a specific agent's tools, APIs, or capabilities. Should run in any agent that can follow prose instructions.
_Avoid_: Generic skill, portable skill

**Agent-specific skill**:
A skill that relies on capabilities unique to a particular agent (e.g., specific tool calls, slash command syntax, IDE hooks). Intended to live in a dedicated directory for that agent.
_Avoid_: Native skill, host skill

**Freeform mode**:
A skill operating without a repo context (no `CONTEXT.md`, ADRs, or `docs/agents/`). Falls back to first-principles reasoning.
_Avoid_: Default mode, offline mode

**Doc-anchored mode**:
A skill operating against a repo's own documentation (`CONTEXT.md`, `docs/adr/`, `docs/agents/`). The repo's documents are the source of truth.
_Avoid_: Context mode, anchored mode

**Workflow conventions**:
The team-specific rules for branching, committing, merging, and PR titling, captured in `CONTRIBUTING.md` during `init`. Skills that create branches, write commits, or open PRs read from here to operate consistently with the team's standards. Deliberately excludes code style, lint rules, and architectural patterns — see Coding standards. `CONTRIBUTING.md` is the canonical doc for both humans and skills — not a stub pointing elsewhere.
_Avoid_: Git conventions, team standards

**Coding standards**:
The living record of this repo's actual code-level conventions — style, lint rules, architectural patterns, and other in-code standards a change is expected to follow. Captured as its own section in `CONTRIBUTING.md`, seeded from linter/formatter config where it exists, and kept current afterward rather than snapshotted once. Skills that write or review code (`implement`, `review`) read from it; `implement` and `review` are also the ones expected to offer updates to it as new patterns get established.
_Avoid_: Style guide, lint config, workflow conventions
