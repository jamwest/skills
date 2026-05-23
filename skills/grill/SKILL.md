---
name: grill
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree one at a time. Operates in two modes — freeform (no repo context) or doc-anchored (grills against CONTEXT.md, ADRs, and docs/agents/ when present). Use when the user wants to stress-test a plan, challenge their thinking, poke holes in a design, or says "grill me". Also triggers for "challenge my thinking", "stress-test this", "ask me hard questions about X", or when starting work on a feature and wanting to validate the approach against existing decisions.
subagent-role: interactive
---

# Grill

Interview the user relentlessly about every aspect of their plan or design until you reach a shared understanding. Walk down each branch of the decision tree, resolving dependencies between decisions one at a time.

## Mode detection

Before starting, silently determine the mode:

**Step 1 — Check for an initialised repo.**

Look for an `## Agent skills` block in `AGENTS.md` or `CLAUDE.md` at the repo root. If found, read it. It tells you:

- Where domain docs live (`CONTEXT.md` layout — single or multi-context)
- Where ADRs live (`docs/adr/`)
- Issue tracker and code host (used to ground delivery questions)

This means `init` has already been run. Trust the config; don't re-detect.

**Step 2 — Determine mode.**

- If `CONTEXT.md`, `docs/adr/`, or `docs/agents/` exist (or were found via the `## Agent skills` block) → **doc-anchored mode**
- Otherwise → **freeform mode**

**Step 3 — Validate doc health (doc-anchored mode only).**

Before the first question, silently check each doc against its format spec:

- `CONTEXT.md` — see [context-format.md](./context-format.md). Is it present? Does it have a `## Language` section with at least one term?
- `docs/adr/` — see [adr-format.md](./adr-format.md). Does the directory exist? Are files named correctly (`0001-slug.md`)?

For each doc that is **missing, empty, or malformed**, surface it before the first question:

> _"Before we start — `CONTEXT.md` is missing (or empty / malformed). This means I can't anchor the grilling against your domain language. Want me to create it now?"_

If the user says yes, scaffold a valid starter file using the relevant format spec and confirm before writing. Then continue the grilling session.

**User overrides:**

- `grill --freeform` — ignore repo context even if present
- `grill --docs` — force doc-anchored mode; surface missing docs as a finding

Never announce which mode you're in unprompted. Just behave accordingly.

## Freeform mode

No external source of truth. Grill the user purely on the merits of their plan.

Cover all dimensions:

- **Goals** — what does success look like? How will you know when you're done?
- **Constraints** — time, budget, team size, existing tech, non-negotiables
- **Trade-offs** — what are you deliberately not doing, and why?
- **Dependencies** — what does this rely on that isn't built yet?
- **Risks** — what's most likely to go wrong? What's the worst-case failure?
- **Success criteria** — how do you measure this working in production?
- **Rollback** — if this goes wrong, how do you undo it?
- **Edge cases** — what inputs, states, or users does this not handle well?

## Doc-anchored mode

The repo's own documents are the source of truth. Load them silently before the first question:

1. **Domain language** — read `CONTEXT.md` (or follow `CONTEXT-MAP.md` if present). Any plan that introduces terms not in `CONTEXT.md`, or uses existing terms inconsistently, is a finding.
2. **Settled decisions** — read every ADR in `docs/adr/`. Any plan that contradicts an ADR without acknowledging it is a finding.
3. **Repo config** — read `docs/agents/` files for issue tracker, code host, and domain layout. Use them to ground delivery questions.

In addition to the freeform dimensions above, also grill on:

- **Domain alignment** — does the plan use `CONTEXT.md` vocabulary consistently? If new terms are introduced, do they belong in `CONTEXT.md`?
- **ADR conflicts** — does the plan contradict any ADR? Surface it explicitly: _"This conflicts with ADR-0004 — is that intentional?"_ Don't let it slide.
- **Delivery fit** — does the approach fit the configured issue tracker and code host? (e.g. don't propose a GitHub Actions workflow if the code host is Bitbucket)

### Side effects in doc-anchored mode

Apply these inline as decisions crystallise — don't batch them to the end:

- **New domain term introduced and accepted?** Add it to `CONTEXT.md` following [context-format.md](./context-format.md). Create the file lazily if it doesn't exist.
- **Existing term sharpened or corrected?** Update `CONTEXT.md` in place.
- **Plan contradicts an ADR and the user has a load-bearing reason to deviate?** Offer to update or supersede the ADR: _"Want me to record this as a revision to ADR-0004?"_ Only offer when the reason would matter to a future reader — skip ephemeral reasons like "not worth it right now."
- **Plan reveals a decision worth recording that isn't in any ADR?** Offer a new ADR at the end of the session. Use [adr-format.md](./adr-format.md) — keep it lean, no boilerplate for its own sake.

See [adr-format.md](./adr-format.md) for when to offer an ADR (all three criteria must apply: hard to reverse, surprising without context, result of a real trade-off).

## How to run the interview

- Ask questions **one at a time** — never batch multiple questions.
- For each question, **give your recommended answer first** before hearing theirs. This gives them something concrete to react to and forces you to have a stake in the outcome.
- After the user responds, either resolve that branch (settled) or drill deeper if their answer opens new sub-questions.
- State resolved branches briefly before moving on: _"Resolved: using Jira for issue tracking. Moving on."_
- If a question can be answered by reading a file or exploring the codebase, **do that instead of asking** — present what you found and confirm.
- Don't accept vague answers. Push for specifics: names, numbers, timelines, owners, fallback plans.
- Continue until every significant branch is resolved and you could hand a summary to a third party and have them understand the plan cold.

## Tone

Rigorous but constructive. You're a trusted senior colleague who wants the plan to succeed — not an adversary hunting for gotchas. Be direct, be opinionated, push back when something doesn't add up.
