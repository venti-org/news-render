import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { gen_style } from './gen_style';

declare global {
    interface Window {
        prerenderData: any;
    }
}

type RenderRequest = {
    url: string;
    enable_js?: boolean;
    javascript?: string;
    key?: string;
};

type RenderResponse = {
    render_error?: string;
    render_html?: string;
    javascript_error?: string;
    javascript_result?: string;
};

class Browser {
    private _browser: puppeteer.Browser | null;
    private _render_html_js: string | null;

    constructor() {
        this._browser = null;
        this._render_html_js = null;
    }

    async init(): Promise<void> {
        const args: string[] = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',
            //'--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.3312.0 Safari/537.36"'
        ];

        const options: puppeteer.PuppeteerLaunchOptions  = {
            args: args,
            headless: 'new',
            ignoreHTTPSErrors: true,
            defaultViewport: { width: 1280, height: 800 }
        };
        this._browser = await puppeteer.launch(options);
        let GEN_STYLE = gen_style();
        // console.log(JSON.stringify(GEN_STYLE));
        let render_html_path = path.join(__dirname, 'render_html.js');
        this._render_html_js = fs.readFileSync(render_html_path, 'utf-8').replace('"GEN_STYLE"', JSON.stringify(GEN_STYLE));
    }

    async render(request: RenderRequest): Promise<RenderResponse> {
        request = {
            enable_js: false,
            javascript: '',
            key: '',
            ...request,
        };

        const page = await this._browser!.newPage();
        await page.setJavaScriptEnabled(request.enable_js as boolean);
        await page.goto(request.url, { waitUntil: 'networkidle2' });
        let response: RenderResponse = {};
        if (request.javascript) {
            try {
                await page.evaluate(request.javascript);
                let javascript_result = await page.evaluate(() => {
                    let result = window.prerenderData;
                    if (result !== undefined) {
                        return JSON.stringify(result);
                    }
                    return undefined;
                });
                if (javascript_result !== undefined) {
                    response.javascript_result = javascript_result;
                }
            } catch (e: any) {
                response.javascript_error = e.toString();
            }
        }
        try {
            await page.evaluate(this._render_html_js!);
            response.render_html = await page.evaluate(() => {
                return document.documentElement.outerHTML;
            });
        } catch (e: any) {
            response.render_error = e.toString();
        }

        await page.close();
        if (request.key) {
            return (response as any)[request.key];
        }
        return response;
    }

    async close(): Promise<void> {
        if (this._browser) {
            let browser = this._browser;
            this._browser = null;
            await browser.close();
        }
    }
}

export {
    Browser,
    RenderRequest,
    RenderResponse,
};
