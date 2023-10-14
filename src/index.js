/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
  async fetch(request, env, ctx) {
    const url = "https://www.intel.com/content/www/us/en/download/785597/intel-arc-iris-xe-graphics-windows.html";
    const site = await fetch(url);

    const cache = caches.default;
    const cache_key = request.url;
    let response = await cache.match(cache_key);

    if (!response) {
      var item = "";
      var feed = {
        version: "https://jsonfeed.org/version/1",
        title: "Intel® Arc™ A770 Drivers",
        home_page_url: url,
        items: []
      }

      await (
        new HTMLRewriter().on(
          'select#version-driver-select>option',
          {
            element: (element) => { item += `https://www.intel.com${element.getAttribute('value')},` },
            text: (text) => { item += `${text.text.replace(' (Latest)', '')};` },
          }
        )
          .transform(site)
          .arrayBuffer()
      )

      item
        .split(';')
        .filter(e => e.length > 3)
        .forEach(
          e => {
            let s = e.split(',');
            feed.items.push({ id: s[1], title: s[1], url: s[0] });
          }
        )

      response = new Response(
        JSON.stringify(feed),
        {
          headers: {
            'content-type': 'application/json;charset=UTF-8',
            'cache-control': 'public, max-age=300',
          }
        }
      )

      ctx.waitUntil(cache.put(cache_key, response.clone()));
    }


    return response
  },
};
