{
	"translatorID": "024dd996-9337-44e3-ae5e-18d0c916406b",
	"label": "RIA.ru",
	"creator": "Sean Lawson",
	"target": "^https?://(www\\.)?ria\\.ru/",
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

// Articles live at https://ria.ru/<yyyymmdd>/<slug>-<id>.html (Russian-language edition)
const ARTICLE_URL_RE = /^https?:\/\/(?:www\.)?ria\.ru\/\d{8}\/[^/?#]+-\d+\.html/i;
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
		if (row.closest('header, footer, nav, .m-header')) continue;
		let title = linkText(row.querySelector('.list-item__title, .cell-list__item-title, h2, h3') || row);
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

async function scrape(doc, url = doc.location.href) {
	let linkedData = getLinkedData(doc); // eslint-disable-line no-unused-vars

	let translator = Zotero.loadTranslator('web');
	translator.setTranslator(EM_TRANSLATOR_ID);
	translator.setDocument(doc);

	translator.setHandler('itemDone', (_obj, item) => {
		let title = (linkedData && linkedData.headline) || text(doc, 'h1');
		if (title) item.title = ZU.trimInternal(title);

		let published = linkedData && linkedData.datePublished && linkedData.datePublished.trim();
		if (published) item.date = ZU.strToISO(published) || item.date;

		item.creators = toCreators([]);

		let abstractNote = '';
		if (abstractNote) item.abstractNote = ZU.trimInternal(abstractNote);
		// Some pages repeat the headline as their description
		if (item.abstractNote && item.abstractNote.replace(/[\s\p{P}]+$/u, '') == item.title.replace(/[\s\p{P}]+$/u, '')) {
			delete item.abstractNote;
		}

		let section = attr(doc, 'meta[property="article:section"]', 'content');
		if (section) item.section = ZU.trimInternal(section);

		item.url = attr(doc, 'meta[property="og:url"]', 'content') || url.replace(/[?#].*/, '');
		item.publicationTitle = 'РИА Новости';
		item.language = 'ru';

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
		"url": "https://ria.ru/20261022/putin-2126342557.html",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "Путин назначил Константина Шестакова врио губернатора Приморского края",
				"creators": [],
				"date": "2026-10-22",
				"abstractNote": "Владимир Путин подписал указ о назначении мэра Владивостока Константина Шестакова врио губернатора Приморского края. РИА Новости, 22.10.2026",
				"language": "ru",
				"libraryCatalog": "ria.ru",
				"publicationTitle": "РИА Новости",
				"section": "Новости",
				"url": "https://ria.ru/20261022/putin-2126342557.html",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "Владимир Путин"
					},
					{
						"tag": "Дальний Восток"
					},
					{
						"tag": "Константин Шестаков"
					},
					{
						"tag": "Политика"
					},
					{
						"tag": "Приморский край"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://ria.ru/politics/",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://ria.ru/20261022/vpk-2126335537.html",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "ВС России поразили объекты энергетики, работавшие на ВПК Украины",
				"creators": [],
				"date": "2026-10-22",
				"abstractNote": "Российская армия ударила по объектам энергетики, обеспечивающим работу украинских предприятий ВПК и логистических центров, сообщили в Минобороны. РИА Новости, 22.10.2026",
				"language": "ru",
				"libraryCatalog": "ria.ru",
				"publicationTitle": "РИА Новости",
				"section": "Новости",
				"url": "https://ria.ru/20261022/vpk-2126335537.html",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "Безопасность"
					},
					{
						"tag": "Россия"
					},
					{
						"tag": "Украина"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/
