{
	"translatorID": "f2d4274a-5229-434c-90a9-88dc73767214",
	"label": "People.cn",
	"creator": "Sean Lawson",
	"target": "^https?://en\\.people\\.cn/",
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

// Articles live at https://en.people.cn/n3/<yyyy>/<mmdd>/c<channel>-<id>.html (People's Daily Online English edition)
const ARTICLE_URL_RE = /^https?:\/\/en\.people\.cn\/n3\/\d{4}\/\d{4}\/c\d+-\d+\.html/i;
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
		let title = linkText(row.querySelector('h1, h2, h3, h4, .tit') || row);
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
		if (!name || /^(People's Daily|People's Daily Online|Xinhua)\b/i.test(name)) continue;
		// Chinese bylines put the family name first, and China Daily capitalizes whole names
		if (name == name.toUpperCase()) name = name.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
		let [family, ...given] = name.split(' ');
		creators.push(given.length
			? { lastName: family, firstName: given.join(' '), creatorType: 'author' }
			: { lastName: family, creatorType: 'author', fieldMode: 1 });
	}
	return creators;
}

// The line under the headline reads "By Yu Guangjun (People's Daily) 10:54, October 22, 2026"
function getByline(doc) {
	let origin = doc.querySelector('.origin');
	if (!origin) return [];
	let clone = origin.cloneNode(true);
	for (let child of clone.querySelectorAll('span')) {
		child.remove();
	}
	let match = ZU.trimInternal(clone.textContent).match(/^By\s+(.+?)(?:\s*\(.*\))?$/i);
	return match ? match[1].split(/\s*(?:,|\band\b|&)\s*/) : [];
}

async function scrape(doc, url = doc.location.href) {
	let linkedData = getLinkedData(doc); // eslint-disable-line no-unused-vars

	let translator = Zotero.loadTranslator('web');
	translator.setTranslator(EM_TRANSLATOR_ID);
	translator.setDocument(doc);

	translator.setHandler('itemDone', (_obj, item) => {
		let title = text(doc, 'h1');
		if (title) item.title = ZU.trimInternal(title);

		let published = ((text(doc, '.origin') || '').match(/[A-Z][a-z]+ \d{1,2}, \d{4}/) || [''])[0];
		if (published) item.date = ZU.strToISO(published) || item.date;

		item.creators = toCreators(getByline(doc));

		let abstractNote = '';
		if (abstractNote) item.abstractNote = ZU.trimInternal(abstractNote);
		// Some pages repeat the headline as their description
		if (item.abstractNote && item.abstractNote.replace(/[\s\p{P}]+$/u, '') == item.title.replace(/[\s\p{P}]+$/u, '')) {
			delete item.abstractNote;
		}

		let section = '';
		if (section) item.section = ZU.trimInternal(section);

		item.url = attr(doc, 'meta[property="og:url"]', 'content') || url.replace(/[?#].*/, '');
		item.publicationTitle = "People's Daily Online";
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
		"url": "https://en.people.cn/n3/2026/1022/c90000-20511223.html",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "Grassland city in N China's Inner Mongolia transforms into an AI computing hub",
				"creators": [
					{
						"lastName": "Yu",
						"firstName": "Guangjun",
						"creatorType": "author"
					}
				],
				"date": "2026-10-22",
				"abstractNote": "Swans glide across the waters of Chahannur National Wetland Park in Shangdu county, Ulanqab, north",
				"language": "en",
				"libraryCatalog": "en.people.cn",
				"publicationTitle": "People's Daily Online",
				"url": "https://en.people.cn/n3/2026/1022/c90000-20511223.html",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "computing"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://en.people.cn/90785/index.html",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://en.people.cn/n3/2026/1022/c90000-20511046.html",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "Cargo throughput of Pinglu Canal surpasses 1 mln tonnes in S China's Guangxi",
				"creators": [],
				"date": "2026-10-22",
				"abstractNote": "An aerial drone photo taken on Oct. 21, 2026 shows cargo vessels passing through the Madao hub on t",
				"language": "en",
				"libraryCatalog": "en.people.cn",
				"publicationTitle": "People's Daily Online",
				"url": "https://en.people.cn/n3/2026/1022/c90000-20511046.html",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "Pinglu Canal"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/
