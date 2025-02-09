import { jsonFeed } from '../utils/jsonFeed'

export async function fox() {
    const title = '福爾摩沙開放網際網路交換中心'
    const homepage = 'https://www.fox.net.tw/news.html'
    const list = 'https://www.fox.net.tw/public/content/newslist/'

    const index = await fetch(list)
    const items = JSON.parse(await index.text())
        ?.result
        .map(e => { return {id: e?._id, title: e?.title, tags: e?.type, url: homepage, date_published: e?.time} })
    
    return jsonFeed(title, homepage, items)
}
