import * as fs from 'fs';
import * as path from 'path';
import * as playwright from 'playwright';
import { gen_style } from '../gen_style';
import { RenderRequest, RenderResponse } from '../validator/validate_types';

declare global {
    interface Window {
        prerenderData: any;
    }
}

class Browser {
    private _browser: playwright.Browser | null;
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

        const options: playwright.LaunchOptions  = {
            args: args,
            headless: true,
        };
        this._browser = await playwright.chromium.launch(options);
        let GEN_STYLE = gen_style();
        // console.log(JSON.stringify(GEN_STYLE));
        let render_html_path = path.join(__dirname, 'render_html.js');
        this._render_html_js = fs.readFileSync(render_html_path, 'utf-8').replace('"GEN_STYLE"', JSON.stringify(GEN_STYLE));
    }

    blockResourceType(request: RenderRequest, urlRequest: playwright.Request): boolean | string {
        const resourceType = urlRequest.resourceType();
        const url = urlRequest.url();
        if (request.body && urlRequest.isNavigationRequest() 
            && urlRequest.method() == "GET") {
            let body = request.body;
            request.body = "";
            return body;
        }
        if (request.disable_network) {
            return true;
        }
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            return false;
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
        const context = await this._browser!.newContext({
            javaScriptEnabled: Boolean(request.enable_js),
            viewport: {width: 1280, height: 800},
        });
        const page = await context.newPage();
        let response: RenderResponse = {};
        try {
            response = await this.renderInternal(page, request);
        } catch (e: any) {
            response.error_msg = e.toString();
        }
        await page.close();

        if (!response.error_msg && request.key) {
            return (response as any)[request.key];
        }
        return response;
    }

    async renderInternal(page: playwright.Page, request: RenderRequest): Promise<RenderResponse> {
        let blockCount = new Map();
        page.route("**/*", async route => {
            const urlRequest = route.request();
            const url = urlRequest.url();
            const resourceType = urlRequest.resourceType();
            const block = this.blockResourceType(request, urlRequest);
            const times = (blockCount.get(url) || 0 ) + 1;
            blockCount.set(url, times)
            if (typeof block == 'string') {
                console.log("fulfill:", url, resourceType);
                await route.fulfill({
                    status: 200,
                    body: block,
                })
            } else if (block) {
                if (times > 3) {
                    console.log("allow:", url, resourceType);
                    await route.continue()
                } else {
                    console.log("block:", url, resourceType);
                    await route.abort()
                }
            } else {
                console.log("allow:", url, resourceType);
                await route.continue()
            }
        });
        const urlResponseChain: any[] = [];
        page.on('response', urlResponse => {
            const urlRequest = urlResponse.request();
            if (urlRequest.resourceType() === 'document') {
                urlResponseChain.push({
                  url: urlRequest.url(),
                  status: urlResponse.status(),
                  headers: urlResponse.headers()
                });
            }
        });
        await page.goto(request.url, {
            timeout: 10000,
            waitUntil: 'networkidle',
        });

        if (urlResponseChain.length == 0) {
            throw new Error("not found response url");
        }
        const urlResponse = urlResponseChain[urlResponseChain.length-1];
        let response: RenderResponse = {
            url: urlResponse.url,
            http_code: urlResponse.status,
        };
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
        await page.evaluate(this._render_html_js!);
        response.render_html = await page.evaluate(() => {
            return document.documentElement.outerHTML;
        });

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
