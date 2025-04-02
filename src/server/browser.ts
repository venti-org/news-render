import * as fs from 'fs';
import * as path from 'path';
import * as URL from 'url';
import * as puppeteer from 'puppeteer';
import { ResourceType, HTTPRequest } from 'puppeteer';
import { gen_style } from '../gen_style';
import { RenderRequest, RenderResponse } from '../validator/validate_types';

declare global {
    interface Window {
        prerenderData: any;
    }
}

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
            '--disable-features=HttpsUpgrades',
        ];

        const options: puppeteer.LaunchOptions  = {
            args: args,
            headless: true,
            acceptInsecureCerts: true,
            defaultViewport: { width: 1280, height: 800 },
        };
        this._browser = await puppeteer.launch(options);
        let GEN_STYLE = gen_style();
        // console.log(JSON.stringify(GEN_STYLE));
        let render_html_path = path.join(__dirname, 'render_html.js');
        this._render_html_js = fs.readFileSync(render_html_path, 'utf-8').replace('"GEN_STYLE"', JSON.stringify(GEN_STYLE));
    }

    blockResourceType(request: RenderRequest, urlRequest: HTTPRequest): boolean | undefined {
        let resourceType = urlRequest.resourceType();
        console.log(urlRequest.url(), resourceType);
        if (request.body && urlRequest.isNavigationRequest() 
            && urlRequest.method() == "GET") {
            urlRequest.respond({body: request.body, status: 200});
            request.body = "";
            return undefined;
        }
        if (request.disable_network) {
            return true;
        }
        switch (resourceType) {
            case 'script':
                return !request.enable_js;
            case 'font':
                return false;
            case 'stylesheet':
                return false;
            case 'media':
                return !request.enable_media;
            case 'image':
                return !request.enable_image;
            default:
                return false;
        }
    }

    async render(request: RenderRequest): Promise<RenderResponse> {
        const page = await this._browser!.newPage();
        await page.setJavaScriptEnabled(Boolean(request.enable_js));
        await page.setRequestInterception(true);
        page.on('request', urlRequest => {
            let block = this.blockResourceType(request, urlRequest);
            if (block === undefined) {
            } else if (block) {
                urlRequest.abort();
            } else {
                urlRequest.continue();
            }
        });
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
