---
name: deepen
description: Scan a codebase for deepening opportunities — shallow modules, leaky seams, tangled boundaries — rank them, and hand the strongest candidate off to /grill or /wayfinder. Output is concise markdown, not an HTML report — a couple of full-detail "do this now, easy win" entries with a before/after and cost estimate, larger opportunities named but left thin until asked for. Use when the user wants an architecture review, asks "where's the tech debt", "what should we refactor", or has a spare moment to improve codebase health.
subagent-role: scout
disable-model-invocation: true
argument-hint: "optional direction to scope the scan (a module, subsystem, or pain point) — otherwise inferred from recent commit hot spots"
---

# Deepen

Surface **deepening opportunities** — refactors that turn shallow modules into deep ones — rank
them, and stop. This skill finds and prioritizes; it doesn't design the fix. Once a candidate is
picked, take it to `/grill` (small enough for one sitting) or `/wayfinder` (session-spanning, not
yet built) to actually work through it.

Vocabulary: [deep-modules.md](../implement/deep-modules.md) — module, interface, seam, adapter,
leverage, locality, the deletion test. Use these terms exactly in every candidate; don't drift into
"component," "service," or "boundary."

This is *informed* by the project's domain model: read `CONTEXT.md` for the vocabulary a good seam
should be named after, and `docs/adr/` for decisions this scan shouldn't re-litigate.

## What this skill does NOT do

- Design the fix, propose an interface, or grill through a decision — that's `/grill` or
  `/wayfinder`, once a candidate is picked.
- Write to `CONTEXT.md` or record an ADR — those happen inside `/grill`'s doc-anchored mode, not
  here.
- Wire dependency-cruiser, or any tooling, into the repo permanently — the TypeScript pass in
  step 1 only ever runs a throwaway scan for this report.

## Process

### 1. Scope, then explore

**Scope before you scan — YAGNI.** Deepening a module pays off by making future changes to it
easier, so weight the parts of the codebase that have recently changed:

- If the user named a direction — a module, subsystem, pain point — take it, skip the inference below.
- Otherwise walk back a good stretch of `git log --oneline` to find hot spots — files and areas
  that keep coming up — and let those pull your attention first. Widen the net if changes are
  scattered with no clear hot spot.

Read `CONTEXT.md` and any ADRs in the area you're touching first.

Use the Agent tool with `subagent_type: Explore` to walk the scoped area. Don't follow rigid
heuristics — explore organically and note friction:

- Where does understanding one concept require bouncing between many small modules?
- Where's the interface nearly as complex as the implementation (shallow)?
- Where were pure functions extracted for testability, but the real bugs hide in how they're
  called (no locality)?
- Where do tightly-coupled modules leak across their seams?
- What's untested, or hard to test through its current interface?

Apply the **deletion test** to anything you suspect is shallow: imagine deleting it. If complexity
vanishes, it's a pass-through. If complexity reappears across N callers, it was earning its keep.

**TypeScript pass.** If the repo is TypeScript (`tsconfig.json` present), let import-graph
violations feed candidates directly, not just this scan's summary:

- If `.dependency-cruiser.*` already exists, run it and read the violations.
- If it doesn't, ask once whether to run a throwaway scan — nothing gets written to the repo —
  using the four rules in [dependency-cruiser.config.cjs](./dependency-cruiser.config.cjs)
  (entry-point boundary, intra-package freedom, tests-through-entrypoints, no cycles) against the
  detected packages root. Skip this pass if the user declines.
- Each violation (a deep cross-package import, a cycle, a pass-through package) becomes a
  candidate alongside whatever the Explore subagent found organically. Dedupe overlapping
  findings before presenting.

### 2. Present candidates as concise markdown

No HTML report, no diagrams — a markdown summary read in the terminal. Two tiers:

**Full detail** — a couple of "should-do-now, easy win" candidates, each with:

- **Where** — the files/modules involved
- **Problem** — why the current shape causes friction, named with the vocabulary above
- **Before / after** — one or two sentences each, plain English
- **Benefits** — in terms of leverage and locality, and what testing would improve
- **Cost estimate** — rough size (Small/Medium/Large, or a sentence). If this candidate is a
  TypeScript package boundary, note that adopting `.dependency-cruiser.*` permanently (the config
  from step 1) is how to lock the fix in structurally rather than by convention — but don't wire
  it here; that's follow-through work for whichever skill takes the candidate next.
- **Recommendation strength** — `Strong`, `Worth exploring`, or `Speculative`

**Named only** — larger or more speculative candidates get a one-line description and nothing
else. Delve into one on request rather than bloating the report up front.

**ADR conflicts** — if a candidate contradicts an existing ADR, only surface it when the friction
is real enough to warrant revisiting the ADR; name the ADR and why it's worth reopening. Don't
list every theoretical refactor an ADR forbids.

End with a **Top recommendation** — which candidate to tackle first, and why.

Ask: _"Which of these do you want to take further?"_ Then stop — hand the picked candidate to
`/grill` (or `/wayfinder` if it's session-spanning) rather than continuing here.
