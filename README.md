# Custom Zotero translators for state and state-aligned news sites

These small files teach Zotero how to save articles from the news sites listed below
properly: with the headline, author, date, section, and tags filled in, instead of a bare "Web Page".
Once installed, saving an article works exactly like saving from any other news site: click the
Zotero button in your browser.

| File | Website | What you get |
|---|---|---|
| `RT.com.js` | RT's English site at any address: https://rt-english.com today, formerly www.rt.com | Articles saved as **Newspaper Article** items; RT shows (video programs) saved as **TV Broadcast** items; a pick-list of stories on section and search pages |
| `TASS.com.js` | https://tass.com | Articles saved as **Newspaper Article** items; a pick-list of stories on the home page, section pages, and search pages |
| `SputnikGlobe.com.js` | https://sputnikglobe.com | Articles, videos, infographics, and long reads saved as **Newspaper Article** items; a pick-list of stories on the home page and on section, tag, archive, and search pages |
| `RIA.ru.js` | https://ria.ru (Russian-language edition) | Articles saved as **Newspaper Article** items (РИА Новости); a pick-list of stories on the home page and section pages |
| `TVZvezda.ru.js` | https://tvzvezda.ru (Russian-language news) | Articles saved as **Newspaper Article** items (Телеканал «Звезда»); a pick-list of stories on the home page and section pages |
| `RG.ru.js` | https://rg.ru (Russian-language edition) | Articles saved as **Newspaper Article** items (Российская газета, with the signed author); a pick-list of stories on the home page and section pages |
| `News.cn.js` | https://english.news.cn (Xinhua English edition) | Articles saved as **Newspaper Article** items (Xinhua); a pick-list of stories on the home page and section pages |
| `People.cn.js` | https://en.people.cn (People's Daily Online English edition) | Articles saved as **Newspaper Article** items (People's Daily Online, with the byline when there is one); a pick-list of stories on the home page and section pages |
| `GlobalTimes.cn.js` | https://www.globaltimes.cn | Articles saved as **Newspaper Article** items (Global Times, with byline and subtitle); a pick-list of stories on the home page and section pages |
| `ChinaDaily.com.cn.js` | https://www.chinadaily.com.cn (English edition) | Articles saved as **Newspaper Article** items (China Daily, with byline when there is one); a pick-list of stories on the home page and section pages |
| `ECNS.cn.js` | https://www.ecns.cn (China News Service English edition) | Articles saved as **Newspaper Article** items (China News Service, with section); a pick-list of stories on the home page and section pages |
| `CGTN.com.js` | https://news.cgtn.com and https://www.cgtn.com | Articles saved as **Newspaper Article** items (CGTN); a pick-list of stories on the home page and section pages |
| `Ukrinform.net.js` | https://www.ukrinform.net (English edition) | Articles saved as **Newspaper Article** items (Ukrinform); a pick-list of stories on the home page and section pages |
| `PressTV.co.uk.js` | https://www.presstv.co.uk (English edition; also presstv.ir and presstv.com addresses) | Articles saved as **Newspaper Article** items (Press TV, with section); a pick-list of stories on the home page and section pages |
| `SCMP.com.js` | https://www.scmp.com (South China Morning Post) | Articles saved as **Newspaper Article** items (author, section, and tags); a pick-list of stories on section pages |
| `NV.ua.js` | https://english.nv.ua (The New Voice of Ukraine, English edition) | Articles saved as **Newspaper Article** items (with section); a pick-list of stories on the home page and section pages |
| `IRNA.ir.js` | https://en.irna.ir (Islamic Republic News Agency, English edition) | Articles saved as **Newspaper Article** items (author, section, tags); a pick-list of stories on the home page and search pages |
| `ChinaMil.com.cn.js` | http://eng.chinamil.com.cn (China Military Online, the PLA Daily English site; it answers on plain `http`) | Articles saved as **Newspaper Article** items; a pick-list of stories on the home page and section pages |

Other-language editions are not covered unless the table says so (RIA, Zvezda, and Rossiyskaya Gazeta are
Russian-language), and neither are Sputnik's other regional editions, which live on other web addresses.

## Before you start

You need two things, both free:

