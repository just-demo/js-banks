// npx babel-node refresh.js
import express from 'express';
import cors from 'cors';
import Source from "../../src/node/data-source/source";
import Audit from "../../src/node/data-source/audit";

const port = 3333;

express()
    .use(cors())
    .post('', (req, res) => res.send(refresh(true)))
    .get('', (req, res) => res.send(refresh()))
    .listen(port, () => console.log('Server started:', port));

let audit = null;
let result = null;

function refresh(restart) {
    if ((restart || !result) && !audit) {
        audit = new Audit();
        result = null;
        const source = new Source(audit);
        Promise.all([source.getBanks(), source.getRatings()])
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