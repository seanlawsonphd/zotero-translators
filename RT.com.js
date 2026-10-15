{
	"translatorID": "be52e86f-7165-4ae6-bb6f-5da62da855de",
	"label": "RT.com",
	"creator": "Sean Lawson",
	"target": "^https?://([^/]*[.-])?rt([.-][^/]*)?/",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2026-10-15 17:05:12"
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

// RT moves domains (www.rt.com became rt-english.com in October 2026), so the
// target accepts any host with "rt" as a word in it, and detectWeb confirms
// from the page itself that this is RT's English site. Articles live at
// /<section>/<id>-<slug>/ and show episodes at /shows/<program>/<id>-<slug>/.
const ARTICLE_URL_RE = /^https?:\/\/[^/]+\/(?:[a-z-]+\/)+\d{5,}-[^/?#]+/i;

function isRT(doc) {
	return attr(doc, 'meta[name="twitter:site"]', 'content') == '@RT_com'
		|| attr(doc, 'meta[property="og:site_name"]', 'content') == 'RT International';
}

// Embedded Metadata
const EM_TRANSLATOR_ID = '951c027d-74ac-47d4-a107-9c3069ab7b48';

function detectWeb(doc, url) {
	if (!isRT(doc)) return false;
	if (ARTICLE_URL_RE.test(url) && (doc.querySelector('h1.article__heading') || getLinkedData(doc))) {
		return url.includes('/shows/') ? 'tvBroadcast' : 'newspaperArticle';
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
		// Only this site's own stories, not links out to other sites
		if (row.hostname != doc.location.hostname) continue;
		// Story cards wrap the headline and a summary in a single link, so
		// prefer the headline element when there is one
		let title = linkText(row.querySelector('.card__heading, .list-card__content--title') || row);
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
	let itemType = detectWeb(doc, url) || 'newspaperArticle';
	let linkedData = getLinkedData(doc);

	let translator = Zotero.loadTranslator('web');
	translator.setTranslator(EM_TRANSLATOR_ID);
	translator.setDocument(doc);

	translator.setHandler('itemDone', (_obj, item) => {
		let headline = (linkedData && linkedData.headline) || text(doc, 'h1.article__heading');
		if (headline) item.title = ZU.trimInternal(headline);

		let published = (linkedData && linkedData.datePublished)
			|| attr(doc, 'meta[name="published_time_telegram"]', 'content');
		if (published) item.date = ZU.strToISO(published);

		// The page metadata only credits the organization ("RT" / "Russia
		// Today"), so take the authors from the byline instead
		item.creators = getAuthors(doc);

		// The standfirst under the headline makes a better abstract than the
		// meta description
		let summary = text(doc, '.article__summary');
		if (summary) item.abstractNote = ZU.trimInternal(summary);

		let canonical = linkedData && linkedData.mainEntityOfPage && linkedData.mainEntityOfPage['@id'];
		item.url = canonical
			|| attr(doc, 'meta[property="og:url"]', 'content')
			|| url.replace(/[?#].*/, '');

		if (!item.language) item.language = 'en';

		if (itemType == 'tvBroadcast') {
			// Breadcrumbs read Home > Shows > <Program>
			let crumbs = doc.querySelectorAll('.breadcrumbs__links');
			let program = crumbs.length ? ZU.trimInternal(crumbs[crumbs.length - 1].textContent) : '';
			if (program && program != 'Shows') item.programTitle = program;
			item.network = 'RT';
			delete item.publicationTitle;
		}
		else {
			item.publicationTitle = 'RT';
			let section = attr(doc, 'meta[name="article:section"]', 'content');
			if (section) item.section = ZU.trimInternal(section);
		}

		let tags = new Set();
		for (let tag of item.tags) {
			tags.add(typeof tag == 'string' ? tag : tag.tag);
		}
		for (let link of doc.querySelectorAll('.article a[rel="tag"]')) {
			let tag = ZU.trimInternal(link.textContent);
			if (tag) tags.add(tag);
		}
		item.tags = Array.from(tags, tag => ({ tag }));

		item.complete();
	});

	let em = await translator.getTranslatorObject();
	em.itemType = itemType;
	await em.doWeb(doc, url);
}

// RT embeds a schema.org NewsArticle block on articles and show episodes
function getLinkedData(doc) {
	for (let script of doc.querySelectorAll('script[type="application/ld+json"]')) {
		try {
			let data = JSON.parse(script.textContent);
			if (Array.isArray(data)) {
				data = data.find(entry => entry && entry['@type'] == 'NewsArticle');
			}
			if (data && data['@type'] == 'NewsArticle') return data;
		}
		catch (e) {
			// skip malformed blocks
		}
	}
	return null;
}

// Only opinion pieces and features carry a byline, as a closing line such as
// "By Elizabeth Blade, RT Middle East correspondent" with the name in bold.
// News stories are unsigned.
function getAuthors(doc) {
	let byline = doc.querySelector('.article__author-text');
	if (!byline) return [];
	let names = Array.from(byline.querySelectorAll('strong'), el => ZU.trimInternal(el.textContent))
		.filter(Boolean);
	if (!names.length) {
		let match = ZU.trimInternal(byline.textContent).match(/^By\s+([^,]+)/i);
		if (match) names = [match[1]];
	}
	let creators = [];
	for (let joined of names) {
		for (let author of joined.replace(/^By\s+/i, '').split(/\s*(?:,|\band\b|&)\s*/)) {
			author = author.trim();
			if (!author || /^(RT|Russia Today)\b/i.test(author)) continue;
			creators.push(ZU.cleanAuthor(author, 'author'));
		}
	}
	return creators;
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
		"url": "https://rt-english.com/russia/646973-montenegro-russian-blogger-detained/",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "Russian military blogger expelled from NATO country",
				"creators": [],
				"date": "2026-10-09",
				"abstractNote": "Montenegrin authorities reportedly suspect the Telegram channel Rybar of “hybrid activity”",
				"language": "en",
				"libraryCatalog": "rt-english.com",
				"publicationTitle": "RT",
				"section": "Russia & Former Soviet Union",
				"url": "https://rt-english.com/russia/646973-montenegro-russian-blogger-detained/",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "Anti-Russian sanctions"
					},
					{
						"tag": "Europe"
					},
					{
						"tag": "North Atlantic Treaty Organization – NATO"
					},
					{
						"tag": "Russia"
					},
					{
						"tag": "Telegram"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://rt-english.com/news/646824-october-7-israel-elections/",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "The October 7 survivors divided on who should rule Israel",
				"creators": [
					{
						"firstName": "Elizabeth",
						"lastName": "Blade",
						"creatorType": "author"
					}
				],
				"date": "2026-10-07",
				"abstractNote": "Three years after the attack, residents near Gaza are torn between demanding Netanyahu’s departure and backing an even harder right",
				"language": "en",
				"libraryCatalog": "rt-english.com",
				"publicationTitle": "RT",
				"section": "World News",
				"url": "https://rt-english.com/news/646824-october-7-israel-elections/",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "Feature"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://rt-english.com/shows/crosstalk/646911-international-law-naked-aggression/",
		"items": [
			{
				"itemType": "tvBroadcast",
				"title": "Surviving empire",
				"creators": [],
				"date": "2026-10-09",
				"abstractNote": "Everything is coming apart at the seams Once long-held assumptions about the international order no longer apply",
				"language": "en",
				"libraryCatalog": "rt-english.com",
				"network": "RT",
				"programTitle": "CrossTalk",
				"url": "https://rt-english.com/shows/crosstalk/646911-international-law-naked-aggression/",
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
		"url": "https://rt-english.com/news/",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://www.rt.com/news/646824-october-7-israel-elections/",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "The October 7 survivors divided on who should rule Israel",
				"creators": [
					{
						"firstName": "Elizabeth",
						"lastName": "Blade",
						"creatorType": "author"
					}
				],
				"date": "2026-10-07",
				"abstractNote": "Three years after the attack, residents near Gaza are torn between demanding Netanyahu’s departure and backing an even harder right",
				"language": "en",
				"libraryCatalog": "rt-english.com",
				"publicationTitle": "RT",
				"section": "World News",
				"url": "https://rt-english.com/news/646824-october-7-israel-elections/",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "Feature"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://rt-english.com/search?q=nato",
		"items": "multiple"
	}
]
/** END TEST CASES **/
