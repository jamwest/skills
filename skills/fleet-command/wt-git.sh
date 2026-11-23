#!/bin/sh
set -e
if [ "$#" -lt 2 ]; then
  echo "usage: wt-git.sh <worktree> <git args...>" >&2
  exit 2
fi
dir="$1"
shift
cd "$dir"
exec git "$@"
