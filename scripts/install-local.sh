#!/usr/bin/env bash
set -euo pipefail

# install-local.sh — Symlink-install skills from this local repo
#
# Works like: npx skills add ./path/to/skills -g -a claude-code -y
# but uses symlinks so local edits are live immediately — no re-install needed.
#
# Two-hop link chain:
#   ~/.agents/skills/<name>  →  <repo>/skills/<name>   (registry ← repo)
#   <agent-dir>/<name>       →  ../../.agents/skills/<name>  (agent ← registry)
#
# Usage:
#   ./scripts/install-local.sh [options]
#
# Options:
#   -a, --agent <name>    Target agent (default: claude-code)
#   -g, --global          Install globally to ~/.<agent>/skills/ (default)
#       --project         Install to ./<agent>/skills/ in the current directory
#       --skill <name>    Install only a single named skill
#       --list            List available skills and exit (no install)
#       --remove          Remove symlinks created by this script (safe: skips real dirs)
#   -y, --yes             Skip confirmation prompt
#   -h, --help            Show this help

REPO="$(cd "$(dirname "$0")/.." && pwd)"
REGISTRY="$HOME/.agents/skills"

# ── defaults ──────────────────────────────────────────────────────────────────
AGENT="claude-code"
SCOPE="global"
FILTER=""
LIST_ONLY=0
REMOVE=0
YES=0

# ── argument parsing ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    -a|--agent)    AGENT="$2";   shift 2 ;;
    -g|--global)   SCOPE="global";  shift ;;
    --project)     SCOPE="project"; shift ;;
    --skill)       FILTER="$2";  shift 2 ;;
    --list)        LIST_ONLY=1;  shift ;;
    --remove)      REMOVE=1;     shift ;;
    -y|--yes)      YES=1;        shift ;;
    -h|--help)
      sed -n '/^# Usage:/,/^[^#]/p' "$0" | grep '^#' | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "error: unknown option: $1" >&2; exit 1 ;;
  esac
done

# ── resolve agent-specific skills dir ─────────────────────────────────────────
case "$AGENT" in
  claude-code)
    if [[ "$SCOPE" == "global" ]]; then
      AGENT_DIR="$HOME/.claude/skills"
    else
      AGENT_DIR="$(pwd)/.claude/skills"
    fi
    ;;
  *)
    if [[ "$SCOPE" == "global" ]]; then
      AGENT_DIR="$HOME/.${AGENT}/skills"
    else
      AGENT_DIR="$(pwd)/.${AGENT}/skills"
    fi
    ;;
esac

# ── collect skill dirs ────────────────────────────────────────────────────────
# Build array from newline-separated paths (bash 3.x compatible)
SKILL_DIRS=()
while IFS= read -r skill_md; do
  SKILL_DIRS+=("$(dirname "$skill_md")")
done < <(
  find "$REPO/skills" -name SKILL.md \
    -not -path '*/node_modules/*' \
    -not -path '*/deprecated/*' \
    -not -path '*/in-progress/*' \
    | sort
)

