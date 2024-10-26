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

            if (req_url.pathname.match(new RegExp(/^\/MOTC\/?/g))) {
                const motc_url = 'https://www.motcmpb.gov.tw/Information/RSS?siteId=1&nodeId=483'
                const motc_site = await fetch(motc_url)

                console.log(`MOTC fetch status is ${motc_site.status}`)

                var feed = {
                    version: 'https://jsonfeed.org/version/1',
                    title: 'MOTC交通部航港局 Maritime Port Bureau. MOTC - 夢想航道 航港知道',
                    home_page_url: motc_url,
                    items: [],
                }

                let current_item = {}

                await new HTMLRewriter()
                    .on('item', {
                        element: (e) => current_item = { id: '', title: '', url: '' }
                    })
                    .on('item>guid', {
                        element: (e) => current_item.id = e.text()
                    })
                    .on('item>title', {
                        element: (e) => current_item.title = e.text()
                    })
                    .on('item>link', {
                        element: (e) => current_item.url = e.text()
                    })
                    .on('item', {
                        element: (e) => feed.items.push({...current_item})
                    })
                    .transform(motc_site)
                    .arrayBuffer()

                // override topic
                feed.items = feed.items.filter((item) => item.title.match(/礙航公告/g))

                res = new Response(
                    JSON.stringify(feed),
                    {
                        headers: {
                        'content-type': 'application/json;charset=UTF-8',
                        'cache-control': 'public, max-age=43200',
                        },
                    }
                )
            
                ctx.waitUntil(cache.put(cache_key, res.clone()))
            }
        }
        catch (e) {
            res = new Response(e.toString())
        }

        return res
    }
}

