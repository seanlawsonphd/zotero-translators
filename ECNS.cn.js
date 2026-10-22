{
	"translatorID": "70ca90e3-2a2b-487b-94d1-d66f2f5df130",
	"label": "ECNS.cn",
	"creator": "Sean Lawson",
	"target": "^https?://(www\\.)?ecns\\.cn/",
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

// Articles live at https://www.ecns.cn/<section>/<yyyy-mm-dd>/detail-<id>.shtml (China News Service English edition)
const ARTICLE_URL_RE = /^https?:\/\/(?:www\.)?ecns\.cn\/[a-z-]+\/\d{4}-\d{2}-\d{2}\/detail-[a-z0-9]+\.shtml/i;
const EM_TRANSLATOR_ID = '951c027d-74ac-47d4-a107-9c3069ab7b48'; // Embedded Metadata

function detectWeb(doc, url) {
	if (ARTICLE_URL_RE.test(url) && doc.querySelector('h1.contitle, #contitle')) {
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
		let title = linkText(row.querySelector('h1, h2, h3, h4, .title') || row);
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
		if (!name || /^$/i.test(name)) continue;
		creators.push(ZU.cleanAuthor(name, 'author'));
	}
	return creators;
}

// The breadcrumb above the headline reads "Home / China"
function getSection(doc) {
	let headline = doc.querySelector('#contitle');
	let trail = headline && headline.previousElementSibling;
	let crumbs = trail ? trail.querySelectorAll('span') : [];
	return crumbs.length > 1 ? crumbs[crumbs.length - 1].textContent : '';
}

async function scrape(doc, url = doc.location.href) {
	let linkedData = getLinkedData(doc); // eslint-disable-line no-unused-vars

	let translator = Zotero.loadTranslator('web');
	translator.setTranslator(EM_TRANSLATOR_ID);
	translator.setDocument(doc);

	translator.setHandler('itemDone', (_obj, item) => {
		let title = text(doc, '#contitle') || attr(doc, 'meta[name="twitter:title"]', 'content');
		if (title) item.title = ZU.trimInternal(title);

		let published = ((text(doc, '.downinfo') || '').match(/\d{4}-\d{2}-\d{2}/) || [''])[0];
		if (published) item.date = ZU.strToISO(published) || item.date;

		item.creators = toCreators([]);

		let abstractNote = '';
		if (abstractNote) item.abstractNote = ZU.trimInternal(abstractNote);
		// Some pages repeat the headline as their description
		if (item.abstractNote && item.abstractNote.replace(/[\s\p{P}]+$/u, '') == item.title.replace(/[\s\p{P}]+$/u, '')) {
			delete item.abstractNote;
		}

		let section = getSection(doc);
		if (section) item.section = ZU.trimInternal(section);

		item.url = attr(doc, 'meta[property="og:url"]', 'content') || url.replace(/[?#].*/, '');
		item.publicationTitle = 'China News Service';
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
		"url": "https://www.ecns.cn/china/2026-10-22/detail-ihfmiwhm0739857.shtml",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "Xi calls for new achievements on new Long March",
				"creators": [],
				"date": "2026-10-22",
				"language": "en",
				"libraryCatalog": "www.ecns.cn",
				"publicationTitle": "China News Service",
				"section": "China",
				"url": "https://www.ecns.cn/china/2026-10-22/detail-ihfmiwhm0739857.shtml",
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
		"url": "https://www.ecns.cn/cns-wire/2026-10-22/detail-ihfmiwhm0740810.shtml",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "Magnitude-7.0 earthquake jolts China's Xizang: CENC",
				"creators": [],
				"date": "2026-10-22",
				"language": "en",
				"libraryCatalog": "www.ecns.cn",
				"publicationTitle": "China News Service",
				"section": "Ecns wire",
				"shortTitle": "Magnitude-7.0 earthquake jolts China's Xizang",
				"url": "https://www.ecns.cn/cns-wire/2026-10-22/detail-ihfmiwhm0740810.shtml",
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
		"url": "https://www.ecns.cn/news/",
		"items": "multiple"
	}
]
/** END TEST CASES **/
