const express = require('express');
const ext = require('../../src/node/external');

express()
    // .get('/', (req, res) => {
    //     const startTime = new Date();
    //     ext[req.query.type](req.query.file).then(data => {
    //         const timeOut = Math.max(0, getTimeout(req.query.url) - (new Date() - startTime));
    //         setTimeout(() => res.send(data), timeOut);
    //     });
    // })
    // .get('/:type', (req, res) => {
    //     const startTime = new Date();
    //     ext[req.params.type](req.query.file).then(data => {
    //         const timeOut = Math.max(0, getTimeout(req.query.url) - (new Date() - startTime));
    //         setTimeout(() => res.send(data), timeOut);
    //     });
    // })
    .get('/:type/*', (req, res) => {
        const startTime = new Date();
        ext[req.params.type](req.param(0)).then(data => {
            const timeOut = Math.max(0, getTimeout(req.query.url) - (new Date() - startTime));
            setTimeout(() => res.send(data), timeOut);
        });
    })
    .listen(3333, () => console.log('Started!'));

function getTimeout(url) {
    return 0;
}

// http://localhost:3333/read/fund/banks-active
// http://localhost:3333/download/nbu/not-banks/pdf/320779.pdf