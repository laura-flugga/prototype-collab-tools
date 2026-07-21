#!/usr/bin/env bash
# Regenerate the README screenshots in docs/images/ from the pages in docs/shots/.
#
# Uses the locally-installed Google Chrome in headless "--screenshot" mode, so
# there is nothing to install. Requires the built package bundles (npm run build)
# and a static server serving the repo root.
#
# Usage:
#   npm run build
#   npx http-server . -p 8791 &     # or any static server on the repo root
#   ./scripts/screenshots.sh
set -euo pipefail

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
BASE="${BASE:-http://localhost:8791}"
OUT="docs/images"
mkdir -p "$OUT"

shot() { # <name> <width> <height>
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=2 --virtual-time-budget=4000 \
    --window-size="$2,$3" --screenshot="$OUT/$1.png" \
    "$BASE/docs/shots/$1.html" 2>/dev/null
  echo "wrote $OUT/$1.png"
}

shot proto-nav 1040 940
shot annotations 1120 560
