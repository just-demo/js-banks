import PromisePool from 'es6-promise-pool';

export default function (items, itemMapper, poolSize) {
    const promises = function* () {
        for (let item of items) {
            yield Promise.resolve(itemMapper(item));
        }
    };
    const pool = new PromisePool(promises(), poolSize || 10);
    const result = [];
    pool.addEventListener('fulfilled', (event) => event.data.result !== null && result.push(event.data.result));
    return pool.start().then(() => result);
};