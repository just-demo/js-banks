// npx babel-node refresh.js > log.txt
import express from 'express';
import cors from 'cors';
import Source from '../../src/node/data-source/source';
import Audit from '../../src/node/data-source/audit';
import cache from '../../src/node/cache';

const port = 3333;

express()
    .use(cors())
    .use(express.json())
    .post('', (req, res) => res.send(refresh(true, req.body.clearCache)))
    .get('', (req, res) => res.send(refresh()))
    .listen(port, () => console.log('Server started:', port));

let audit = null;
let result = null;

function refresh(restart, clearCache) {
    if ((restart || !result) && !audit) {
        audit = new Audit();
        result = null;
        const source = new Source(audit);
        Promise.resolve(clearCache && cache.clear())
            .then(() => Promise.all([source.getBanks(), source.getRatings()]))
            .then(results => {
                result = {
                    banks: results[0],
                    ratings: results[1]
                };
                audit = null;
            });
    }

    return result ? result : {
        progress: {ready: audit.ready(), now: new Date().getTime(),...audit.progress()}
    };
}