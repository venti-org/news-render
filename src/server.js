const express = require('express');
const { Browser } = require('./browser');

let browser = new Browser();

async function render(request, response) {
    let req = request.body;
    let url = req.url;
    let resp = await browser.render(req);
    response.send(resp);
}

let app = express();

async function main() {
    await browser.init();

    let port = 3000;
    console.log(`listen 0.0.0.0:${port}`);

    app.use(express.json());
    app.post('/render', render);
    app.listen(port);
}

main();
