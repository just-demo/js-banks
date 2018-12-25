const PromisePool = require('es6-promise-pool');

module.exports = function AsyncMapperPool(items, itemMapper, poolSize) {
    poolSize = poolSize || 10;
    this.start = function() {
        const promises = function * () {
            for (let item of items) {
                yield new Promise(resolve => resolve(itemMapper(item)));
            }
        };
        const pool = new PromisePool(promises(), poolSize);
        const result = [];
        pool.addEventListener('fulfilled', (event) => event.data.result !== null && result.push(event.data.result));
        return pool.start().then(() => result);
    }
};