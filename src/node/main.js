const files = require('./files');
const Source = require('./data-source/source');

const test = require('../test');
console.log(test.testNode());

const startTime = new Date();
const source = new Source();
Promise.all([
    source.getBanks().then(banks => files.writeJson('../../public/banks.json', banks)),
    source.getRatings().then(ratings => files.writeJson('../../public/minfin-ratings.json', ratings))
]).then(() => console.log('Total time:', new Date() - startTime));