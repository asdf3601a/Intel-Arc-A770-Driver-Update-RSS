import { fox } from "./routes/fox";
import { foxDetail } from "./routes/foxDetail";
import { intel } from "./routes/intel";

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url)
		const header = {
			'content-type': 'application/json;charset=UTF-8',
			'cache-control': 'public, max-age=7200'
		}

		const cache = caches.default
		// const cache_key = `https://${url.hostname}${url.pathname}` // Only use the path for the cache key
		const cache_key = url.href
		
		const res = await cache.match(cache_key)
		if (res) return res;

		if (url.pathname.match(new RegExp(/^\/intel\/?/g))) {
			let _res = new Response(JSON.stringify(await intel()), { headers: header })
			ctx.waitUntil(cache.put(cache_key, _res.clone()))
			
			return _res
		}
		if (url.pathname.match(new RegExp(/^\/fox_news\/?/g))) {
			let _res = new Response(JSON.stringify(await fox()), { headers: header })
			ctx.waitUntil(cache.put(cache_key, _res.clone()))
			
			return _res
		}
		if (url.pathname.match(new RegExp(/^\/fox_detail\/?/g))) {
			let _res = new Response(JSON.stringify(await foxDetail(url.searchParams.get('search'), env)), {
				headers: {
					'content-type': 'application/json;charset=UTF-8',
					'cache-control': 'public, max-age=86400',
				},
			});
			ctx.waitUntil(cache.put(cache_key, _res.clone()));

			return _res;
		}

		return new Response('Hello world!');
	},
};
