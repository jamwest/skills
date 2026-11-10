---
name: wayfinder
description: Plan a huge chunk of work — more than one agent session can hold — as a shared map of decision tickets on the issue tracker, and resolve them one at a time until the way to the destination is clear. Use when an idea is too big and too foggy for one /grill session — a greenfield project, a build spanning many sessions, or an effort on a legacy codebase where "what's already true here" is as unclear as "what should we do."
subagent-role: interactive
disable-model-invocation: true
argument-hint: "a loose idea (to chart a new map), or a map's issue number/URL (to work through an existing one)"
---

# Wayfinder

A loose idea has arrived — too big for one session, wrapped in fog: the way from here to the
**destination** isn't visible yet. This skill charts that way as a shared **map** on the issue
tracker, then works its **decision tickets** one at a time until the route is clear. See
[map-format.md](./map-format.md) for the full vocabulary: the map body, ticket types, fog of war,
the frontier.

The tracker mechanics — how the map, its tickets, blocking, and frontier queries are actually
expressed — are tracker-specific. Read `docs/agents/issue-tracker.md`'s "Wayfinding operations"
section before doing anything below, and the commands in the `.claude/agent-context/issue-tracker.local.md`
it points to. Run `/setup-agent-context` first if `docs/agents/issue-tracker.md` doesn't exist.

## Plan, don't do

Wayfinder is **planning** by default: each ticket resolves a decision, and the map is done when
nothing is left to decide before someone goes and does the thing. The pull to just do the work is
usually the signal you've reached the edge of the map and it's time to hand off. An effort can
override this in its map's **Notes** — carrying execution into the map itself — but absent that,
produce decisions, not deliverables.

## What this skill does NOT do

- Build anything. When the map clears, hand off to `/blueprint` (collapse the map's decisions into
  a buildable design doc) → `/break-it-down` → `/implement`, the same as any other planning input.
- Resolve more than one ticket per session — except `research` tickets, which can run several in
  parallel.
- Write CONTEXT.md/ADR updates itself outside of a `grilling` ticket — that happens inside
  `/grill`'s doc-anchored mode, which a `grilling` ticket invokes.

## Invocation

Two modes, chosen by what the user passed in.

### Chart the map

User invokes with a loose idea, no existing map.

1. **Name the destination.** Run `/grill` to pin down what this map is finding its way to — the
   spec, decision, or change. The destination fixes the scope, so it's settled first.
2. **Map the frontier.** Run `/grill` again, **breadth-first** this time — fan out across the
   whole space rather than deep on any one thread, surfacing the open decisions and the first
   steps takeable now. **If this surfaces no fog** — the way to the destination is already clear,
   small enough for one session — you don't need a map. Stop and ask the user how they'd like to
   proceed instead (probably straight to `/blueprint`).
3. **Create the map**, labelled `wayfinder:map`: Destination and Notes filled in, Decisions-so-far
   empty, the fog sketched into Not yet specified.
4. **Create the tickets you can specify now** as child issues of the map, then wire blocking edges
   in a **second pass** — issues need ids before they can reference each other. Everything you
   can't yet specify stays in the fog.
5. **Fire the research tickets.** For each `research` ticket just created, spin up an Agent-tool
   subagent (`general-purpose`) to resolve it in parallel — see [map-format.md](./map-format.md)'s
   Ticket Types table for the brief shape. Capture findings on a throwaway `research/<name>`
   branch with a context pointer from the ticket.
6. Stop. Charting is one session's work; it hand-resolves nothing.

### Work through the map

User invokes with a map (issue number or URL). A ticket is optional — without one, you pick the
next decision, not the user.

1. Load the **map** — the low-res body, not every ticket.
2. Choose the ticket. If the user named one, use it. Otherwise take the first frontier ticket in
   order. **Claim it**: assign it to yourself before any work.
3. Resolve it per its type (see [map-format.md](./map-format.md)):
   - `grilling` → run `/grill` on the question. If in doubt about type, default here.
   - `prototype` → write the smallest throwaway artifact that answers the question, on a
     `prototype/<name>` branch. Link it from the ticket.
   - `research` → an Agent-tool subagent investigates and reports; no live back-and-forth needed.
   - `task` → do the work directly if you can; otherwise hand the human a precise checklist and
     wait.
   Zoom as needed — fetch the full body of any related or closed ticket on demand.
4. **Record the resolution**: post the answer as a comment, close the ticket, append a
   one-line context pointer to the map's Decisions-so-far.
5. Add newly-surfaced tickets (create, then wire blocking in a second pass). Graduate any fog the
   answer made specifiable, clearing it from Not yet specified. If the answer reveals a ticket
   sits beyond the destination, **rule it out of scope** rather than resolving it on the route. If
   the decision invalidates other parts of the map, update or delete those tickets.

Other sessions may be resolving unblocked tickets in parallel — expect concurrent edits to the
tracker.
