"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("node:http"));
const cheerio = __importStar(require("cheerio"));
const undici_1 = require("undici");
// Http Server
function main() {
    const server = http.createServer();
    server.on('request', (req, res) => __awaiter(this, void 0, void 0, function* () {
        if (req.method != 'GET' || req.url != '/') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.writeHead(404, 'Not Found');
            res.end();
            return;
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.writeHead(200, 'OK');
        res.write(yield feed_provider());
        res.end();
        return;
    }));
    // server.listen(8787, 'localhost');
    // 呼吸
    // console.log('Server is running at 8787 port on localhost.');
    server.listen(8787);
    console.log('Server is running at 8787 port.');
}
// 一堆連結
const home_url = new URL("https://www.intel.com.tw/content/www/tw/zh/products/sku/229151/intel-arc-a770-graphics-16gb/downloads.html");
const whql_url = new URL("https://www.intel.com/content/www/us/en/download/726609/intel-arc-iris-xe-graphics-whql-windows.html");
const beta_url = new URL("https://www.intel.com/content/www/us/en/download/729157/intel-arc-iris-xe-graphics-beta-windows.html");
// 建立一個 Feed 然後回 JSON
function feed_provider() {
    return __awaiter(this, void 0, void 0, function* () {
        let feed = {
            version: 'https://jsonfeed.org/version/1',
            title: 'Intel® Arc™ A770 Drivers',
            home_page_url: home_url,
            items: []
        };
        try {
            feed.items = feed.items.concat(yield parser(whql_url));
            feed.items = feed.items.concat(yield parser(beta_url));
        }
        catch (error) {
            console.error(error);
        }
        feed.items.sort((a, b) => {
            if (a.date_published > b.date_published) {
                return -1;
            }
            else if (a.date_published < b.date_published) {
                return 1;
            }
            else {
                return 0;
            }
        });
        return JSON.stringify(feed);
    });
}
// 抓 Intel 的網站，然後把最新的驅動版本變成 Item
function parser(url) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        let items = [];
        const { statusCode, headers, trailers, body } = yield (0, undici_1.request)(url);
        if (statusCode != 200)
            throw new Error(`Status code ${statusCode} error!`);
        let $ = cheerio.load(yield body.text());
        let description = $('meta[name^="description"]').attr('content');
        items.push({
            id: `Version: ${(_a = description === null || description === void 0 ? void 0 : description.match(/\d*\.\d*\.\d*\.\d*/gm)) === null || _a === void 0 ? void 0 : _a[0]}`,
            url: `${url.toString().slice(0, 55)}/${(_c = (_b = $('meta[name^="RecommendedDownloadUrl"]').attr('content')) === null || _b === void 0 ? void 0 : _b.match(/\/\d{1,}\//gm)) === null || _c === void 0 ? void 0 : _c[0].slice(1, -1)}/${url.toString().slice(56)}`,
            title: `${$('meta[name^="title"]').attr('content')} ${$('meta[name^="DownloadVersion"]').attr('content')}`,
            content_text: `Description: ${description}\nOperating System: ${$('meta[name="DownloadOSes"]').attr('content')}`,
            date_published: new Date($('meta[name="lastModifieddate"]').attr('content'))
        });
        return items;
    });
}
main();
