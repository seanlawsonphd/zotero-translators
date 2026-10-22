{
	"translatorID": "32bb88bb-6e52-40be-b224-afdbd3940745",
	"label": "SCMP.com",
	"creator": "Sean Lawson",
	"target": "^https?://(www\\.)?scmp\\.com/",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2026-10-22 19:21:45"
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

// Articles live at https://www.scmp.com/<section>/<subsection>/article/<id>/<slug>
const ARTICLE_URL_RE = /^https?:\/\/(?:www\.)?scmp\.com\/(?:[a-z0-9-]+\/)+article\/\d+\/[^/?#]+/i;
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
		let title = linkText(row.querySelector('h2, h3, h4, [class*=headline]') || row);
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

// Personal authors from the schema.org entry, falling back to the Cxense author meta tag
function getAuthors(doc, linkedData) {
	let names = linkedData && linkedData.author
		? [].concat(linkedData.author).filter(author => author['@type'] == 'Person').map(author => author.name)
		: [];
	if (!names.length) {
		let meta = attr(doc, 'meta[name="cXenseParse:author"]', 'content');
		if (meta) names = meta.split(/\s*(?:,|\band\b|&)\s*/);
	}
	return names;
}

async function scrape(doc, url = doc.location.href) {
	let linkedData = getLinkedData(doc); // eslint-disable-line no-unused-vars

	let translator = Zotero.loadTranslator('web');
	translator.setTranslator(EM_TRANSLATOR_ID);
	translator.setDocument(doc);

	translator.setHandler('itemDone', (_obj, item) => {
		let title = ((linkedData && linkedData.headline) || text(doc, 'h1')).replace(/^(?:Exclusive|Explainer|Analysis|Opinion|Editorial|Scoop)\s*\|\s*/, '');
		if (title) item.title = ZU.trimInternal(title);

		let published = (linkedData && linkedData.datePublished) || attr(doc, 'meta[property="article:published_time"]', 'content');
		if (published) item.date = ZU.strToISO(published) || item.date;

		item.creators = toCreators(getAuthors(doc, linkedData));

		let abstractNote = linkedData && linkedData.description;
		if (abstractNote) item.abstractNote = ZU.trimInternal(abstractNote);
		// Some pages repeat the headline as their description
		if (item.abstractNote && item.abstractNote.replace(/[\s\p{P}]+$/u, '') == item.title.replace(/[\s\p{P}]+$/u, '')) {
			delete item.abstractNote;
		}

		let section = (linkedData && typeof linkedData.articleSection == 'string') ? linkedData.articleSection : '';
		if (section) item.section = ZU.trimInternal(section);

		item.url = attr(doc, 'meta[property="og:url"]', 'content') || url.replace(/[?#].*/, '');
		item.publicationTitle = 'South China Morning Post';
		item.language = 'en';

		let tags = new Set();
		for (let tag of item.tags) {
			tags.add(typeof tag == 'string' ? tag : tag.tag);
		}
		for (let tag of Array.from(doc.querySelectorAll('meta[property="article:tag"]'), el => el.getAttribute('content'))) {
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
		"url": "https://www.scmp.com/news/us/diplomacy/article/3371804/quad-confirmed-manila-envoy-signals-likely-squad-talks-trump-xi-summit",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "Quad confirmed, Manila envoy signals likely ‘Squad’ talks before Trump-Xi summit",
				"creators": [
					{
						"firstName": "Nayan",
						"lastName": "Seth",
						"creatorType": "author"
					}
				],
				"date": "2026-10-22",
				"abstractNote": "Philippine ambassador to the US Jose Manuel Romualdez also says he hopes Asean will become like Nato, capable of handling its own security.",
				"language": "en",
				"libraryCatalog": "www.scmp.com",
				"publicationTitle": "South China Morning Post",
				"section": "Diplomacy",
				"url": "https://www.scmp.com/news/us/diplomacy/article/3371804/quad-confirmed-manila-envoy-signals-likely-squad-talks-trump-xi-summit",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "2026 Xi-Trump summits"
					},
					{
						"tag": "Asean"
					},
					{
						"tag": "China"
					},
					{
						"tag": "China-Asean relations"
					},
					{
						"tag": "China-Philippines relations"
					},
					{
						"tag": "Ferdinand Marcos Jnr"
					},
					{
						"tag": "Gilberto Teodoro Jnr"
					},
					{
						"tag": "Jose Manuel Romualdez"
					},
					{
						"tag": "Marco Rubio"
					},
					{
						"tag": "Quadrilateral Security Dialogue"
					},
					{
						"tag": "Quadrilateral Security Dialogue (The Quad)"
					},
					{
						"tag": "SCMP Exclusives"
					},
					{
						"tag": "Shenzhen"
					},
					{
						"tag": "South China Sea"
					},
					{
						"tag": "Taiwan"
					},
					{
						"tag": "The Philippines"
					},
					{
						"tag": "US-Asean relations"
					},
					{
						"tag": "United States"
					},
					{
						"tag": "Xi Jinping"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://www.scmp.com/news/china/military/article/3371799/could-us-advances-drone-command-give-it-edge-over-pla-taiwan-conflict?module=top_story&pgtype=section#comments",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "Could US advances in drone command give it an edge over the PLA in a Taiwan conflict?",
				"creators": [
					{
						"firstName": "Gabriel",
						"lastName": "Dominguez",
						"creatorType": "author"
					}
				],
				"date": "2026-10-22",
				"abstractNote": "F-22 and aircraft carrier tests showcase new ways to command drones that could redefine air and naval warfare.",
				"language": "en",
				"libraryCatalog": "www.scmp.com",
				"publicationTitle": "South China Morning Post",
				"section": "Military",
				"url": "https://www.scmp.com/news/china/military/article/3371799/could-us-advances-drone-command-give-it-edge-over-pla-taiwan-conflict",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "AVIC"
					},
					{
						"tag": "Australia"
					},
					{
						"tag": "Aviation"
					},
					{
						"tag": "Boeing"
					},
					{
						"tag": "China"
					},
					{
						"tag": "China's military weapons"
					},
					{
						"tag": "Defence"
					},
					{
						"tag": "Drones"
					},
					{
						"tag": "Rand Corporation"
					},
					{
						"tag": "South China Sea"
					},
					{
						"tag": "Taiwan"
					},
					{
						"tag": "UAVs (unmanned aerial vehicles)"
					},
					{
						"tag": "US Air Force"
					},
					{
						"tag": "US military"
					},
					{
						"tag": "United States"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://www.scmp.com/news/china",
		"items": "multiple"
	}
]
/** END TEST CASES **/
