import express, { Request, Response } from 'express';
import { Browser } from './browser';
import getValidateQuery from '../validator/validator';
import { CombileTypeName, RenderRequest } from '../validator/validate_types';
import { program } from 'commander';

let browser = new Browser();

async function render(request: Request, response: Response) {
    let req: RenderRequest = request.query as any;
    if (!req || Object.keys(req).length == 0) {
        req = request.body as any;
    }
    console.log(req);
    let resp = await browser.render(req);
    response.send(resp);
}

let app = express();

interface ServerOptions {
    port: number,
};

async function start_server(options: ServerOptions) {
    let port = options.port;

    await browser.init();
    console.log(`listen 0.0.0.0:${port}`);

    app.use(express.json());
    app.all('/render', getValidateQuery(CombileTypeName.RenderRequest), render);
    app.listen(port);
}

async function main() {
    program
        .option('-p, --port <number>', 'server port number', Number, 3000)

    program.parse();

    let options = program.opts();

    await start_server(options as any);
}

main();
