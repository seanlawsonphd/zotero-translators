# Custom Zotero translators for state and state-aligned news sites

These small files teach Zotero how to save articles from the news sites listed below
properly: with the headline, author, date, section, and tags filled in, instead of a bare "Web Page".
Once installed, saving an article works exactly like saving from any other news site: click the
Zotero button in your browser.

### Russia

| File | Outlet and website | What you get |
|---|---|---|
| `RT.com.js` | RT: https://rt-english.com today, formerly www.rt.com (English site at any address) | Articles saved as **Newspaper Article** items; RT shows (video programs) saved as **TV Broadcast** items; a pick-list of stories on section and search pages |
| `TASS.com.js` | TASS: https://tass.com (English) | Articles saved as **Newspaper Article** items; a pick-list of stories on the home page, section pages, and search pages |
| `SputnikGlobe.com.js` | Sputnik International: https://sputnikglobe.com (English) | Articles, videos, infographics, and long reads saved as **Newspaper Article** items; a pick-list of stories on the home page and on section, tag, archive, and search pages |
| `RIA.ru.js` | RIA Novosti: https://ria.ru (Russian) | Articles saved as **Newspaper Article** items; a pick-list of stories on the home page and section pages |
| `TVZvezda.ru.js` | TV Zvezda: https://tvzvezda.ru (Russian) | News items saved as **Newspaper Article** items; a pick-list of stories on the news page |
| `RG.ru.js` | Rossiyskaya Gazeta: https://rg.ru (Russian) | Articles saved as **Newspaper Article** items, with the signed author; a pick-list of stories on the home page and section pages |

### China (including Hong Kong)

| File | Outlet and website | What you get |
|---|---|---|
| `News.cn.js` | Xinhua: https://english.news.cn (English) | Articles saved as **Newspaper Article** items; a pick-list of stories on the home page and section pages |
| `People.cn.js` | People's Daily Online: https://en.people.cn (English) | Articles saved as **Newspaper Article** items, with the byline when there is one; a pick-list of stories on the home page and section pages |
| `GlobalTimes.cn.js` | Global Times: https://www.globaltimes.cn (English) | Articles saved as **Newspaper Article** items, with byline and subtitle; a pick-list of stories on the home page and section pages |
| `ChinaDaily.com.cn.js` | China Daily: https://www.chinadaily.com.cn (English) | Articles saved as **Newspaper Article** items, with the byline when there is one; a pick-list of stories on the home page and section pages |
| `ECNS.cn.js` | China News Service: https://www.ecns.cn (English) | Articles saved as **Newspaper Article** items, with section; a pick-list of stories on the home page and section pages |
| `CGTN.com.js` | CGTN: https://news.cgtn.com and https://www.cgtn.com (English) | Articles saved as **Newspaper Article** items; a pick-list of stories on the home page and section pages |
| `ChinaMil.com.cn.js` | China Military Online, the PLA Daily English site: http://eng.chinamil.com.cn (answers on plain `http`) | Articles saved as **Newspaper Article** items; a pick-list of stories on the home page and section pages |
| `CCTV.com.js` | CCTV English: https://english.cctv.com (articles and videos) | Stories saved as **Newspaper Article** items; a pick-list of stories on the home page and section pages |
| `SCMP.com.js` | South China Morning Post (Hong Kong, privately owned): https://www.scmp.com (English) | Articles saved as **Newspaper Article** items with author, section, and tags; a pick-list of stories on section pages |

### Ukraine

| File | Outlet and website | What you get |
|---|---|---|
| `Ukrinform.net.js` | Ukrinform: https://www.ukrinform.net (English) | Articles saved as **Newspaper Article** items; a pick-list of stories on the home page and section pages |
| `NV.ua.js` | The New Voice of Ukraine (privately owned): https://english.nv.ua (English) | Articles saved as **Newspaper Article** items, with section; a pick-list of stories on the home page and section pages |
| `MOD.gov.ua.js` | Ministry of Defence of Ukraine: https://mod.gov.ua/en (a government site, saved as a news item) | News items saved with section and tags; a pick-list of items on the news page |

### Iran

| File | Outlet and website | What you get |
|---|---|---|
| `IRNA.ir.js` | Islamic Republic News Agency: https://en.irna.ir (English) | Articles saved as **Newspaper Article** items with author, section, and tags; a pick-list of stories on the home page and search pages |
| `PressTV.co.uk.js` | Press TV: https://www.presstv.co.uk (English; presstv.ir and presstv.com addresses also work) | Articles saved as **Newspaper Article** items, with section; a pick-list of stories on the home page and section pages |
| `TehranTimes.com.js` | Tehran Times: https://www.tehrantimes.com (English) | Articles saved as **Newspaper Article** items, with section; a pick-list of stories on the home page and section pages |
| `TasnimNews.ir.js` | Tasnim News Agency: https://www.tasnimnews.ir/en (English; the address is .ir, not .com) | Articles saved as **Newspaper Article** items, with section; a pick-list of stories on the English home page and section pages |
| `FarsNews.ir.js` | Fars News Agency: https://farsnews.ir, English stories listed at https://farsnews.ir/showcase?lang=en (the site is Persian-first) | English stories saved as **Newspaper Article** items, with the author; a pick-list on the English showcase page. Persian pages are not saved |

### Israel

| File | Outlet and website | What you get |
|---|---|---|
| `IsraelNationalNews.com.js` | Arutz Sheva / Israel National News (religious-Zionist right): https://www.israelnationalnews.com (English) | Articles saved as **Newspaper Article** items, with author and section; a pick-list of stories on the home page and section pages |
| `C14News.com.js` | Channel 14 (pro-Netanyahu): https://www.c14news.com (English edition) | Articles saved as **Newspaper Article** items, with author and tags; a pick-list of stories on the home page and section pages |
| `I24News.tv.js` | i24NEWS: https://www.i24news.tv/en | Articles saved as **Newspaper Article** items, with section; a pick-list of stories on the home page and section pages |
| `IsraelHayom.com.js` | Israel Hayom (pro-Netanyahu): https://www.israelhayom.com (English) | Articles saved as **Newspaper Article** items, with the byline, section, and subtitle; a pick-list of stories on the home page and section pages |

Kan (Israel's public broadcaster) is not included: its English content is radio on the Reka network, not
written articles. Israel Hayom's site gates automated browsers, so its tests were recorded and run with the
tooling's `--headed` option (a visible Chrome window); saving from your own browser is unaffected.

Other-language editions are not covered unless the table says so (RIA, Zvezda, and Rossiyskaya Gazeta are
Russian-language), and neither are Sputnik's other regional editions, which live on other web addresses.

China Media Group is not included on purpose: it is a holding company for outlets such as CCTV and CGTN, not a news
source of its own. CGTN is covered above.

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
