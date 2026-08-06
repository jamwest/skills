# Skills are agent-agnostic by default

Skills in this repo are written to work in any agent that can follow prose instructions — not tied to Claude Code or any other specific runtime. Where a skill must depend on agent-specific capabilities, it is flagged with a `compatibility` frontmatter field naming the runtime it needs (e.g. `compatibility: claude-code`) rather than being moved to a separate directory. No tag means agent-agnostic. `ui-evidence` (depends on Claude-in-Chrome tools and macOS AppleScript) is the first skill tagged this way.
