import express, { Request, Response } from 'express';
import { Browser } from './browser';

let browser = new Browser();

async function render(request: Request, response: Response) {
    let req = request.query;
    if (!req) {
        req = request.body;
    }
    console.log(req);
    let resp = await browser.render(req as any);
    response.send(resp);
}

let app = express();

async function main() {
    await browser.init();

    let port = 3000;
    console.log(`listen 0.0.0.0:${port}`);

    app.use(express.json());
    app.all('/render', render);
    app.listen(port);
}

main();
