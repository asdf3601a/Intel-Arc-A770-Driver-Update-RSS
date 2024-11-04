export default {
    async fetch(req, env, ctx) {
        const req_url = new URL(req.url)

        // create cache
        const cache_key = new Request(req_url.toString())
        const cache = caches.default

        // is cache hit?
        let res = await cache.match(cache_key)

        // if cache hit
        if (res) {
            console.log(`Cache hit for: ${req.url}.`)
            return res
        }
        else {
            // default response
            res = new Response('Hello world!')
        }

        // if cache is not hit
        // modify response
        try {
            if (req_url.pathname.match(new RegExp(/^\/intel\/?/g))) {
                const intel_archive = 'http://web.archive.org/https://www.intel.com/content/www/us/en/download/785597/intel-arc-iris-xe-graphics-windows.html'
                const intel_site = await fetch(intel_archive)

                console.log(`intel fetch status is ${intel_site.status}`)

                var feed = {
                    version: 'https://jsonfeed.org/version/1',
                    title: 'Intel® Arc™ A770 Drivers',
                    home_page_url: intel_archive,
                    items: [],
                }

                await new HTMLRewriter()
                    .on('select#version-driver-select>option', {
                    element: (element) => {
                        feed.items.push({ id: '', title: '', url: `https://www.intel.com${element.getAttribute('value')}` })
                    },
                    text: (text) => {
                        feed.items.at(-1).id += `${text.text.replace(' (Latest)', '')}`
                        feed.items.at(-1).title += `${text.text.replace(' (Latest)', '')}`
                    },
                    })
                    .transform(intel_site)
                    .arrayBuffer()
        
                res = new Response(JSON.stringify(feed), {
                    headers: {
                    'content-type': 'application/json;charset=UTF-8',
                    'cache-control': 'public, max-age=43200',
                    },
                })

                ctx.waitUntil(cache.put(cache_key, res.clone()))
            }

            if (req_url.pathname.match(new RegExp(/^\/fox\/?/g))) {
                const fox_newlist_url = 'https://www.fox.net.tw/public/content/newslist/'
                const fox_newlist = await fetch(fox_newlist_url)

                var feed = {
                    version: 'https://jsonfeed.org/version/1',
                    title: 'Fox News List',
                    home_page_url: fox_newlist_url,
                    items: [],
                }

                let fox_news = JSON.parse(await fox_newlist.text())
                if (fox_news?.status) {
                    fox_news.result?.forEach(e => {
                        feed.items.push({id: e._id, title: `［${e.type}］${e.title}`, url: 'https://cloudflare.com/cdn-cgi/trace/ip', date_published: new Date(e.time).toISOString()})
                    });
                }

                res = new Response(JSON.stringify(feed), {
                    headers: {
                    'content-type': 'application/json;charset=UTF-8',
                    'cache-control': 'public, max-age=43200',
                    },
                })

                ctx.waitUntil(cache.put(cache_key, res.clone()))
            }
        }
        catch (e) {
            res = new Response(e.toString())
        }

        return res
    }
}
