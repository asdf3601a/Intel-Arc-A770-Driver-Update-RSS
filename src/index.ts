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

        await fetch(feed.home_page_url.toString()).then(
            async function (res: Response) {
                if (!res.ok) return;
                let $ = cheerio.load(await res.text());

                $('div[class^="download-row all"]').each(
                    function (i, elem) {
                        let title = $(this).find('h4').first();
                        let date = $(this).find('div[class^="col-lg-2"]').first();
                        let description = $(this).find('p[class="download-description"]').first();
                        let os: string[] = [];
                        $(this).find('span[class^="download-tags"] > span[class~="download-tag"]').each(
                            function (i, elem) {
                                os.push($(this).text().trim())
                            }
                        );
                        let download = () => {
                            let value = $(this).find('a[class^="btn-download-driver"]').attr('href')
                            if (value) {
                                return value;
                            }
                            else {
                                return "";
                            }
                        };
                        let version = $(this).find('p[class^="version"]');

                        feed.items.push(
                            {
                                id: version.text().trim(),
                                url: download().trim(),
                                title: title.text().trim(),
                                content_text: `Description: ${description.text().trim()}\nOperating System: ${os.join(", ")}`,
                                date_published: new Date(date.text().trim())
                            }
                        )
                    }
                )
            }
        );

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
    }
}