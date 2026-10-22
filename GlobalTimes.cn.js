{
	"translatorID": "8a95f91d-cfee-471f-a4cb-9c50475fea0b",
	"label": "GlobalTimes.cn",
	"creator": "Sean Lawson",
	"target": "^https?://(www\\.)?globaltimes\\.cn/",
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

// Articles live at https://www.globaltimes.cn/page/<yyyymm>/<id>.shtml
const ARTICLE_URL_RE = /^https?:\/\/(?:www\.)?globaltimes\.cn\/page\/\d{6}\/\d+\.shtml/i;
const EM_TRANSLATOR_ID = '951c027d-74ac-47d4-a107-9c3069ab7b48'; // Embedded Metadata

function detectWeb(doc, url) {
	if (ARTICLE_URL_RE.test(url) && doc.querySelector('.article_title')) {
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
		if (row.closest('header, footer, nav, .nav, #nav')) continue;
		let title = linkText(row.querySelector('.new_title_s, .list_title, h1, h2, h3, h4, [class*=title]') || row);
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
		if (!name || /^(Global Times|GT|Xinhua|Agencies|Staff|Global Times staff)/i.test(name)) continue;
		// Chinese bylines put the family name first, and China Daily capitalizes whole names
		if (name == name.toUpperCase()) name = name.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
		let [family, ...given] = name.split(' ');
		creators.push(given.length
			? { lastName: family, firstName: given.join(' '), creatorType: 'author' }
			: { lastName: family, creatorType: 'author', fieldMode: 1 });
	}
	return creators;
}

async function scrape(doc, url = doc.location.href) {
	let linkedData = getLinkedData(doc); // eslint-disable-line no-unused-vars

	let translator = Zotero.loadTranslator('web');
	translator.setTranslator(EM_TRANSLATOR_ID);
	translator.setDocument(doc);

	translator.setHandler('itemDone', (_obj, item) => {
		let title = text(doc, '.article_title') || attr(doc, 'meta[name="twitter:title"]', 'content');
		if (title) item.title = ZU.trimInternal(title);

		let published = ((text(doc, '.pub_time') || '').match(/[A-Z][a-z]+ \d{1,2}, \d{4}/) || [''])[0];
		if (published) item.date = ZU.strToISO(published) || item.date;

		item.creators = toCreators((text(doc, '.byline') || '').replace(/^\s*By\s+/i, '').split(/\s*(?:,|\band\b|&)\s*/));

		let abstractNote = text(doc, '.article_subtitle');
		if (abstractNote) item.abstractNote = ZU.trimInternal(abstractNote);
		// Some pages repeat the headline as their description
		if (item.abstractNote && item.abstractNote.replace(/[\s\p{P}]+$/u, '') == item.title.replace(/[\s\p{P}]+$/u, '')) {
			delete item.abstractNote;
		}

		let section = '';
		if (section) item.section = ZU.trimInternal(section);

		item.url = attr(doc, 'meta[property="og:url"]', 'content') || url.replace(/[?#].*/, '');
		item.publicationTitle = 'Global Times';
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
		"url": "https://www.globaltimes.cn/page/202610/1372829.shtml",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "Xi calls for new achievements on new Long March",
				"creators": [
					{
						"lastName": "Feng",
						"firstName": "Fan",
						"creatorType": "author"
					},
					{
						"lastName": "Sun",
						"firstName": "Langchen",
						"creatorType": "author"
					}
				],
				"date": "2026-10-22",
				"abstractNote": "‘Only by remembering history can we create a brighter future’",
				"language": "en",
				"libraryCatalog": "www.globaltimes.cn",
				"publicationTitle": "Global Times",
				"url": "https://www.globaltimes.cn/page/202610/1372829.shtml",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "china"
					},
					{
						"tag": "long"
					},
					{
						"tag": "march"
					},
					{
						"tag": "military"
					},
					{
						"tag": "red"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://www.globaltimes.cn/china/index.html",
		"items": "multiple"
	}
]
/** END TEST CASES **/
