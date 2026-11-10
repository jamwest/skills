---
name: retro
description: Look back over a coding session and propose fixes to the agent's environment (navigation pointers, automated checks, coding standards, steering-file bloat, tool cost, information access) and to the skills themselves (a step that misled, was ambiguous, or let the change sprawl), so the next run goes better. Every candidate traces to a specific moment in the session; candidates are ranked, and only the ones the user picks get applied. Use when the user says "retro", "retrospective", "what went wrong in that session", "why was that so hard", or after /implement or /fleet-command suggests one.
subagent-role: interactive
disable-model-invocation: true
argument-hint: "optional session id, log path, or 'last' (defaults to the current session)"
---

# Retro

Review how a session went and propose changes to the **environment** the agent worked in, not to
the code it produced. The bug it shipped, the file it took twenty tool calls to find, the rule the
reviewer missed: `retro` doesn't fix those directly. It asks what let them happen, and proposes the
pointer, check, standard, or skill edit that stops them happening next time.

A smooth session has little to teach. Don't manufacture findings to fill categories. Two real
candidates beat seven generic ones, and "nothing worth changing" is a valid result.

For a verdict on the code itself, that's `/review`. For structural improvements to the code,
that's `/deepen`. `retro` needs a session record. Those two only need code.

## Process

### 1. Read repo context

Read whichever of these exist at the repo root. They're both evidence (is something missing,
bloated, or unwired?) and the places fixes land:

- `AGENTS.md` / `CLAUDE.md` — repo steering files. Also note the user's global one
  (`~/.claude/CLAUDE.md` or the equivalent for the running agent).
- `CONTRIBUTING.md` — its **Coding standards** section is what `/review` enforces
- `docs/agents/` — issue tracker, code host, domain layout. Shared facts only; this machine's
  tool commands and workarounds live in `.claude/agents/*.local.md`, which is where tool-usage
  fixes land
- The repo's check commands: `package.json` scripts / Makefile / build-tool `lint`/`check`/`test`
  targets, pre-commit config, CI workflows (`.github/workflows/`, etc.)

### 2. Load the session

Resolve which session to review:

- **No argument** — the current session. This is the best case: the struggles are still in
  context. If the context has already been compacted and the middle of the session is gone, say so
  and offer to read the log instead (below) rather than working from the summary.
- **Session id, log path, or "last"** — read it from the agent's session logs. On Claude Code, see
  [sessions-claude-code.md](./sessions-claude-code.md). On any other agent, ask the user for a log
  path or a paste. Don't guess at an unknown log format.

If the session dispatched subagents (`/fleet-command`, `/implement`'s review round, any Agent-tool
call), their transcripts are part of the session. Read the ones where something went wrong: a
failed or held subtask, a review round that still flagged findings, a scope-check revert.

### 3. Find the friction

Walk the session and note every moment of real friction, each with a pointer back to where it
happened (a quote, a tool call, a turn). Signals worth looking for:

- Long searches: many Grep/Glob/Read calls before finding the right file or fact
- A mistake the agent made, then had to undo, or that the user had to correct
- A test, lint, or type failure that surfaced late, or a check that never ran
- A review finding that should have been caught earlier, or a reviewer that missed something the
  user caught
- An expensive tool call (huge output, repeated identical calls) for little value
- The agent asking the user for something it could have looked up, or working blind without
  information it couldn't reach
- A skill step that was skipped, misread, contradicted another instruction, or pushed the work
  somewhere it shouldn't have gone (e.g. `/implement` changing files the task didn't need)

Anything you can't point back to a specific moment is not a finding. Drop it.

### 4. Classify each finding

Assign each finding the one category whose fix addresses its cause:

| Category | What went wrong | Fix |
| --- | --- | --- |
| **Navigation** | Took a long time to find a file or fact; a hidden dependency between files | A **navigation pointer** from a file the agent already reads (`AGENTS.md`, a doc, a code comment at the seam) |
| **Automated checks** | A mistake a tool could have caught | A lint rule, type, test, pre-commit hook, or CI job. Check what exists first: an existing check that's unwired or silently broken is the finding, not a new one. A repo with no guardrail at all (no pre-commit hook and no CI job running lint/typecheck/test) is a finding in itself. |
| **Coding standards** | The reviewer missed a mistake, or a standard is wrong or unclear | Classify first. **Mechanical** (banned API, import shape, file location, fixed syntactic pattern) → it's an Automated check, not a standard. **Judgement call** (cross-file consistency, matching surrounding style) → a rule in `CONTRIBUTING.md`'s Coding standards section, which `/review` reads. Removing or clarifying an existing rule counts too. |
| **Steering bloat** | `AGENTS.md`/`CLAUDE.md` (repo or global) is large | Move steering out: rules into Coding standards or checks, leaving navigation pointers behind |
| **No-ops** | Steering lines that didn't change the agent's behaviour | Delete them. Judge against this session only, so frame each as a candidate for the deletion test, not a verdict. |
| **Tool economy** | An expensive call for what it returned; token-heavy custom tooling | Streamline or replace the tool, or point the agent at a cheaper path |
| **Information access** | Crucial information the agent couldn't reach | Widen access: tee dev-server logs to a file, read-only credentials for a service, a script that dumps state |
| **Skill friction** | A skill from this repo misled, was ambiguous, was skipped, or let the work sprawl | An edit to that skill's `SKILL.md` or bundled file in `jamwest/skills` |

**Where fixes go.** The implementing agent carries the most context pressure: it explores, writes
code, and debugs. The reviewing agent gets a diff and little else. So standards belong to review
(`CONTRIBUTING.md`), not to implementation. `AGENTS.md`/`CLAUDE.md` load into every session,
relevant or not; use them for navigation pointers and almost nothing else. Prefer a check that
fails over a sentence that asks.

A repeated mistake is never fixed by adding a line to `CLAUDE.md`. That's the most common bad fix,
so push back on it. And `retro` is not a memory system: don't propose saving "what happened". Propose
the change that stops it happening.

### 5. Present ranked candidates

Order by severity, roughly the cost the friction caused × how likely it is to recur. Treat the
order as a first draft: a quiet, expensive mistake can deserve to rank above a loud, cheap one.

For each candidate:

```
N. [Category] One-line title
   Moment:  where in the session it happened (quote or tool call)
   Cause:   what in the environment let it happen
   Fix:     the concrete change, and the file(s) it touches
```

If there are none worth proposing, say so in one line and stop.

Then ask which to apply: _"Which of these should I apply? (numbers, 'all', or 'none')"_

### 6. Apply what the user picks

One at a time, in the order picked. Confirm each landed before moving to the next.

- **Environment fixes in the current repo**: make the edit. For a new automated check, run it
  against the repo before wiring it into anything that blocks (hook, CI). A check that fires on
  existing good code needs tuning first, not a mass fix.
- **Skill friction, when the current repo is `jamwest/skills`**: edit the skill directly, following
  `skill-forge`'s conventions.
- **Skill friction, from any other repo**: don't edit an installed copy. File an issue on
  `jamwest/skills` (`gh issue create -R jamwest/skills`) with the moment, cause, and proposed edit,
  and report the URL.
- **Global steering (`~/.claude/CLAUDE.md` or equivalent)**: show the exact proposed diff and get
  an explicit yes before editing. It affects every project.

Don't commit. Report what changed and where, and list the candidates that weren't picked so they
stay visible.
