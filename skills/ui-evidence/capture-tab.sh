#!/usr/bin/env bash
# Capture the Chrome window showing a specific tab, to a real PNG file.
#
# Why this exists: the browser MCP's screenshot returns an image into the
# conversation but writes nothing to disk (`save_to_disk` produced no file when
# tested), and a report needs actual files. macOS `screencapture` writes files
# but knows nothing about tabs — so the tab has to be brought to the front
# first, and it has to be *the right tab*: the user often has their own tabs
# open on the same localhost origin, and grabbing one of those produces
# confident, wrong evidence.
#
# The marker solves that. Navigate the driven tab to a URL ending in
# `#ccshot=<marker>`; a fragment never reaches the router, so it is a unique
# fingerprint for exactly the tab being driven.
#
# Usage: capture-tab.sh <marker> <output.png> [x,y,w,h]
#
# Pass a region to capture the page viewport alone. Without it the whole Chrome
# window is captured, which includes the toolbar and the "Claude started
# debugging this browser" banner — banner pixels in a screenshot make the
# evidence look like a test artefact rather than the product. Get the region
# from the page itself (see SKILL.md), which is exact and needs no guessing:
#   x = screenX,  y = screenY + (outerHeight - innerHeight),
#   w = innerWidth,  h = innerHeight
#
# Exits non-zero with a diagnosis on failure — read it, don't retry blindly.
 
set -euo pipefail
 
MARKER="${1:?usage: capture-tab.sh <marker> <output.png> [x,y,w,h]}"
OUT="${2:?usage: capture-tab.sh <marker> <output.png> [x,y,w,h]}"
REGION="${3:-}"
 
BOUNDS=$(osascript <<EOF
tell application "Google Chrome"
  set target to missing value
  repeat with w from 1 to count of windows
    set ts to tabs of window w
    repeat with i from 1 to count of ts
      if URL of (item i of ts) contains "ccshot=${MARKER}" then
        set active tab index of window w to i
        set index of window w to 1
        set target to w
        exit repeat
      end if
    end repeat
    if target is not missing value then exit repeat
  end repeat
  if target is missing value then return "NOTFOUND"
  activate
  delay 0.5
  -- Coerce each item separately: \`bounds as text\` concatenates the numbers
  -- into an unparseable run like "-1178-9587420".
  set b to bounds of front window
  return ((item 1 of b) as text) & "," & ((item 2 of b) as text) & "," & ¬
         ((item 3 of b) as text) & "," & ((item 4 of b) as text)
end tell
EOF
)
 
if [ "$BOUNDS" = "NOTFOUND" ]; then
  echo "No Chrome tab found with marker ccshot=${MARKER}." >&2
  echo "Navigate the tab to <url>#ccshot=${MARKER} first, then retry." >&2
  exit 2
fi
 
if [ -n "$REGION" ]; then
  RECT="$REGION"
else
  L=${BOUNDS%%,*}; REST=${BOUNDS#*,}
  T=${REST%%,*};   REST=${REST#*,}
  R=${REST%%,*}
  B=${REST#*,}
  RECT="${L},${T},$((R - L)),$((B - T))"
fi
 
mkdir -p "$(dirname "$OUT")"
screencapture -x -R"$RECT" "$OUT"
 
if [ ! -s "$OUT" ]; then
  echo "screencapture wrote no file. Screen Recording permission is required:" >&2
  echo "System Settings > Privacy & Security > Screen & System Audio Recording." >&2
  exit 3
fi
 
PX=$(python3 - "$OUT" <<'PY'
import struct, sys
with open(sys.argv[1], "rb") as fh:
    head = fh.read(24)
print("x".join(str(n) for n in struct.unpack(">II", head[16:24])))
PY
)
echo "${OUT} (${PX} px)"
