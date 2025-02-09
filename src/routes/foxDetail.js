import { Ai } from '@cloudflare/ai';

export async function foxDetail(id) {
    const src = 'https://www.fox.net.tw/public/content/newsdetail/'
    const article = await fetch(src, { method: 'POST', body: `_id=${id}`, headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' } })

    if (article.status == 200) {
        let content = JSON.parse(await article.text())
        
        // Failsafe
        if (!content?.status) return

        let result = content?.result?.at(0)

        const messages = [
            {
                role: 'system',
                content: `
                指令：請解析 <html></html> 標籤中的內容，提取關鍵資訊，並轉換為簡明的摘要格式。
                輸入格式：HTML 內容包含 <div>、<font> 等標籤，請提取純文字。
                輸出格式如下
                    摘要：[簡短描述]
                    影響範圍：[簡要列出影響範圍]
                    中斷時間：[概述影響程度]
                範例輸入如下
                    <html><div><font face="新細明體, serif">FOX國網公共服務網路交換中心，三地對外FW版本更新</font></div><div><font face="新細明體, serif">預計於2024/12/13 ~25&nbsp; 09:00 ~ 12:00執行更版動作</font></div><div><font face="新細明體, serif">更版動作不影響主要成員流量交換，僅影響對外網站與內部監控行為</font></div><div><font face="新細明體, serif"><br></font></div><div><font face="新細明體, serif">影響範圍：</font></div><div><font face="新細明體, serif">-三地OOB監控含CDN</font></div><div><font face="新細明體, serif">-首頁對外服務等</font></div><div><font face="新細明體, serif">-SSLVPN服務</font></div><div><br></div><div><font face="新細明體, serif">中斷時間：因有備援機制，只會有短暫瞬斷</font></div></html>
                範例輸出如下
                    摘要：FOX國網 FW 版本更新，影響對外網站與監控行為。
                    影響範圍：OOB 監控、首頁服務、SSLVPN。
                    中斷時間：有備援，僅短暫瞬斷。
                `
            },
            {
                role: 'user',
                content: `<html><h1>${result?.title}</h1>${result?.html}</html>`
            }
        ]

        // return await Ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages });
    }
}
