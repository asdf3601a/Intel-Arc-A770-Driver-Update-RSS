import { jsonFeed } from '../utils/jsonFeed';
import { llm } from '../utils/llm';

export async function fox(token, account, namespace, itemURL = '') {
    const title = '福爾摩沙開放網際網路交換中心';
    const homepage = 'https://www.fox.net.tw/news.html';
    const list = 'https://www.fox.net.tw/public/content/newslist/';
    const detail = 'https://www.fox.net.tw/public/content/newsdetail/';

    const index = await fetch(list);
    var items = (await index.json())?.result.map((e) => {
        return {
            id: e?._id,
            title: e?.title,
            tags: e?.type,
            url: itemURL ? itemURL : homepage,
            date_published: e?.time,
        };
    });

    const prompt = `
        指令：
        讀取 <html></html> 標籤中的內容提取關鍵資訊，並轉換為簡明的摘要格式。
        嚴格遵守輸出格式範例
        輸入格式：
        HTML 內容包含 <div>、<font> 等標籤，請提取純文字。重點資訊通常包含 時間、影響範圍、中斷時間。
        輸出格式：
            摘要：[簡短描述]
            影響範圍：[簡要列出影響範圍]
            中斷時間：[概述影響程度]
        範例輸入：
            <html><div><font face="新細明體, serif">FOX國網公共服務網路交換中心，三地對外FW版本更新</font></div><div><font face="新細明體, serif">預計於2024/12/13 ~25&nbsp; 09:00 ~ 12:00執行更版動作</font></div><div><font face="新細明體, serif">更版動作不影響主要成員流量交換，僅影響對外網站與內部監控行為</font></div><div><font face="新細明體, serif"><br></font></div><div><font face="新細明體, serif">影響範圍：</font></div><div><font face="新細明體, serif">-三地OOB監控含CDN</font></div><div><font face="新細明體, serif">-首頁對外服務等</font></div><div><font face="新細明體, serif">-SSLVPN服務</font></div><div><br></div><div><font face="新細明體, serif">中斷時間：因有備援機制，只會有短暫瞬斷</font></div></html>
        範例輸出：
            摘要：FOX國網 FW 版本更新，影響對外網站與監控行為。
            影響範圍：OOB 監控、首頁服務、SSLVPN。
            中斷時間：有備援，僅短暫瞬斷。
    `;

    for (const e of items) {
        const presistent = JSON.parse(await namespace.get(e.id)); // expected: { content_html: '', summary: '' }

        if (Date.now() - new Date(e.date_published) < 2592000000 && !presistent) { // only fetch recent article
            const res = await fetch(detail, {
                method: 'POST',
                body: `_id=${e.id}`,
                headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            });

            if (res.status != 200) continue;

            const article = (await res.json())?.result.at(0)
            const summary = await llm(token, account, {
                messages: [
                    { role: 'system', content: prompt },
                    { role: 'user', content: `<html><h1>${article.title}</h1>${article.html}</html>` },
                ],
            })

            await namespace.put(
                e.id,
                JSON.stringify({ content_html: article.html, summary: summary.result.response }),
                { expirationTtl: 2592000 }
            );
            e.content_html = article.html
            e.summary = summary.result.response
        }

        if (presistent) { // kv to feed
            e.content_html = presistent.content_html;
            e.summary = presistent.summary;
            continue;
        }
    }

    return jsonFeed(title, homepage, items);
}
