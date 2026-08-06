# Map format

A **map** is the shared plan for an effort too big for one session. It's a single issue in the
configured issue tracker, labelled `wayfinder:map`. Its **tickets** are child issues — each a
**decision** to resolve, not a slice of a build to execute.

## Refer by name

Every map and ticket is an issue, so it has a name — its title. In narration and in the map's
Decisions-so-far, refer to it by that name, never by a bare id or number. `#42, #43, #44` is
illegible; names read at a glance. The id and link don't vanish — they ride inside the name.

## The map body

The whole map at low resolution, loaded once per session. Open tickets are **not** listed here —
they're found by querying the tracker (see the "Wayfinding operations" section of
`docs/agents/issue-tracker.md`).

```markdown
## Destination

<what reaching the end of this map looks like — the spec, decision, or change this effort is
finding its way to. One or two lines; every session orients to it before choosing a ticket.>

## Notes

<domain; skills every session should consult; standing preferences for this effort. If this
effort intentionally carries execution into the map itself — an exception to "plan, don't do" —
say so here explicitly, not implicitly.>

## Decisions so far

<!-- the index — one line per closed ticket -->

- [<closed ticket title>](link) — <one-line gist of the answer>

## Not yet specified

<!-- fog of war: in-scope decisions you can tell are coming but can't yet phrase precisely -->

## Out of scope

<!-- work ruled beyond the destination; closed, never graduates -->
```

## Tickets

Each ticket is a child issue of the map. Its body is the question, sized to one session:

```markdown
## Question

<the decision or investigation this ticket resolves>
```

Each ticket carries a `wayfinder:<type>` label — see Ticket Types below. The answer isn't part of
the body — it's recorded on resolution (a comment, then the map's Decisions-so-far). Assets
created while resolving a ticket (a prototype branch, a research doc) are linked from the issue,
never pasted in.

A session **claims** a ticket by assigning it to itself, first, before any work — an open,
unassigned ticket is unclaimed. Blocking uses the tracker's native dependency relationship where
one exists; where it doesn't, a `Blocked by: <link>` line in the body is the fallback (see
`docs/agents/issue-tracker.md`). A ticket is **unblocked** when every ticket blocking it is closed;
the **frontier** is the open, unblocked, unclaimed tickets — the edge of the known.

## Ticket types

Every ticket is either **HITL** — human in the loop, worked *with* a human who speaks for
themselves — or **AFK**, driven by the agent alone. A HITL ticket only resolves through that live
exchange; the agent never stands in for the human's side of it.

| Type | Mode | Reach for it when | Resolved by |
| --- | --- | --- | --- |
| `grilling` | HITL | The default. The question can be settled by talking it through. | `/grill` |
| `prototype` | HITL | "How should this look" or "how should this behave" — a question talking can't settle. | Throwaway code, written directly on a `prototype/<name>` branch off the base branch, kept as a primary source and linked from the ticket as an asset. No dedicated skill — just build the smallest thing that answers the question. |
| `research` | AFK | A fact outside the working directory is blocking a decision. | An Agent-tool subagent (`general-purpose`), prompted to investigate the specific question against primary sources and report findings — fired at charting time, resolved in parallel with other research tickets. No dedicated skill; the prompt *is* the brief. |
| `task` | HITL or AFK | Nothing to decide, prototype, or research — but manual work blocks a decision (provisioning access, signing up for a service, moving data so its shape can be seen). | The agent alone where it can; otherwise a precise checklist handed to the human. Earns its place by unblocking a decision, never by delivering a piece of the destination — if a `task` ticket reads like "build the X," it's mis-typed. |

Research is the only ticket type allowed to resolve more than one at a time in a single session.

## Fog of war

The map is deliberately incomplete: don't chart what you can't yet see. Beyond the live tickets
lies the **fog of war** — decisions you can tell are coming but can't yet pin down, because they
hang on questions still open. Resolving a ticket clears the fog ahead of it, graduating whatever's
now specifiable into fresh tickets — one at a time.

**Fog or ticket?** The test is whether you can state the question precisely *now* — not whether you
can answer it now.

- **Ticket** when the question is already sharp, even if blocked.
- **Not yet specified** when you can't phrase it that sharply yet. Don't pre-slice the fog into
  ticket-sized pieces — it's coarser than a ticket, and one patch may graduate into several
  tickets, or none, once the frontier reaches it.

**Not yet specified** excludes what's already decided, what's already a live ticket, and what's
out of scope.

## Out of scope

Fog only ever gathers *toward* the destination. Work beyond it is **out of scope** — it isn't fog,
and never graduates. If an existing ticket turns out to sit past the destination, close it and add
one line to **Out of scope**: the gist plus why, linking the closed ticket. It stays out of
**Decisions so far**, which records the route actually walked.
