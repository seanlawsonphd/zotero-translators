{
	"translatorID": "514174bb-7adc-4f01-8798-2cb5460002c6",
	"label": "CGTN.com",
	"creator": "Sean Lawson",
	"target": "^https?://(news|www)\\.cgtn\\.com/",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2026-10-22 18:27:44"
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

// Articles live at https://news.cgtn.com/news/<yyyy-mm-dd>/<slug>-<id>/p.html (English edition)
const ARTICLE_URL_RE = /^https?:\/\/(?:news|www)\.cgtn\.com\/news\/\d{4}-\d{2}-\d{2}\/[^/?#]+\/(?:p|index)\.html/i;
const EM_TRANSLATOR_ID = '951c027d-74ac-47d4-a107-9c3069ab7b48'; // Embedded Metadata

function detectWeb(doc, url) {
	if (ARTICLE_URL_RE.test(url) && doc.querySelector('h1')) {
		return 'newspaperArticle';
	}
	else if (getSearchResults(doc, true)) {
		return 'multiple';
	}
	return false;
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

function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	var rows = doc.querySelectorAll('a[href]');
	for (let row of rows) {
		let href = row.href;
		if (!ARTICLE_URL_RE.test(href) || items[href]) continue;
		// Skip site chrome, which previews stories on every page
		if (row.closest('header, footer, nav')) continue;
		let title = linkText(row.querySelector('h1, h2, h3, h4, .news-title') || row);
		// Video thumbnails link to the story with just a duration as text
		if (!title || /^\d{1,2}:\d{2}(:\d{2})?$/.test(title)) continue;
		if (checkOnly) return true;
		found = true;
		items[href] = title;
	}
	return found ? items : false;
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

// The article's schema.org entry, with @graph containers flattened
function getLinkedData(doc) {
	for (let script of doc.querySelectorAll('script[type="application/ld+json"]')) {
		try {
			let data = JSON.parse(script.textContent);
			for (let entry of [].concat(data)) {
				if (!entry) continue;
				for (let candidate of [].concat(entry['@graph'] || entry)) {
					if (candidate && /Article$/.test([].concat(candidate['@type'])[0] || '')) {
						return candidate;
					}
				}
			}
		}
		catch (e) {
			// skip malformed blocks
		}
	}
	return null;
}

// Personal names only: organization bylines would become bogus authors
function toCreators(names) {
	let creators = [];
	for (let name of names) {
		name = ZU.trimInternal(name || '');
		if (!name || /^(CGTN|Xinhua)/i.test(name)) continue;
		creators.push(ZU.cleanAuthor(name, 'author'));
	}
	return creators;
}

async function scrape(doc, url = doc.location.href) {
	let linkedData = getLinkedData(doc); // eslint-disable-line no-unused-vars

	let translator = Zotero.loadTranslator('web');
	translator.setTranslator(EM_TRANSLATOR_ID);
	translator.setDocument(doc);

	translator.setHandler('itemDone', (_obj, item) => {
		let title = text(doc, 'h1') || (linkedData && linkedData.headline);
		if (title) item.title = ZU.trimInternal(title);

		let published = linkedData && linkedData.datePublished;
		if (published) item.date = ZU.strToISO(published) || item.date;

		item.creators = toCreators([text(doc, '.news-author-name')]);

		let abstractNote = '';
		if (abstractNote) item.abstractNote = ZU.trimInternal(abstractNote);
		// Some pages repeat the headline as their description
		if (item.abstractNote && item.abstractNote.replace(/[\s\p{P}]+$/u, '') == item.title.replace(/[\s\p{P}]+$/u, '')) {
			delete item.abstractNote;
		}

		let section = '';
		if (section) item.section = ZU.trimInternal(section);

		item.url = attr(doc, 'meta[property="og:url"]', 'content') || url.replace(/[?#].*/, '');
		item.publicationTitle = 'CGTN';
		item.language = 'en';

		let tags = new Set();
		for (let tag of item.tags) {
			tags.add(typeof tag == 'string' ? tag : tag.tag);
		}
		for (let tag of []) {
			tag = ZU.trimInternal(tag || '');
			if (tag) tags.add(tag);
		}
		item.tags = Array.from(tags, tag => ({ tag }));

		item.complete();
	});

	let em = await translator.getTranslatorObject();
	em.itemType = 'newspaperArticle';
	await em.doWeb(doc, url);
}

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://news.cgtn.com/news/2026-10-22/China-holds-gathering-to-mark-90th-anniversary-of-Long-March-victory-1RrvECp6XOo/p.html",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "Xi Jinping calls for new achievements on new Long March",
				"creators": [],
				"date": "2026-10-22",
				"abstractNote": "Chinese President Xi Jinping on Thursday called for new achievements on the new Long March as China commemorates the 90th anniversary of the victory of the Red Army's Long March.",
				"language": "en",
				"libraryCatalog": "news.cgtn.com",
				"publicationTitle": "CGTN",
				"url": "https://news.cgtn.com/news/2026-10-22/China-holds-gathering-to-mark-90th-anniversary-of-Long-March-victory-1RrvECp6XOo/p.html",
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
		"url": "https://www.cgtn.com/china",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://news.cgtn.com/news/2026-10-11/China-Weekly-News-Quiz-October-5-11-2026-1R9pZ5GgmL6/p.html",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "China Weekly News Quiz: October 5-11, 2026",
				"creators": [
					{
						"firstName": "Moosa",
						"lastName": "Abbas",
						"creatorType": "author"
					}
				],
				"date": "2026-10-11",
				"abstractNote": "Do you know what happened in China last week? Take our weekly news quiz to test your knowledge and get up to speed on the latest developments in case you missed something.",
				"language": "en",
				"libraryCatalog": "news.cgtn.com",
				"publicationTitle": "CGTN",
				"shortTitle": "China Weekly News Quiz",
				"url": "https://news.cgtn.com/news/2026-10-11/China-Weekly-News-Quiz-October-5-11-2026-1R9pZ5GgmL6/p.html",
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
	}
]
/** END TEST CASES **/