if [[ ${#SKILL_DIRS[@]} -eq 0 ]]; then
  echo "No skills found in $REPO/skills" >&2
  exit 1
fi

# ── --list ────────────────────────────────────────────────────────────────────
if [[ $LIST_ONLY -eq 1 ]]; then
  echo "Available skills in $REPO:"
  for dir in "${SKILL_DIRS[@]}"; do
    name="$(basename "$dir")"
    # Pull description from SKILL.md frontmatter if present
    desc="$(awk '/^description:/{sub(/^description:[[:space:]]*/,""); print; exit}' "$dir/SKILL.md" 2>/dev/null || true)"
    if [[ -n "$desc" ]]; then
      printf "  %-30s %s\n" "$name" "$desc"
    else
      echo "  $name"
    fi
  done
  exit 0
fi

# ── apply --skill filter ──────────────────────────────────────────────────────
if [[ -n "$FILTER" ]]; then
  FILTERED=()
  for dir in "${SKILL_DIRS[@]}"; do
    if [[ "$(basename "$dir")" == "$FILTER" ]]; then
      FILTERED+=("$dir")
    fi
  done
  if [[ ${#FILTERED[@]} -eq 0 ]]; then
    echo "error: skill '$FILTER' not found in $REPO/skills" >&2
    exit 1
  fi
  SKILL_DIRS=("${FILTERED[@]}")
fi

# ── confirmation ──────────────────────────────────────────────────────────────
if [[ $YES -eq 0 ]]; then
  if [[ $REMOVE -eq 1 ]]; then
    echo "Will remove ${#SKILL_DIRS[@]} skill symlink(s) from:"
    echo "  agent:    $AGENT_DIR"
    echo "  registry: $REGISTRY"
    echo "(Only symlinks pointing into this repo will be removed.)"
  else
    echo "Will symlink ${#SKILL_DIRS[@]} skill(s) from:"
    echo "  $REPO/skills"
    echo "into registry:"
    echo "  $REGISTRY"
    echo "and link agent ($AGENT) at:"
    echo "  $AGENT_DIR"
  fi
  echo ""
  read -rp "Proceed? [y/N] " answer
  [[ "$(echo "$answer" | tr '[:upper:]' '[:lower:]')" == "y" ]] || { echo "Aborted."; exit 0; }
fi

# ── remove ────────────────────────────────────────────────────────────────────
if [[ $REMOVE -eq 1 ]]; then
  removed=0
  for src in "${SKILL_DIRS[@]}"; do
    name="$(basename "$src")"
    agent_target="$AGENT_DIR/$name"
    registry_target="$REGISTRY/$name"

    # Remove agent link only if it's a symlink that resolves into this repo
    if [[ -L "$agent_target" ]]; then
      resolved="$(readlink -f "$agent_target" 2>/dev/null || true)"
      case "$resolved" in
        "$REPO"/*) rm "$agent_target"; echo "unlinked $name (agent)" ;;
        *)         echo "skipped  $name (agent link doesn't point into this repo)" ;;
      esac
    elif [[ -e "$agent_target" ]]; then
      echo "skipped  $name (agent entry is not a symlink)"
    fi

    # Remove registry link only if it's a symlink that resolves into this repo
    if [[ -L "$registry_target" ]]; then
      resolved="$(readlink -f "$registry_target" 2>/dev/null || true)"
      case "$resolved" in
        "$REPO"/*) rm "$registry_target"; echo "unlinked $name (registry)" ;;
        *)         echo "skipped  $name (registry link doesn't point into this repo)" ;;
      esac
    elif [[ -e "$registry_target" ]]; then
      echo "skipped  $name (registry entry is not a symlink)"
    fi

    removed=$((removed + 1))
  done
  echo ""
  echo "✓ done (${removed} skill(s) processed)"
  exit 0
fi

# ── sanity-check registry isn't a symlink into this repo ──────────────────────
if [[ -L "$REGISTRY" ]]; then
  resolved="$(readlink -f "$REGISTRY")"
  case "$resolved" in
    "$REPO"|"$REPO"/*)
      echo "error: $REGISTRY is a symlink into this repo ($resolved)." >&2
      echo "Remove it (rm \"$REGISTRY\") and re-run." >&2
      exit 1
      ;;
  esac
fi

mkdir -p "$REGISTRY"
mkdir -p "$AGENT_DIR"

# ── compute relative path: AGENT_DIR → REGISTRY ───────────────────────────────
# e.g. ~/.claude/skills/foo → ../../.agents/skills/foo
rel_registry_from_agent() {
  python3 -c "
import os, sys
src = os.path.dirname(sys.argv[1])   # dir containing the link
dst = sys.argv[2]                    # link target
print(os.path.relpath(dst, src))
" "$AGENT_DIR/__placeholder__" "$REGISTRY"
}
REL_REGISTRY="$(rel_registry_from_agent)"

# ── install ───────────────────────────────────────────────────────────────────
for src in "${SKILL_DIRS[@]}"; do
  name="$(basename "$src")"

  # 1. registry ← repo  (absolute symlink is fine; registry is fixed at ~/.agents)
  registry_target="$REGISTRY/$name"
  if [[ -e "$registry_target" && ! -L "$registry_target" ]]; then
    echo "warning: $registry_target exists and is not a symlink — skipping registry link for $name" >&2
  else
    ln -sfn "$src" "$registry_target"
  fi

  # 2. agent dir ← registry  (relative, matching how npx skills installs)
  agent_target="$AGENT_DIR/$name"
  if [[ -e "$agent_target" && ! -L "$agent_target" ]]; then
    echo "warning: $agent_target exists and is not a symlink — skipping agent link for $name" >&2
  else
    ln -sfn "$REL_REGISTRY/$name" "$agent_target"
  fi

  echo "linked  $name"
done

echo ""
echo "✓ ${#SKILL_DIRS[@]} skill(s) linked to $AGENT_DIR"
