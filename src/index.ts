import * as http from 'node:http';
import * as cheerio from 'cheerio';

import { request } from 'undici';

// Http Server
function main() {
    const server = http.createServer();
    
    server.on(
        'request',
        async (req, res) => {
            if (req.method != 'GET' || req.url != '/') {
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.writeHead(404, 'Not Found')
                res.end();
                return
            }

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.writeHead(200, 'OK');
            res.write(await feed_provider());
            res.end();
            return
        }
    );

    server.listen(8787, 'localhost');
    // 呼吸
    console.log('Server is running at 8787 port on localhost.');
}

export interface Item {
    id: string;
    url: string;
    title: string;
    content_text: string;
    date_published: Date;
}

export interface Feed {
    version: string;
    title: string;
    home_page_url: URL;
    items: Item[];
}

// 一堆連結
const home_url = new URL("https://www.intel.com.tw/content/www/tw/zh/products/sku/229151/intel-arc-a770-graphics-16gb/downloads.html");
const whql_url = new URL("https://www.intel.com/content/www/us/en/download/726609/intel-arc-iris-xe-graphics-whql-windows.html");
const beta_url = new URL("https://www.intel.com/content/www/us/en/download/729157/intel-arc-iris-xe-graphics-beta-windows.html");

// 建立一個 Feed 然後回 JSON
async function feed_provider(): Promise<string> {
    let feed: Feed = {
        version: 'https://jsonfeed.org/version/1',
        title: 'Intel® Arc™ A770 Drivers',
        home_page_url: home_url,
        items: []
    };

    try {
        feed.items = feed.items.concat(await parser(whql_url));
        feed.items = feed.items.concat(await parser(beta_url));
    } catch (error) {
        console.error(error);
    }

    feed.items.sort(
        (a, b) => {
            if (a.date_published > b.date_published) {
                return -1;
            } else if (a.date_published < b.date_published) {
                return 1;
            } else {
                return 0;
            }
        }
    );

    return JSON.stringify(feed)
}

// 抓 Intel 的網站，然後把最新的驅動版本變成 Item
async function parser(url: URL) {
    let items: Item[] = [];

    const {statusCode, headers, trailers, body} = await request(url);
    if (statusCode != 200) throw new Error(`Status code ${statusCode} error!`);
    
    let $ = cheerio.load(
        await body.text()
    );

    let description = $('meta[name^="description"]').attr('content');

    items.push(
        {
            id: `Version: ${description?.match(/\d*\.\d*\.\d*\.\d*/gm)?.[0]}`,
            url: `${url.toString().slice(0, 55)}/${$('meta[name^="RecommendedDownloadUrl"]').attr('content')?.match(/\/\d{1,}\//gm)?.[0].slice(1, -1)}/${url.toString().slice(56, )}`,
            title: `${$('meta[name^="title"]').attr('content')} ${$('meta[name^="DownloadVersion"]').attr('content')}`,
            content_text: `Description: ${description}\nOperating System: ${$('meta[name="DownloadOSes"]').attr('content')}`,
            date_published: new Date($('meta[name="lastModifieddate"]').attr('content')!)
        }
    );

    return items
}

main()