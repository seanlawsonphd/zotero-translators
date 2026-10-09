{
	"translatorID": "73119cb0-0e37-4f2f-8dd3-f85e31776d46",
	"label": "SputnikGlobe.com",
	"creator": "Sean Lawson",
	"target": "^https?://(www\\.)?sputnikglobe\\.com/",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2026-10-09 23:33:32"
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


// Articles live at https://sputnikglobe.com/<yyyymmdd>/<slug>-<id>.html; long
// reads drop the slug: https://sputnikglobe.com/<yyyymmdd>/<id>.html
const ARTICLE_URL_RE = /^https?:\/\/(?:www\.)?sputnikglobe\.com\/\d{8}\/(?:[^/?#]+-)?(\d+)\.html/i;

// Embedded Metadata
const EM_TRANSLATOR_ID = '951c027d-74ac-47d4-a107-9c3069ab7b48';

function detectWeb(doc, url) {
	if (getArticle(doc, url)) {
		return 'newspaperArticle';
	}
	else if (getSearchResults(doc, true)) {
		return 'multiple';
	}
	return false;
}

// Scrolling past the end of a story appends the next ones to the same page
// and updates the address bar, but not the metadata in <head>. Every story
// sits in its own container carrying its ID, so pick the one the URL names.
function getArticle(doc, url) {
	let match = url.match(ARTICLE_URL_RE);
	return match && doc.querySelector(`.endless__item[data-id="${match[1]}"]`);
}

function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	var rows = doc.querySelectorAll('a[href]');
	for (let row of rows) {
		let href = row.href;
		if (!ARTICLE_URL_RE.test(href) || items[href]) continue;
		// Skip the "Newsfeed" drawer, which previews the latest stories on
		// every page
		if (row.closest('.lenta')) continue;
		// Story cards wrap the headline together with a view counter, a video
		// duration or a "Watch" button in a single link, so prefer the
		// headline element, then the link's title attribute
		let headline = row.querySelector('.cell-list__item-title, .cell-video__title, .cell-media-cover__title');
		let title = ZU.trimInternal(headline ? headline.textContent : row.title || row.textContent);
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
	let article = getArticle(doc, url) || doc.querySelector('.endless__item');
	// The metadata in <head> describes the story the page was opened on
	let isFirst = article == doc.querySelector('.endless__item');

	let translator = Zotero.loadTranslator('web');
	translator.setTranslator(EM_TRANSLATOR_ID);
	translator.setDocument(doc);

	translator.setHandler('itemDone', (_obj, item) => {
		let headline = text(article, 'h1') || article.getAttribute('data-title');
		if (headline) item.title = ZU.trimInternal(headline);

		let published = article.getAttribute('data-published');
		if (published) item.date = ZU.strToISO(published);

		// The page metadata credits unsigned stories to the organization, so
		// take the authors from the byline instead
		item.creators = getAuthors(article);

		// The standfirst under the headline; long reads have none
		let summary = text(article, '.article__announce-text');
		if (summary) {
			item.abstractNote = ZU.trimInternal(summary);
		}
		else if (!isFirst) {
			delete item.abstractNote;
		}

		item.url = article.getAttribute('data-full-url') || url.replace(/[?#].*/, '');
		item.publicationTitle = 'Sputnik International';
		if (!item.language) item.language = 'en';

		// The meta tags file everything under "News"; the lead tag is the
		// rubric or running story the site puts in the banner above the headline
		let section = text(article, '.tags .tag[data-type="supertag"] .tag__text');
		if (section) item.section = ZU.trimInternal(section);

		// The keywords meta tag repeats the page's tags in lower case
		let tags = new Set();
		for (let link of article.querySelectorAll('.tags .tag__text')) {
			let tag = ZU.trimInternal(link.textContent);
			if (tag) tags.add(tag);
		}
		if (tags.size || !isFirst) {
			item.tags = Array.from(tags, tag => ({ tag }));
		}

		item.complete();
	});

	let em = await translator.getTranslatorObject();
	em.itemType = 'newspaperArticle';
	await em.doWeb(doc, url);
}

// Signed pieces show the author under the lead image. Unsigned stories, videos
// and infographics are credited to "Sputnik International" in the metadata only.
function getAuthors(article) {
	let names = Array.from(article.querySelectorAll('.article__author-name'), el => ZU.trimInternal(el.textContent));
	if (!names.length) {
		names = (article.getAttribute('data-author') || '').split(/\s*,\s*/);
	}
	return names
		.filter(name => name && !/^Sputnik\b/i.test(name))
		.map(name => ZU.cleanAuthor(name, 'author'));
}

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://sputnikglobe.com/20260711/us-demands-iran-declare-strait-of-hormuz-open-by-saturday--report-1124433731.html",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "US Demands Iran Declare Strait of Hormuz Open by Saturday — Report",
				"creators": [],
				"date": "2026-07-11",
				"abstractNote": "The White House is pressing Iran to publicly announce that the Strait of Hormuz is open and commit to halting attacks on commercial vessels, Axios reported Friday, citing US officials.",
				"language": "en",
				"libraryCatalog": "sputnikglobe.com",
				"publicationTitle": "Sputnik International",
				"section": "US-Israel War on Iran",
				"url": "https://sputnikglobe.com/20260711/us-demands-iran-declare-strait-of-hormuz-open-by-saturday--report-1124433731.html",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "Abbas Araghchi"
					},
					{
						"tag": "Donald Trump"
					},
					{
						"tag": "Iran"
					},
					{
						"tag": "Strait of Hormuz"
					},
					{
						"tag": "US"
					},
					{
						"tag": "US Central Command (CENTCOM)"
					},
					{
						"tag": "US-Iran Relations"
					},
					{
						"tag": "US-Israel War on Iran"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://sputnikglobe.com/20261005/zelenskys-attacks-on-russian-civilian-infrastructure-to-blame-for-intensified-reciprocal-strikes-1124838362.html",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "Zelensky’s Attacks on Russian Civilian Infrastructure to Blame for Intensified Reciprocal Strikes",
				"creators": [
					{
						"firstName": "Ekaterina",
						"lastName": "Blinova",
						"creatorType": "author"
					}
				],
				"date": "2026-10-05",
				"abstractNote": "The more military-industrial and logistics facilities Russia destroys in Ukraine, the sooner victory will come, retired colonel Anatoliy Matviychuk tells Sputnik.",
				"language": "en",
				"libraryCatalog": "sputnikglobe.com",
				"publicationTitle": "Sputnik International",
				"section": "Analysis",
				"url": "https://sputnikglobe.com/20261005/zelenskys-attacks-on-russian-civilian-infrastructure-to-blame-for-intensified-reciprocal-strikes-1124838362.html",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "Analysis"
					},
					{
						"tag": "European Union (EU)"
					},
					{
						"tag": "Military & Intelligence"
					},
					{
						"tag": "Opinion"
					},
					{
						"tag": "Russia"
					},
					{
						"tag": "Russian Defense Ministry"
					},
					{
						"tag": "Ukraine"
					},
					{
						"tag": "Volodymyr Zelensky"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://sputnikglobe.com/20260923/why-china-dominates-as-the-worlds-rare-earth-powerhouse---and-why-it-matters-1124775811.html",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "Why China Dominates as the World’s Rare Earth Powerhouse - And Why It Matters",
				"creators": [],
				"date": "2026-09-23",
				"abstractNote": "China commands a staggering 85% of the globe's refined rare earth production, having mined more than five times as much as the US in 2025.",
				"language": "en",
				"libraryCatalog": "sputnikglobe.com",
				"publicationTitle": "Sputnik International",
				"section": "Multimedia",
				"url": "https://sputnikglobe.com/20260923/why-china-dominates-as-the-worlds-rare-earth-powerhouse---and-why-it-matters-1124775811.html",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "China"
					},
					{
						"tag": "Infographic"
					},
					{
						"tag": "Multimedia"
					},
					{
						"tag": "US"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://sputnikglobe.com/20260531/1124227881.html",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "Neocolonialism’s Destructive Grip",
				"creators": [],
				"date": "2026-05-31",
				"abstractNote": "Western countries are trying to cling to their dominance through neocolonial methods while turning a blind eye to the emergence of a multipolar world. Leaders from many nations have stressed that neocolonialism has no place in a multipolar order, because it contradicts the principles of equality, sovereignty, and the fair distribution of resources.",
				"language": "en",
				"libraryCatalog": "sputnikglobe.com",
				"publicationTitle": "Sputnik International",
				"section": "World",
				"url": "https://sputnikglobe.com/20260531/1124227881.html",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "Central Africa"
					},
					{
						"tag": "East Africa"
					},
					{
						"tag": "North Africa"
					},
					{
						"tag": "Russia"
					},
					{
						"tag": "South Africa"
					},
					{
						"tag": "West"
					},
					{
						"tag": "West Africa"
					},
					{
						"tag": "World"
					},
					{
						"tag": "neocolonialism"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://sputnikglobe.com/geo_Iran/",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://sputnikglobe.com/search/?query=hormuz",
		"items": "multiple"
	}
]
/** END TEST CASES **/
