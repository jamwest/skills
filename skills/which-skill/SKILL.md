---
name: which-skill
description: Ask which skill or flow fits your situation. A hand-maintained router over the skills in this repo — names the skill or sequence to reach for, and stops. Invoke explicitly with /which-skill; it doesn't fire on its own.
subagent-role: scout
disable-model-invocation: true
argument-hint: "freetext description of your situation (e.g. 'two skills seem to overlap', 'I have a bug I can't figure out')"
---

# Which Skill

You don't need to remember every skill in this repo — ask.

**Recommend and stop.** Name the skill (or ordered sequence of skills) that fits, and why. Don't
invoke it, don't open its files, don't start doing the work yourself. What the user gets back is
the next thing to type.

If you're about to assert something load-bearing about a skill's behavior — not just its one-line
description below — or recommend skipping one of its steps, open its `SKILL.md` first rather than
routing off the gloss. A wrong claim
here sends the user down the wrong flow with confidence.

## The main flow: idea → shipped code

1. **`/grill`** — sharpen a plan or design by interview, and write the settled what and why into
   the ticket. Doc-anchored if `CONTEXT.md`/`docs/adr/` exist, freeform otherwise. **If the idea
   is too big and too foggy for one sitting** — a greenfield project, a build spanning many
   sessions — use `/wayfinder` instead: it charts a shared map of decision tickets on the issue
   tracker and resolves them one at a time across sessions, then hands off to `/change-plan` once
   the map clears. Session count is the test, not project size.
2. **`/change-plan`** — read the code the whole ticket touches (sibling paths, shared seams),
   propose the split (seam subtasks first, then behaviour subtasks, each with its non-test file
   list), settle product calls, and create the subtasks once you approve. Plan lives in
   `~/runs/<repo>/<ticket>.md`.
3. **`/implement`** — build one subtask: plans it against current code (`/change-plan` subtask
   size), makes the planned seam commits, then make it work (red-green TDD), make it right (check
   the plan was followed), make it fast (only when needed). One `/review` + `/brittle-tests` round
   against the plan (a second only if the first found a bug or a wrong plan answer), then it
   commits, pushes and opens a draft PR with no reviewers.
   **If the parent ticket has several subtasks** — use `/fleet-command` instead: it dispatches one
   `/implement` subagent per subtask from the approved plan, each in its own git worktree, stacked
   on what it depends on.
4. From there: marking a draft ready and adding reviewers is asked once, when the pipeline is
   green, Sonar is clean, evidence is attached and no questions are open. **`/review`** again
   yourself for a second look, **`/tidy-branch`** if the history's gotten messy, **`/commit`** for
   any commit outside `/implement`.

**Small, single change?** Go straight to `/implement` with the issue key or a freetext
description. It plans the change itself at subtask size; the ticket-size plan pays for itself once
a ticket has more than one change in it.

## Branches off the main flow

- **Branch fell behind its base** → `/rebase`. Resolves conflicts by tracing each side to its
  primary source (commit, PR, issue) rather than picking `--ours`/`--theirs` blind. Day-to-day
  tool, not a last resort.
- **History's messy mid-build** (WIP commits, fixups) → `/tidy-branch` before `/review` or
  `/pr-description`. Only touches committed history, never the working tree.
- **Something's broken and the cause isn't obvious** → `/bug`. Six-phase diagnosis loop; won't
  theorize without a tight red/green repro first. Hands its post-mortem to `/deepen` when the real
  finding is an architecture problem, not a one-off defect.
- **A UI change needs proof it works** → `/ui-evidence`, standalone or pulled in automatically by
  `/pr-description`.
- **Deciding what to pick up next** → `/inbox`. Sessions waiting on you, PRs to review or
  re-review, your PRs with changes requested or approved, and Jira, most blocking first. Read-only;
  suggests the next command (often `/pr-review <id>`). Needs command-center installed.
- **Reviewing a teammate's PR** → `/pr-review`. Checks your concerns against the code, gives
  make it work / right / fast verdicts, drafts Conventional Comments, and posts only after you
  approve. Not for your own branch — that's `/review`.
- **The work needs to travel** — new harness, new directory, a colleague, or forking a side task
  while you keep going — → `/handoff`. Writes a portable file by default; forks into a live
  background agent instead when you're staying in this session and directory. For the ordinary
  end-of-phase case (same harness, same directory, nothing traveling), just `/compact` — don't
  reach for `/handoff` there.

## After a hard session

**`/retro`** — after a session that was harder than it should have been (long searches, mistakes a
check could have caught, a reviewer miss, a skill that misled or let work sprawl). Reads the
session, including subagent transcripts, ranks fixes to the environment and to the skills
themselves, and applies only the ones you pick. Smooth sessions don't need one. `/implement` and
`/fleet-command` suggest it when their run hit friction.

## Codebase health

Not feature work — upkeep, run whenever there's a spare moment.

- **`/deepen`** — scan the codebase (or a scoped direction) for deepening opportunities — shallow
  modules, leaky seams — rank them as concise markdown, and stop. Picking one feeds `/grill` (or
  `/wayfinder` if it's session-spanning), same as any other idea entering the main flow.

## Precondition

**`/setup-agent-context`** — run before the first use of `/change-plan`,
`/implement`, `/deepen`, `/wayfinder`, or `/review` if `docs/agents/` isn't configured yet. Those
skills will flag it themselves if something's missing, but running it upfront avoids the
interruption.

## Meta

**`/skill-forge`** — create a new skill for this repo, including updates to this map.

## Maintenance

This map is hand-maintained and will lag the repo. When a stub above gets built, or an existing
skill's scope changes, update this file in the same change — don't let a second dangling
reference accumulate the way `/ship` did before it got caught.
