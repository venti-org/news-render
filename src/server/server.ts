import express, { Request, Response } from 'express';
import { Browser } from './browser';
import getValidateQuery from '../validator/validator';
import { CombileTypeName, RenderRequest } from '../validator/validate_types';

let browser = new Browser();

async function render(request: Request, response: Response) {
    let req: RenderRequest = request.query as any;
    if (!req) {
        req = request.body as any;
    }
    console.log(req);
    let resp = await browser.render(req);
    response.send(resp);
}

let app = express();

async function main() {
    await browser.init();

    let port = 3000
    console.log(`listen 0.0.0.0:${port}`);

    app.use(express.json());
    app.all('/render', getValidateQuery(CombileTypeName.RenderRequest), render);
    app.listen(port);
}

main();