1. The **Zotero desktop app** installed on your computer: https://www.zotero.org/download/
2. The **Zotero Connector** installed in your web browser (the same download page; it adds a
   Zotero button to your browser's toolbar).

Open Zotero at least once so that it creates its folders.

## Installing a translator (about five minutes)

### Step 1: Download the file

1. On this page, click the file you want: the translator for the site you want, for example **`RT.com.js`**.
2. On the page that opens, look for the small **download icon** (an arrow pointing down into a tray)
   near the top right of the file, labeled **Download raw file** when you hover over it. Click it.
3. The file lands in your **Downloads** folder. Make sure its name still ends in **`.js`**
   (for example `RT.com.js`). If your browser added `.txt` to the end, rename the file to remove it.

If your browser shows the code on screen instead of downloading, go back and use the download
icon rather than the **Raw** button.

### Step 2: Open Zotero's translators folder

1. Open the Zotero desktop app.
2. Open its settings: on a Mac, **Zotero → Settings…**; on Windows or Linux, **Edit → Settings**.
3. Click **Advanced**, then the **Files and Folders** tab.
4. Click **Show Data Directory**. A folder opens in Finder or File Explorer.
5. Inside it, open the folder named **`translators`**. It contains hundreds of `.js` files; that is
   normal.

### Step 3: Put the file in that folder

Drag the file you downloaded (for example `RT.com.js`) from Downloads into the **`translators`**
folder. If you are asked whether to replace an existing file with the same name, choose Replace;
that only happens when you are updating to a newer copy.

### Step 4: Quit and reopen Zotero

Zotero only reads this folder when it starts. Quit it completely (Mac: **Zotero → Quit Zotero**;
Windows: **File → Quit**), then open it again.

### Step 5: Tell the browser about the new translator

The Zotero button in your browser keeps its own list of translators. Refresh it:

1. **Right-click** (on a Mac, Control-click) the Zotero button in your browser's toolbar.
2. Choose **Options** (Chrome, Edge, Brave) or **Preferences** (Firefox). A Zotero Connector
   settings page opens.
3. Click the **Advanced** tab, then the **Update Translators** button.

Zotero must be open on your computer while you do this.

### Step 6: Try it

1. With Zotero open, go to any article on one of the sites in the table above.
2. Look at the Zotero button in the toolbar. It should now show a **newspaper icon** instead of a
   plain page icon. (Reload the page if it has not changed yet.)
3. Click the button. The article appears in your Zotero library with its title, date, and other
   details filled in, plus a saved copy of the page.

On a section page or a search results page the button shows a **folder icon**. Clicking it opens a
list of all the stories on that page with checkboxes, so you can save several at once.

## Things to know

- **Saving several stories at once does not keep copies of the pages.** When you use the folder
  icon and tick multiple stories, Zotero records the details of each article but does not save the
  web page itself (this is how the Zotero Connector works, not something these files can change).
  If you need the saved page too, open each article and save it individually, or ask your
  instructor about the "Add Missing Snapshots" plugin, which adds the page copies afterwards.
- **On Sputnik, scrolling past the end of a story loads the next one on the same page.** Zotero
  records the story whose address is showing in the browser's address bar. The saved page copy
  contains every story loaded so far, so for a clean copy save before you scroll on, or open the
  story on its own first.
- **Zotero must be running** on your computer when you save from the browser.
- **If you ever click "Reset Translators"** in Zotero's Advanced settings, these files are deleted
  along with everything else in the folder, and you will need to install them again.

## If it is not working

| What you see | What to check |
|---|---|
| The Zotero button still shows a plain page icon on an article from one of these sites | Confirm the file is inside the `translators` folder and its name ends in `.js`; confirm you fully quit and reopened Zotero; do Step 5 again; reload the page |
| "Update Translators" seems to do nothing | Make sure the Zotero desktop app is open, then try again |
| You cannot find the Options or Preferences entry | In Chrome, you can also open `chrome://extensions`, find Zotero Connector, click **Details**, then **Extension options**. In Firefox, open the menu → **Add-ons and themes**, find Zotero Connector, and open its **Preferences** tab |
| Saving works but no page copy is attached | You saved several items at once; see "Things to know" above |

## For developers

The translators are plain JavaScript files written for the
[zotero/translators](https://github.com/zotero/translators) framework, each with embedded test
cases. To work on them, clone that repository with at least two commits of history, run `npm ci`
with Node 18 or later, copy a translator into the clone's root, and use its tools
(`node .bin/update-metadata.mjs RT.com.js`, `npm run lint -- RT.com.js`,
`node .bin/run-tests.mjs RT.com.js --no-dependents`). If a test fails only because the live page
changed, remove the stale case and recapture it with `node .bin/create-test.mjs RT.com.js --url <url>`.
The [zotero-translator skill](https://github.com/seanlawsonphd/zotero-claude-skills) for Claude Code
documents the full workflow.

`./install.sh [RT.com.js ...]` copies translators into the Zotero data directory on macOS
(`--force` overwrites existing copies).

### Notes on testing the IRNA translator

IRNA's site hands automated browsers a script gate that never completes, so the IRNA test cases were recorded
and run against saved copies of three real pages (an article, the home page, and a search page), served
locally under the real `en.irna.ir` address. The translator has not been tested against the live site by an
automated browser. If you re-run its tests with the standard tools they will fail at that gate, not because of
the translator.

## License

AGPL-3.0, like Zotero and its translators. See [LICENSE](LICENSE).
