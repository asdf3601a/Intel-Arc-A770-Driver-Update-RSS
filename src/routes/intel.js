import { jsonFeed } from '../utils/jsonFeed'

export async function intel() {
    const title = 'Intel® Arc™ A770 Drivers'
    const url = 'https://www.intel.com/content/www/us/en/download/785597/intel-arc-iris-xe-graphics-windows.html'
    const header = {
        'Host': 'www.intel.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Alt-Used': 'www.intel.com',
        'Connection': 'keep-alive',
        // 隨便開一個瀏覽器抓的 :D
        'Cookie': 'utag_main=ad_blocker:0; OptanonConsent=isGpcEnabled=0&datestamp=Sun+Dec+15+2024+05%3A55%3A58+GMT%2B0800+(%E5%8F%B0%E5%8C%97%E6%A8%99%E6%BA%96%E6%99%82%E9%96%93)&version=202410.1.0&browserGpcFlag=0&isIABGlobal=false&hosts=&consentId=4ac02ac0-fb1c-4384-881f-dc2e06b7afda&interactionCount=1&isAnonUser=1&landingPath=NotLandingPage&groups=C0001%3A1%2CC0003%3A1%2CC0004%3A1%2CC0002%3A1%2CC0013%3A0%2CC0014%3A0%2CBG114%3A1&AwaitingReconsent=false; FPID=4569c812-bd87-4dbd-bdbb-f8c09314120c; detected_bandwidth=HIGH; src_countrycode=tw; ak_bmsc=14A71706D6E5469EAE9C5EBE3CB29DAF~000000000000000000000000000000~YAAQtT8uF7wkZKyUAQAAivQL6RpjASUQNFjEsgrAkwetE4UQgcg4zOXkb0Lz20lxdlepnx4tnqR3kBZuwC/n6jAhMxlEg4V5aCC4KbO8pa3E6HVhvcHJ1tqnd3Y44DR7z9ySb+5FrBRL6pqeaXlJjIQhZDRcZ8VZhNuYRHmm76Z6RqpvsSs0umGOYIJq1Ujar8OAwWcoerxshbaOl0WJ4QKy/kFuKfmO6Za5qqeiQ+6ubExhVicfXBGEB59MyB0SOs1UW4nHMuQV0ubSqsjDvSHxFelKnrtfLpBZKM/XSSp2oBMDIIgDpKj4OsV9nwcHiBBRkCqsg60ICUzslmvV2IcVN7iqBD2l0tkQWZa1gLZ+XsoQaY9yPDOBmH2YDKv8kspgMuAIXpgNf1fB6EDqu48Xe95d6amqRaeAX3P37vYWV54=',
        'Upgrade-Insecure-Requests': 1,
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Priority': 'u=0, i',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
    }

    const site = await fetch(url, {headers: header})

    var items = []
    await new HTMLRewriter()
        .on(
            'select#version-driver-select>option',
            {
                element: (e) => {
                    items.push({ id: '', title: '', url: '' })
                    items.at(-1).url = `https://www.intel.com${e.getAttribute('value')}`
                },
                text: (e) => {
                    items.at(-1).id += `${e.text.replace(' (Latest)', '')}`
                    items.at(-1).title += `${e.text.replace(' (Latest)', '')}`
                }
            }
        )
        .transform(site)
        .arrayBuffer()

    return jsonFeed(title, url, items)
}
