# Blueprint format

A blueprint is the source of truth for a single feature or workstream. `break-it-down` reads this file to decompose work into issues or tasks. Every section is required unless marked optional.

## Frontmatter

```yaml
---
title: <feature name>
date: <ISO date YYYY-MM-DD>
status: draft | ready | in-progress | done
issue: ~   # populated after publishing (e.g. GH-42, PROJ-123)
---
```

## Problem Statement

The problem being solved, from the user's or operator's perspective. One paragraph. No solution language — describe the pain, not the fix.

## Solution

The high-level approach. One to three paragraphs. Enough for a reader to understand what will be built without reading the work items.

## User Stories

A numbered list of user stories:

> As a `<actor>`, I want `<feature>`, so that `<benefit>`.

Be extensive — cover the happy path, edge cases, error states, and admin/operator flows. `break-it-down` maps these directly to tasks.

## Design Decisions

Key choices made during the grill session or design process. Include:

- Architectural decisions and the reasoning behind them
- Trade-offs explicitly accepted
- Links to relevant ADRs: `[ADR-0004](../adr/0004-slug.md)`

Do not include file paths or code snippets unless a snippet encodes a decision more precisely than prose (e.g. a schema shape or state machine). If including a snippet, note it came from a prototype and trim to the decision-rich parts only.

## Work Items

A rough decomposition into modules, surfaces, or phases. This is the seed `break-it-down` expands into tasks. Use bullet points — no full task descriptions needed here.

Example:
- API: add `/payments/retry` endpoint
- Frontend: retry button component + error state handling
- Infra: dead-letter queue for failed payment events

## Out of Scope

An explicit list of things this blueprint does not cover. Be specific — vague exclusions don't help `break-it-down`.

## Open Questions

Unresolved blockers that must be answered before or during implementation. `break-it-down` will flag these rather than creating tasks that depend on them.

## References

- Grill session: `<path or link>` *(optional)*
- ADRs: `<links>` *(optional)*
- Parent issue: *(populated from `issue` frontmatter after publishing)*
- Related blueprints: `<links to sibling workstream blueprints if split>` *(optional)*
