{
	"translatorID": "1fd67174-5362-4ea7-8b89-1389b50427c5",
	"label": "TASS.com",
	"creator": "Sean Lawson",
	"target": "^https?://(www\\.)?tass\\.com/",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2026-10-09 16:58:38"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2026 Sean Lawson

	This file is part of Zotero.

	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/

// Articles live at https://tass.com/<section>/<id>
const ARTICLE_URL_RE = /^https?:\/\/(?:www\.)?tass\.com\/[a-z-]+\/\d{5,}(?:[/?#]|$)/i;

// Embedded Metadata
const EM_TRANSLATOR_ID = '951c027d-74ac-47d4-a107-9c3069ab7b48';

function detectWeb(doc, url) {
	if (ARTICLE_URL_RE.test(url) && (doc.querySelector('h1.news-header__title') || getLinkedData(doc))) {
		return 'newspaperArticle';
	}
	else if (getSearchResults(doc, true)) {
		return 'multiple';
	}
	return false;
}

function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	var rows = doc.querySelectorAll('a[href]');
	for (let row of rows) {
		let href = row.href;
		if (!ARTICLE_URL_RE.test(href) || items[href]) continue;
		// Skip the hidden "Sections" mega-menu and the news-feed panel, which
		// preview stories on every page
		if (row.closest('.menu__content, .news-feed, header')) continue;
		// Story cards wrap the headline, lead and date in a single link, so
		// prefer the headline element when there is one
		let title = linkText(row.querySelector('.news-content__title, .news-feed-item__title, .news-preview__title') || row);
		if (!title) continue;
		if (checkOnly) return true;
		found = true;
		items[href] = title;
	}
	return found ? items : false;
}

async function doWeb(doc, url) {
	if (detectWeb(doc, url) == 'multiple') {
		let items = await Zotero.selectItems(getSearchResults(doc, false));
		if (!items) return;
		for (let url of Object.keys(items)) {
			await scrape(await requestDocument(url));
		}
	}
	else {
		await scrape(doc, url);
	}
}

async function scrape(doc, url = doc.location.href) {
	let linkedData = getLinkedData(doc);

	let translator = Zotero.loadTranslator('web');
	translator.setTranslator(EM_TRANSLATOR_ID);
	translator.setDocument(doc);

	translator.setHandler('itemDone', (_obj, item) => {
		let headline = (linkedData && linkedData.headline) || text(doc, 'h1.news-header__title');
		if (headline) item.title = ZU.trimInternal(headline);

		let published = linkedData && linkedData.datePublished;
		if (published) item.date = ZU.strToISO(published);

		// TASS stories are unsigned agency copy, and the page metadata only
		// names the agency itself
		item.creators = [];

		// The lead under the headline makes a better abstract than the meta
		// description
		let lead = text(doc, '.news-header__lead');
		if (lead) item.abstractNote = ZU.trimInternal(lead);

		item.publicationTitle = 'TASS';

		let section = getSection(doc, url);
		if (section) item.section = section;

		let canonical = linkedData && linkedData.mainEntityOfPage && linkedData.mainEntityOfPage['@id'];
		item.url = canonical
			|| attr(doc, 'meta[property="og:url"]', 'content')
			|| url.replace(/[?#].*/, '');

		// The English edition declares no language in its markup
		if (!item.language) item.language = 'en';

		let tags = new Set();
		for (let tag of item.tags) {
			tags.add(typeof tag == 'string' ? tag : tag.tag);
		}
		for (let link of doc.querySelectorAll('a.tags__item')) {
			let tag = ZU.trimInternal(link.textContent);
			if (tag) tags.add(tag);
		}
		item.tags = Array.from(tags, tag => ({ tag }));

		item.complete();
	});

	let em = await translator.getTranslatorObject();
	em.itemType = 'newspaperArticle';
	await em.doWeb(doc, url);
}

// Every schema.org entry on the page, with @graph containers flattened
function getLinkedDataEntries(doc) {
	let entries = [];
	for (let script of doc.querySelectorAll('script[type="application/ld+json"]')) {
		try {
			let data = JSON.parse(script.textContent);
			for (let entry of [].concat(data)) {
				if (!entry) continue;
				entries.push(...[].concat(entry['@graph'] || entry));
			}
		}
		catch (e) {
			// skip malformed blocks
		}
	}
	return entries;
}

// TASS embeds a schema.org NewsArticle block on every story
function getLinkedData(doc) {
	return getLinkedDataEntries(doc).find(entry => entry && entry['@type'] == 'NewsArticle') || null;
}

// The section name comes from the site navigation entries in the page's
// schema.org data, matched on the first path segment of the article URL
// (/politics/… is "Russian Politics & Diplomacy"). The <title> suffix
// ("Headline - Section - TASS") is the fallback.
function getSection(doc, url) {
	let segment = url.match(/^https?:\/\/(?:www\.)?tass\.com\/([a-z-]+)\/\d/i);
	if (segment) {
		for (let entry of getLinkedDataEntries(doc)) {
			if (entry && entry['@type'] == 'SiteNavigationElement' && entry.url && entry.name
				&& entry.url.replace(/\/+$/, '').endsWith('/' + segment[1])) {
				return ZU.trimInternal(entry.name);
			}
		}
	}
	let parts = doc.title.split(/\s+-\s+/);
	if (parts.length >= 3) return ZU.trimInternal(parts[parts.length - 2]);
	return '';
}

// Text of a link without its <noscript> fallbacks, which browsers expose as
// raw markup in textContent (lazy-loaded images are wrapped that way)
function linkText(link) {
	let clone = link.cloneNode(true);
	for (let noscript of clone.querySelectorAll('noscript')) {
		noscript.remove();
	}
	return ZU.trimInternal(clone.textContent);
}

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://tass.com/politics/2199859",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "Putin delivers statements on Caspian Sea’s digital twin, ecosystem protection",
				"creators": [],
				"date": "2026-10-09",
				"abstractNote": "The Russian president emphasized that Moscow attaches the highest priority to working with partners to protect the Caspian Sea’s ecosystem",
				"language": "en",
				"libraryCatalog": "tass.com",
				"publicationTitle": "TASS",
				"section": "Russian Politics & Diplomacy",
				"url": "https://tass.com/politics/2199859",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "Caspian Sea"
					},
					{
						"tag": "Foreign policy"
					},
					{
						"tag": "Vladimir Putin"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://tass.com/pressreview/2199671",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "Press review: Kiev may step up Russia strikes as Rubio urges EU to put its interests first",
				"creators": [],
				"date": "2026-10-09",
				"abstractNote": "Top stories from the Russian press on Friday, October 9th",
				"language": "en",
				"libraryCatalog": "tass.com",
				"publicationTitle": "TASS",
				"section": "Press Review",
				"shortTitle": "Press review",
				"url": "https://tass.com/pressreview/2199671",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://tass.com/politics",
		"items": "multiple"
	}
]
/** END TEST CASES **/
