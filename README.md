# James's Claude Code Skills

A collection of personal skills for [Claude Code](https://claude.ai/code), iterated and refined over time.

## Installation

Skills are installed using the [`skills` CLI](https://github.com/vercel-labs/skills).

### Install all skills (global)

```bash
npx skills add jamwest/skills -g -a claude-code -y
```

This installs all skills to `~/.claude/skills/` — available across all your projects.

### Install all skills (project)

```bash
npx skills add jamwest/skills -a claude-code -y
```

This installs to `.claude/skills/` in the current project, committed alongside your code.

### Install from a local clone (npx)

```bash
npx skills add ./path/to/skills -g -a claude-code -y
```

Useful when iterating locally before pushing changes.

### Install from a local clone (symlinked)

```bash
./scripts/install-local.sh -y
```

Symlinks skills directly from the repo into `~/.agents/skills/` (registry) and then into `~/.claude/skills/` — so edits in the repo are live immediately with no re-install.

```bash
# Options mirror the npx skills CLI:
./scripts/install-local.sh --list                  # preview available skills
./scripts/install-local.sh --skill init -y         # install one skill
./scripts/install-local.sh -a claude-code -y       # explicit agent (default)
./scripts/install-local.sh --project -y            # install to .claude/skills/ instead of global
```

### Preview available skills first

```bash
npx skills add jamwest/skills --list
```

### Install a specific skill

```bash
npx skills add jamwest/skills --skill <skill-name> -g -a claude-code -y
```

## Updating

Re-run the same install command to pull the latest version of any skill.

## License

[LICENSE](LICENSE)
