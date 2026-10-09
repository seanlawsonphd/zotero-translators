# Custom Zotero translators

Site-specific web translators for the [Zotero Connector](https://www.zotero.org/download/connectors),
built and tested with the official [zotero/translators](https://github.com/zotero/translators) tooling.
Each file carries its own test cases, which the official test runner executes against the live site.

| Translator | Site | What it saves |
|---|---|---|
| `RT.com.js` | https://www.rt.com | News and features as newspaper articles (byline, date, standfirst, section, tags); show episodes under `/shows/` as TV broadcasts with the program name; pick-lists on section, search, trend, and tag pages |
| `TASS.com.js` | https://tass.com | Stories as newspaper articles (date, lead, section, tags; TASS copy is unsigned); pick-lists on the homepage, section, search, and tag pages |

Other-language editions (`actualidad.rt.com`, `tass.ru`, ...) use different page templates and are
not covered.

## Install

### A single translator

1. Find your Zotero data directory: in Zotero, Settings → Advanced → Files and Folders →
   **Show Data Directory**. Translators live in its `translators` subfolder.
2. Download the file you want from this repo (open it on GitHub and use **Download raw file**, or
   fetch it from the command line) and put it in that `translators` folder. For example, on macOS
   with the default data directory:

   ```bash
   curl -L -o ~/Zotero/translators/RT.com.js \
     https://raw.githubusercontent.com/seanlawsonphd/zotero-translators/main/RT.com.js
   ```

   With a clone of this repo, `./install.sh RT.com.js` does the same and finds the data directory
   for you (add `--force` to replace an older copy).
3. Restart Zotero. Translators are read at startup.
4. In the browser Connector's preferences, open Advanced and click **Update Translators**, then
   reload the site. The Connector icon changes from the generic page icon to a newspaper icon.

### All translators in this repo

Clone the repo and run `./install.sh` (macOS; it locates the data directory from Zotero's profile
and refuses to overwrite existing files unless you pass `--force`), or copy all the `.js` files into
the `translators` folder by hand. Then restart Zotero and update the Connector's translators as above.

### Keeping them

Keep this repo (or your downloaded copies) as a backup: Zotero's **Reset Translators** button wipes
the `translators` folder and re-downloads only the official set. Installed custom translators are
not touched by Zotero's normal translator updates.

## Known Connector limitation

When several items are saved at once from a pick-list, the Connector skips snapshots by design
([zotero-connectors issue 481](https://github.com/zotero/zotero-connectors/issues/481)). Single
saves get snapshots. The [Add Missing Snapshots](https://github.com/seanlawsonphd/zotero-add-missing-snapshots)
plugin backfills them afterwards.

## Developing and testing

Clone [zotero/translators](https://github.com/zotero/translators) with at least two commits of
history (its linter needs `HEAD~1`), run `npm ci` with Node 18 or later, copy a translator from this
repo into the clone's root, and use the repo's tools:

```bash
node .bin/update-metadata.mjs RT.com.js            # stamp lastUpdated after any code change
npm run lint -- RT.com.js
node .bin/run-tests.mjs RT.com.js --no-dependents   # headless Chrome with a real Connector build
```

If a test fails only because the live page changed (a re-headlined story, new tags), remove the
stale case and recapture it with `node .bin/create-test.mjs RT.com.js --url <url>`.

The [zotero-translator skill](https://github.com/seanlawsonphd/zotero-claude-skills) for Claude Code
documents the full workflow used to build these.

## License

AGPL-3.0, like Zotero and its translators. See [LICENSE](LICENSE).
