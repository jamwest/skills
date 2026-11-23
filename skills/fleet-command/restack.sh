#!/bin/sh
set -e
if [ "$#" -lt 4 ]; then
  echo "usage: restack.sh <worktree> <lower-branch> <old-lower-tip> <branch> [<branch>...]" >&2
  exit 2
fi
cd "$1"
new_base="$2"
old_base="$3"
shift 3

for branch in "$@"; do
  old_tip=$(git rev-parse "$branch")
  git rebase --onto "$new_base" "$old_base" "$branch"
  echo "restacked $branch: $(git rev-parse --short "$old_tip") -> $(git rev-parse --short HEAD)"
  old_base="$old_tip"
  new_base="$branch"
done
