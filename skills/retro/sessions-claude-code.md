# Reading Claude Code session logs

Read this only when step 2 needs a session other than the current one, on Claude Code.

## Where they live

```
~/.claude/projects/<project-slug>/<session-id>.jsonl          # main transcript
~/.claude/projects/<project-slug>/<session-id>/subagents/     # agent-<id>.jsonl + .meta.json per subagent
~/.claude/projects/<project-slug>/<session-id>/tool-results/  # large tool outputs spilled to disk
```

`<project-slug>` is the session's working directory with `/` and `.` replaced by `-`, e.g.
`/Users/me/Repos/my.app` → `-Users-me-Repos-my-app`. A `/fleet-command` worktree has its own
directory path, so its slug differs from the main repo's.

## Picking the session

- **"last"** — the most recent `*.jsonl` in this project's slug directory that isn't the current
  session: `ls -t ~/.claude/projects/<slug>/*.jsonl | head -2`.
- **Session id** — `~/.claude/projects/<slug>/<id>.jsonl`; if the slug is unknown,
  `ls ~/.claude/projects/*/<id>.jsonl`.
- **Path** — use it directly.

## Reading without flooding context

Transcripts are large. Never `cat` a whole one. Each line is one JSON event; extract what you need
with `jq`:

```bash
# User turns (what was asked, what was corrected)
# (content is either a string or an array of blocks; text blocks hold the typed message)
jq -r 'select(.type=="user") | .message.content
       | if type=="string" then . else (.[]? | select(.type=="text") | .text) end' <file> | cut -c1-400

# Tool calls in order: name + a short input summary
jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use")
       | "\(.name)\t\(.input|tostring|.[0:160])"' <file>

# Tool calls by name, to spot long searches or repeated calls
jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use") | .name' <file> \
  | sort | uniq -c | sort -rn

# Errored tool results
jq -r 'select(.type=="user") | .message.content[]? | select(.type=="tool_result" and .is_error==true)
       | .content|tostring|.[0:300]' <file>
```

If the schema doesn't match (fields renamed in a newer version), inspect one line with
`head -c 2000 <file>` and adapt the filters. Don't fall back to reading the whole file.

For a large session, delegate the read to a subagent. Have it return only the friction moments
from step 3, each with its quote or tool call, not the transcript.
