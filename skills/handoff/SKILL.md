---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up, or fork it into a live background agent if you're staying in this session. Writes a portable markdown file to the OS temp dir by default; forks via a `claude --bg` background agent when the situation is "keep working now, same harness and directory" (falls back to the file if that CLI isn't available). Use when the user says "hand this off", "compact this for later", "fork this into the background", or is about to swap harness, swap directory, or hand the thread to a colleague.
subagent-role: worker
disable-model-invocation: true
argument-hint: "what the next session is for, and whether it's a fork (keep working now, same harness/directory) or a move (new harness, new directory, or a colleague)"
---

# Handoff

Compact the live thread into a summary aimed at a stated next task, then either hand it to a fresh
agent as a file, or fork it into a background agent right now — whichever the situation calls for.

This buys **portability**, not compression — reach for `/compact` instead when nothing is actually
traveling (same harness, same directory, you're staying in the loop). This skill is for when the
work has to move somewhere `/compact` can't reach, or a second worker needs to start on a side task
while you keep going.

## Process

### 1. Write the summary

Summarize what's in flight, why, and what's next. Do **not** duplicate content already captured
elsewhere — specs, plans, ADRs, issues, commits, diffs. Reference those by path or URL instead;
copying them in creates a second copy that drifts from the first.

Include a **Suggested skills** section naming what the next agent should reach for — a specific
skill if the direction is clear, `/which-skill` as a pointer if it isn't.

Redact API keys, passwords, tokens, and personally identifiable information before anything is
written to a file or passed into a command.

If the user passed an argument, treat it as what the next session/task is for, tailor the summary
to it, and use it to help decide the shape in step 2.

### 2. Decide the shape

- **Fork** — same harness, same directory, you're staying in this session and want a second agent
  working the side task in parallel right now → step 3.
- **Move** — a different harness, a different directory, or a colleague who needs something they
  can read → step 4.

If the argument didn't make this clear, ask: _"Should this keep running now in the background
here, or is it moving to a different session, place, or person?"_

### 3. Live background agent (fork)

Check the `claude` CLI is on the `PATH` (`command -v claude`). If it is, write the summary to a
temp file (`mktemp -t handoff-<slug>`), then launch:

```
claude --bg --name "<descriptive name>" -- "$(cat <summary file>)"
```

Never inline the summary as a quoted argument: inside double quotes the shell runs backticks and
expands `$(...)`/`$VAR`, which mangles any summary that quotes code. Passing the file's contents
through `$(cat ...)` doesn't re-expand them, and `--` stops a summary that starts with `-` being
read as a flag.

Always pass `--name` with a short, descriptive name (e.g. `"Fix login bug"`) — it's what shows up
in the job list, session picker, and terminal title. It starts in the current working directory
and returns immediately; the user manages it with `claude agents`.

If `claude` isn't available (a different CLI, a sandboxed shell), say so and fall back to step 4 —
a fork that can't launch is just a handoff nobody's going to read.

### 4. Portable file (move)

Write the summary to a file in the OS temp directory — not the workspace — with a stable,
descriptive path (e.g. `mktemp -t handoff-<slug>`). Report the absolute path back before doing
anything else: losing track of it is the most-reported friction with this shape, and if the next
session won't start within the hour or is under a different harness, the temp dir may not survive
a reboot — copy it somewhere durable now if that applies.

Hand the file to a fresh session by pointing it at the path — "read this file, then continue" —
rather than pasting the summary into a shell command. Unescaped backticks or `$(...)` in a pasted
summary can silently truncate when interpolated into a command string, and the new agent starts
from a quietly incomplete brief with no error to notice.

## What this isn't

- Not a substitute for `/compact` — that's the default at a phase boundary; this is the narrower,
  rarer case where something has to actually travel.
- Not a place to re-litigate settled work. Specs, ADRs, issues, and diffs are pointed at, never
  copied in.
