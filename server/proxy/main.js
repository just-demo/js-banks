// npx babel-node main.js
import express from 'express';
import cors from 'cors';
import cache from '../../src/node/cache';
import files from '../../src/node/files';
import logs from '../../src/node/logs';
import arrays from '../../src/node/arrays';

const port = 3333;
express()
    .use(cors())
    .get('/:type/*', (req, res) => {
        const startTime = new Date();
        cache[req.params.type](req.param(0)).then(data => {
            const timeout = Math.max(0, getTimeout(req.query.url) - (new Date() - startTime));
            console.log('Setting timeout:', timeout);
            setTimeout(() => res.send(data), timeout);
        });
    })
    .listen(port, () => console.log('Proxy server started:', port));

let timeouts = {};
files.read('../../public/logs/log1.txt').then(log => {
    timeouts = arrays.toMap(logs.parse(log), req => req.url, req => req.time);
    console.log('Timeouts initiated:', Object.keys(timeouts).length);
});

function getTimeout(url) {
    return timeouts[url] || 0;
}

// http://localhost:3333/read/fund/banks-active?url=http://www.fg.gov.ua/uchasnyky-fondu
// http://localhost:3333/download/nbu/not-banks/pdf/320779.pdf