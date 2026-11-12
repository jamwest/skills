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

1. **`/grill`** — sharpen a plan or design by interview. Doc-anchored if `CONTEXT.md`/`docs/adr/`
   exist, freeform otherwise. **If the idea is too big and too foggy for one sitting** — a
   greenfield project, a build spanning many sessions — use `/wayfinder` instead: it charts a
   shared map of decision tickets on the issue tracker and resolves them one at a time across
   sessions, then hands off to `/blueprint` once the map clears. Session count is the test, not
   project size.
2. **`/blueprint`** — turn the grill session (or a freetext brief) into a structured design doc
   under `.claude/blueprints/`.
3. **`/break-it-down`** — decompose the blueprint into tracked work items in the configured issue
   tracker (Jira, GitHub Issues, or local markdown — see `docs/agents/issue-tracker.md`).
4. **`/implement`** — build one subtask in three phases — make it work (red-green TDD), make it
   right (design pass scoped to the diff), make it fast (only when needed) — from its issue key or a
   local scratch path. Ends with one bounded, automatic `/review` round of its own: a fresh
   sub-agent reviews the diff, `/implement` auto-fixes hard/spec findings and re-reviews once,
   then stops — it doesn't loop until clean, and leaves judgement-call smells for you.
   **If the parent ticket has several subtasks ready at once** — use `/fleet-command` instead of
   calling `/implement` on each one in turn: it works out which subtasks are independent versus
   dependent, then dispatches one `/implement` subagent per subtask into its own git worktree and
   branch off a shared integration branch, committing and cleaning up each worktree as agents
   finish.
5. From there it's a manual, one-at-a-time call: **`/review`** again yourself if you want a second
   look (the judgement-call smells `/implement` deliberately left, or a check right before
   opening the PR), **`/pr-description`** to draft the PR (pulls in `/ui-evidence` itself if the
   change has a visible UI effect), **`/tidy-branch`** first if the history's gotten messy,
   **`/commit`** for any commit message along the way — `/implement` never commits on its own,
   so there's usually one waiting here even before the PR. Closing the issue and opening the PR
   stay manual — nothing here chains into the next step on its own.

**Skip steps 2–3 for small, single-session work.** Go straight from `/grill` (or no grill at all)
to `/implement` with a freetext task description — the blueprint/tracker overhead only pays for
itself once a build spans more than one sitting or needs a paper trail.

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

**`/setup-agent-context`** — run before the first use of `/break-it-down`, `/blueprint`,
`/implement`, `/deepen`, `/wayfinder`, or `/review` if `docs/agents/` isn't configured yet. Those
skills will flag it themselves if something's missing, but running it upfront avoids the
interruption.

## Meta

**`/skill-forge`** — create a new skill for this repo, including updates to this map.

## Maintenance

This map is hand-maintained and will lag the repo. When a stub above gets built, or an existing
skill's scope changes, update this file in the same change — don't let a second dangling
reference accumulate the way `/ship` did before it got caught.
