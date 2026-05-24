# Subagent Roles

Every skill is tagged with a role so `fleet-command` knows how to delegate it and agents know what to expect from it. Use the role that best describes what the skill *does*, not what it *is*.

## Roles

**`orchestrator`**
Decomposes a plan into workstreams and delegates to other agents. Never writes code or edits files directly. Reads input (PRD, issue list, brief) and produces a delegation plan. Example: `fleet-command`.

**`scout`**
Explores the codebase — reads files, maps structure, identifies patterns, surfaces findings. No external network calls. Safe to run on a local LLM without browser access. Example: the exploration phase of `deepen`.

**`researcher`**
Gathers external knowledge — web search, documentation, third-party APIs. May use browser access. Degrades gracefully if no browser is available; pair with a `scout` for the codebase half of any research task.

**`worker`**
Writes code, edits files, runs tests, makes commits. The agent that does the actual implementation work. Should receive a clear, scoped brief from an `orchestrator` before starting. Examples: `implement`, the implementation phase of most skills.

**`reviewer`**
Reads output (code, PRDs, plans) and produces structured feedback. Does not edit files — only comments. Example: `review`.

**`interactive`**
Multi-turn conversation with the user. Doesn't fit neatly into the automated pipeline — intended for sessions where the human is in the loop throughout. Examples: `grill`, `skill-forge`, `blueprint`.

## Picking a role

When a skill spans multiple roles (e.g. explores the codebase _and_ writes files), pick the role that describes its **primary output**:

- Produces structured feedback → `reviewer`
- Writes or edits files → `worker`
- Talks to the user in a loop → `interactive`
- Delegates to other agents → `orchestrator`
- Only reads, never writes → `scout`

If genuinely ambiguous, tag it `interactive` and note the dual nature in the skill's description.

## Local LLM compatibility

Skills tagged `researcher` may degrade if no browser or search tool is available. Skills tagged `scout`, `worker`, `reviewer`, and `interactive` should work fully offline. `orchestrator` skills work offline but produce less useful delegation plans if `researcher` subagents are unavailable — note this in the skill.