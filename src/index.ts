import * as cheerio from 'cheerio';

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

export default {
    async fetch(req: Request): Promise<Response> {
        if (req.method != "GET") return new Response(`Method ${req.method} not allowed.`, { status: 405, headers: { Allow: "GET" } });

        let feed: Feed = {
            version: "https://jsonfeed.org/version/1",
            title: "Intel® Arc™ A770 Drivers",
            home_page_url: new URL("https://www.intel.com.tw/content/www/tw/zh/products/sku/229151/intel-arc-a770-graphics-16gb/downloads.html"),
            items: []
        };

        const whql_url = new URL("https://www.intel.com/content/www/us/en/download/726609/intel-arc-iris-xe-graphics-whql-windows.html");
        feed.items = feed.items.concat(await this.parser(whql_url));

        let beta_url = new URL("https://www.intel.com/content/www/us/en/download/729157/intel-arc-iris-xe-graphics-beta-windows.html");
        feed.items = feed.items.concat(await this.parser(beta_url));

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

        return new Response(
            JSON.stringify(feed),
            {
                headers: {
                    'content-type': 'application/json;charset=UTF-8',
                },
            }
        );
    },
    async parser(url: URL): Promise<Item[]> {
        let items: Item[] = [];

        let $ = cheerio.load(
            await (await fetch(url)).text()
        );

        let description = $('meta[name^="description"]').attr('content');

        items.push(
            {
                id: "Version: " + description?.match(/\d*\.\d*\.\d*\.\d*/gm)?.[0],
                url: [
                    url.toString().slice(0, 55),
                    $('meta[name^="RecommendedDownloadUrl"]').attr('content')?.match(/\/\d{1,}\//gm)?.[0].slice(1, -1),
                    url.toString().slice(56, )
                ].join('/'),
                title: $('meta[name^="title"]').attr('content') + ' ' + $('meta[name^="DownloadVersion"]').attr('content'),
                content_text: "Description: " + description + "\nOperating System: " + $('meta[name="DownloadOSes"]').attr('content'),
                date_published: new Date($('meta[name="lastModifieddate"]').attr('content')!)
            }
        );

        return items;
    }
}