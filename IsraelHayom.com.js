{
	"translatorID": "6d51aabd-4a4e-45a5-8fc3-e43fda26754e",
	"label": "IsraelHayom.com",
	"creator": "Sean Lawson",
	"target": "^https?://(www\\.)?israelhayom\\.com/",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2026-10-22 20:16:54"
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

// Articles live at https://www.israelhayom.com/<yyyy>/<mm>/<dd>/<slug>/ (English edition; the site gates automated browsers)
const ARTICLE_URL_RE = /^https?:\/\/(?:www\.)?israelhayom\.com\/\d{4}\/\d{2}\/\d{2}\/[^/?#]+/i;
const EM_TRANSLATOR_ID = '951c027d-74ac-47d4-a107-9c3069ab7b48'; // Embedded Metadata

function detectWeb(doc, url) {
	if (ARTICLE_URL_RE.test(url) && doc.querySelector('h1.jeg_post_title, h1')) {
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
		if (row.closest('header, footer, nav, .jeg_header, .jeg_navbar, .jeg_footer')) continue;
		let title = linkText(row.querySelector('.jeg_post_title, h2, h3, h4') || row);
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
		if (!name || /^(Israel Hayom|Staff|Agencies|Reuters|AP|Associated Press)/i.test(name)) continue;
		creators.push(ZU.cleanAuthor(name, 'author'));
	}
	return creators;
}

// The byline reads "by Amit Segal". The schema.org author is only an internal
// username, so read the visible byline of the article itself.
function getBylines(doc) {
	let byline = doc.querySelector('.jeg_meta_container .jeg_meta_author, .jeg_post_meta .jeg_meta_author');
	if (!byline) return [];
	return ZU.trimInternal(byline.textContent).replace(/^by\s+/i, '').split(/\s*(?:,|\band\b|&)\s*/);
}

async function scrape(doc, url = doc.location.href) {
	let linkedData = getLinkedData(doc); // eslint-disable-line no-unused-vars

	let translator = Zotero.loadTranslator('web');
	translator.setTranslator(EM_TRANSLATOR_ID);
	translator.setDocument(doc);

	translator.setHandler('itemDone', (_obj, item) => {
		let title = text(doc, 'h1.jeg_post_title') || text(doc, 'h1');
		if (title) item.title = ZU.trimInternal(title);

		let published = attr(doc, 'meta[property="article:published_time"]', 'content');
		if (published) item.date = ZU.strToISO(published) || item.date;

		item.creators = toCreators(getBylines(doc));

		let abstractNote = text(doc, '.jeg_post_subtitle');
		if (abstractNote) item.abstractNote = ZU.trimInternal(abstractNote);
		// Some pages repeat the headline as their description
		if (item.abstractNote && item.abstractNote.replace(/[\s\p{P}]+$/u, '') == item.title.replace(/[\s\p{P}]+$/u, '')) {
			delete item.abstractNote;
		}

		let section = attr(doc, 'meta[property="article:section"]', 'content');
		if (section) item.section = ZU.trimInternal(section);

		item.url = attr(doc, 'meta[property="og:url"]', 'content') || url.replace(/[?#].*/, '');
		item.publicationTitle = 'Israel Hayom';
		item.language = 'en';

		let tags = new Set();
		for (let tag of item.tags) {
			tags.add(typeof tag == 'string' ? tag : tag.tag);
		}
		for (let tag of Array.from(doc.querySelectorAll('.jeg_post_tags a, a[rel="tag"]'), el => el.textContent)) {
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
		"url": "https://www.israelhayom.com/2026/10/22/netanyahus-remark-hints-at-when-he-might-step-down/",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "Netanyahu's remark hints at when he might step down",
				"creators": [
					{
						"firstName": "Amit",
						"lastName": "Segal",
						"creatorType": "author"
					}
				],
				"date": "2026-10-22",
				"abstractNote": "The prime minister's comment this week that should have made everyone sit up and take notice. The most consequential strategic decision of Israel's 2026 elections. And why the election that really matters for Israel's future may take place in another country, thousands of miles away.",
				"language": "en",
				"libraryCatalog": "www.israelhayom.com",
				"publicationTitle": "Israel Hayom",
				"section": "Magazine",
				"url": "https://www.israelhayom.com/2026/10/22/netanyahus-remark-hints-at-when-he-might-step-down/",
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
		"url": "https://www.israelhayom.com/",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://www.israelhayom.com/2026/10/21/netanyahu-idf-chief-war-elections-iran/",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "Only one man has an interest in warmongering – and the IDF chief must stand in his way",
				"creators": [
					{
						"firstName": "Yoav",
						"lastName": "Limor",
						"creatorType": "author"
					}
				],
				"date": "2026-10-21",
				"abstractNote": "If the decision rested entirely in Netanyahu's hands, Israel would have launched the third Iran war a long time ago. With the ballot boxes nearly ready, the political battlelines in Israel are increasingly blurring into military ones and the true challenge falls on the military's top brass to separate existential danger from election-year posturing.",
				"language": "en",
				"libraryCatalog": "www.israelhayom.com",
				"publicationTitle": "Israel Hayom",
				"section": "Commentary",
				"url": "https://www.israelhayom.com/2026/10/21/netanyahu-idf-chief-war-elections-iran/",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "10/21"
					},
					{
						"tag": "Benjamin Netanyahu"
					},
					{
						"tag": "Eyal Zamir"
					},
					{
						"tag": "Israel"
					},
					{
						"tag": "defense"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/
