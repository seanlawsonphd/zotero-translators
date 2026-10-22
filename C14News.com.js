{
	"translatorID": "84110710-2d82-4239-bcf8-b1f82c67563d",
	"label": "C14News.com",
	"creator": "Sean Lawson",
	"target": "^https?://(www\\.)?c14news\\.com/",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2026-10-22 20:11:21"
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

// Articles live at https://www.c14news.com/article/<id> (Channel 14 / C14, English edition)
const ARTICLE_URL_RE = /^https?:\/\/(?:www\.)?c14news\.com\/article\/\d+/i;
const EM_TRANSLATOR_ID = '951c027d-74ac-47d4-a107-9c3069ab7b48'; // Embedded Metadata

function detectWeb(doc, url) {
	if (ARTICLE_URL_RE.test(url) && (doc.querySelector('h1') || getLinkedData(doc))) {
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
		let title = linkText(row.querySelector('h2, h3, h4, [class*=title]') || row);
		// Video thumbnails link to the story with just a duration as text, and comment counts are links too
		if (!title || /^(?:\d+|\d{1,2}:\d{2}(:\d{2})?)$/.test(title)) continue;
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
	for (let noscript of clone.querySelectorAll('noscript, script, style')) {
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

// Personal authors from the schema.org entry; shared bylines read "A & B"
function getLinkedAuthors(linkedData) {
	if (!linkedData || !linkedData.author) return [];
	return [].concat(linkedData.author)
		.filter(author => author['@type'] == 'Person')
		.flatMap(author => author.name.split(/\s*(?:,|\band\b|&)\s*/));
}

async function scrape(doc, url = doc.location.href) {
	let linkedData = getLinkedData(doc); // eslint-disable-line no-unused-vars

	let translator = Zotero.loadTranslator('web');
	translator.setTranslator(EM_TRANSLATOR_ID);
	translator.setDocument(doc);

	translator.setHandler('itemDone', (_obj, item) => {
		let title = (linkedData && linkedData.headline) || text(doc, 'h1');
		if (title) item.title = ZU.trimInternal(title);

		let published = linkedData && linkedData.datePublished;
		if (published) item.date = ZU.strToISO(published) || item.date;

		item.creators = toCreators(getLinkedAuthors(linkedData));

		let abstractNote = '';
		if (abstractNote) item.abstractNote = ZU.trimInternal(abstractNote);
		// Some pages repeat the headline as their description
		if (item.abstractNote && item.abstractNote.replace(/[\s\p{P}]+$/u, '') == item.title.replace(/[\s\p{P}]+$/u, '')) {
			delete item.abstractNote;
		}

		let section = '';
		if (section) item.section = ZU.trimInternal(section);

		item.url = attr(doc, 'meta[property="og:url"]', 'content') || url.replace(/[?#].*/, '');
		item.publicationTitle = 'Channel 14 (C14)';
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
		"url": "https://c14news.com/article/1512212",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "Trump Confirms Israel Is Aiding the Saudis Against the Houthis",
				"creators": [
					{
						"firstName": "Golan",
						"lastName": "Israel",
						"creatorType": "author"
					}
				],
				"date": "2026-10-17",
				"abstractNote": "President Trump told reporters that Israel is providing assistance to Saudi Arabia in its military campaign against the Houthi terrorists, and hinted that normalization between the two countries could be closer \"than ever before.\"",
				"language": "en",
				"libraryCatalog": "c14news.com",
				"publicationTitle": "Channel 14 (C14)",
				"url": "https://www.c14news.com/article/1512212",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "Abraham Accords"
					},
					{
						"tag": "Houthis"
					},
					{
						"tag": "Israel"
					},
					{
						"tag": "Saudi Arabia"
					},
					{
						"tag": "Trump"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://c14news.com/article/1513015",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "EXCLUSIVE: Netanyahu Slams “Fake Right” Bennett and Liberman",
				"creators": [
					{
						"firstName": "Golan",
						"lastName": "Israel",
						"creatorType": "author"
					}
				],
				"date": "2026-10-19",
				"abstractNote": "In an exclusive interview with C14's Sophia Tupolev, Prime Minister Netanyahu criticized Israel’s “fake right,” which he says serves the goals of the left and the Muslim Brotherhood, and warned that Gadi Eisenkot and Yair Golan would lay the groundwork for a ‘Palestinian’ state.",
				"language": "en",
				"libraryCatalog": "c14news.com",
				"publicationTitle": "Channel 14 (C14)",
				"shortTitle": "EXCLUSIVE",
				"url": "https://www.c14news.com/article/1513015",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "Bennett"
					},
					{
						"tag": "Election"
					},
					{
						"tag": "Liberman"
					},
					{
						"tag": "Netanyahu"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://c14news.com/",
		"items": "multiple"
	}
]
/** END TEST CASES **/
