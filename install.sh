#!/bin/bash
# Copy every translator in this repo into the Zotero data directory's translators/ folder.
#   ./install.sh [--force]
# Finds the data directory from Zotero's profile prefs (macOS); falls back to ~/Zotero.
set -euo pipefail
FORCE=0; [ "${1:-}" = "--force" ] && FORCE=1
DATADIR=""
for prefs in "$HOME/Library/Application Support/Zotero/Profiles"/*/prefs.js; do
	[ -f "$prefs" ] || continue
	if grep -q '"extensions.zotero.useDataDir", true' "$prefs"; then
		DATADIR=$(grep '"extensions.zotero.dataDir"' "$prefs" | sed -E 's/.*"extensions.zotero.dataDir", "([^"]*)".*/\1/')
	fi
	[ -n "$DATADIR" ] && break
done
[ -n "$DATADIR" ] || DATADIR="$HOME/Zotero"
DEST="$DATADIR/translators"
[ -d "$DEST" ] || { echo "translators folder not found at $DEST" >&2; exit 1; }
cd "$(dirname "$0")"
for f in *.js; do
	if [ -e "$DEST/$f" ] && [ "$FORCE" -ne 1 ]; then
		echo "skip (exists, use --force): $DEST/$f"
	else
		cp "$f" "$DEST/$f" && echo "installed: $DEST/$f"
	fi
done
echo "Now restart Zotero, then Connector preferences > Advanced > Update Translators."
