/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import * as cheerio from 'cheerio';

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
}

export interface Driver {
	title: String;
	date: Date;
	os: string[];
	download: string;
	version: string;
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		if (request.method != "GET") return new Response(`Method ${request.method} not allowed.`, { status: 405, headers: { Allow: "GET" } });

		let url = "https://www.intel.com.tw/content/www/tw/zh/products/sku/229151/intel-arc-a770-graphics-16gb/downloads.html";
		let page = await fetch(url);

		let $ = cheerio.load(await page.text());

		var list: Driver[] = [];
		$('div[class^="download-row all"]').each(
			function (i, elem) {
				let title = $(this).find('h4').first();
				let date = $(this).find('div[class^="col-lg-2"]').first();

				let os: string[] = [];
				$(this).find('span[class^="download-tags"] > span[class~="download-tag"]').each(
					function (i, elem) {
						os.push($(this).text().trim())
					}
				)

				let download = () => {
					let value = $(this).find('a[class^="btn-download-driver"]').attr('href')
					if (value) {
						return value
					}
					else {
						return "";
					}
				};

				let version = $(this).find('p[class^="version"]');

				list.push(
					{
						"title": title.text(),
						"date": new Date(date.text()),
						"os": os,
						"download": download(),
						"version": version.text().trim().replace("Version: ", ""),
					}
				);
			}
		)

		let feeds = {
			"version": "https://jsonfeed.org/version/1",
			"title": "Intel® Arc™ A770 Drivers",
			"home_page_url": url,
			"items": list.sort(
				(a, b) => {
					if (a.date > b.date) {
						return -1;
					} else if (a.date < b.date) {
						return 1;
					} else {
						return 0;
					}
				}
			).map(
				function (elem) {
					return {
						"id": elem.version,
						"url": elem.download,
						"title": elem.title,
						"content_text": "Operating System: " + elem.os.join(", "),
						"date_published": elem.date.toISOString(),
					}
				}
			),
		};

		return new Response(
			JSON.stringify(feeds),
			{
				headers: {
					'content-type': 'application/json;charset=UTF-8',
				},
			}
		);
	},
};
