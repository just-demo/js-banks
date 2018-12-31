// npx babel-node main.js
import files from './files';
import Source from './data-source/source';

import testES6 from './testES6';
// import test from '../test';
console.log(testES6.test());

const startTime = new Date();
const source = new Source();
Promise.all([
    source.getBanks().then(banks => files.writeJson('../../public/banks.json', banks)),
    source.getRatings().then(ratings => files.writeJson('../../public/minfin-ratings.json', ratings))
]).then(() => console.log('Total time:', new Date() - startTime));