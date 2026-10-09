#!/bin/bash
# Copy translators from this repo into the Zotero data directory's translators/ folder.
#   ./install.sh [--force]                      install every translator in this repo
#   ./install.sh [--force] RT.com.js [...]      install only the named ones
# Finds the data directory from Zotero's profile prefs (macOS); falls back to ~/Zotero.
set -euo pipefail
FORCE=0; FILES=()
for arg in "$@"; do
	case "$arg" in
		--force) FORCE=1 ;;
		*) FILES+=("$arg") ;;
	esac
done
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
[ ${#FILES[@]} -gt 0 ] || FILES=(*.js)
for f in "${FILES[@]}"; do
	f=$(basename "$f")
	[ -f "$f" ] || { echo "no such translator in this repo: $f" >&2; exit 1; }
	if [ -e "$DEST/$f" ] && [ "$FORCE" -ne 1 ]; then
		echo "skip (exists, use --force): $DEST/$f"
	else
		cp "$f" "$DEST/$f" && echo "installed: $DEST/$f"
	fi
done
echo "Now restart Zotero, then Connector preferences > Advanced > Update Translators."
