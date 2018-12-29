const nbuAPI = require('./data-source/source-nbu-api');
const nbuDBF = require('./data-source/source-nbu-dbf');
const nbuPDF = require('./data-source/source-nbu-pdf');
const nbuUI = require('./data-source/source-nbu-ui');
const fund = require('./data-source/source-fund');
const minfin = require('./data-source/source-minfin');
const _ = require('lodash');
const names = require('./names');
const assert = require('./assert');
const dbf = require('./dbf');
const int = require('./internal');
const mapAsync = require('./map-async');
const urls = require('./urls');
const files = require('./files');
const Source = require('./data-source/source');
const SourceExample = require('./data-source/source-example');

// let t = require('../src/test');
// console.log(t.hello());

// mapAsync(['a', 'b', 'c', 'd', 'e'], file => {
//     return new Promise(resolve => {
//         setTimeout(() => {
//             console.log(file);
//             resolve(file + '_done');
//         }, 1000);
//     });
// }, 2).then(result => console.log(result));

// class Source {
//     getBanks() {
//         return 'test!';
//     }
// }

// new Source().getBanks().then(console.log);
// new SourceExample().getBanks().then(console.log);

const startTime = new Date();

// Promise.all([
//     nbuAPI.saveBanks(),
//     nbuDBF.saveBanks(),
//     nbuPDF.saveBanks(),
//     nbuUI.saveBanks(),
//     fund.saveBanks(),
//     minfin.saveBanks(),
//     minfin.saveRatings()
// ]).then(() => {
//     names.rebuildBankNames().then(() => combineBanks());
//     console.log('Total time:', new Date() - startTime);
// });
combineBanks();
// names.rebuildBankNames();

// Promise.all([
//     test(),
//     test(),
//     test()
// ]).then((results) => {
//     console.log('Total time:', new Date() - startTime);
//     console.log(results);
// });
//
// function test() {
//     return new Promise(resolve => resolve(utils.asyncReadURL("http://localhost:3333/")));
// }

// utils.asyncReadURL('https://bank.gov.ua/NBU_BankInfo/get_data_branch?typ=0', 'cp1251').then(data => console.log(data));
// urls.read('https://bank.gov.ua/NBU_BankInfo/get_data_branch?typ=0', 'cp1251').then(data =>
//     files.write('../../tmp/1.txt', data));
// urls.download('https://bank.gov.ua/files/Licences_bank/320779.pdf').then(data =>
//     files.writeRaw('../../tmp/1.pdf', data));
//
//
// files.exists('../../tmp/1.txt').then(res => console.log(res));
// files.exists('../../tmp/2.txt').then(res => console.log(res));
//
// files.read('../../tmp/1.txt').then(data =>
//     files.write('../../tmp/2.txt', data));
// files.readRaw('../../tmp/1.pdf').then(data =>
//     files.writeRaw('../../tmp/2.pdf', data));


// combineBanks();
// dbf.parse('../../data/binary/nbu/RCUKRU.DBF');

// const banks = int.read('nbu/banks-pdf');
// banks.sort(names.compareNames);
// int.write('nbu/banks-pdf0', banks);

///home/pc/Desktop/projects/js-banks/data/json/nbu/banks-pdf.json

function combineBanks() {
    const bankMap = {
        api: nbuAPI.getBanks(),
        dbf: nbuDBF.getBanks(),
        pdf: nbuPDF.getBanks(),
        nbu: nbuUI.getBanks(),
        fund: fund.getBanks(),
        minfin: minfin.getBanks()
    };

    const idMap = _.mapValues(bankMap, banks => Object.keys(banks));
    _.forOwn(idMap, (ids, type) => console.log(type + ':', ids.length));

    const banks = _.union(...Object.values(idMap)).sort().map(id => {
        const bank = {
            id: id,
            name: {
                // TODO: collect names somehow as well
                dbf: (bankMap.dbf[id] || {}).name,
                api: (bankMap.api[id] || {}).name,
                nbu: (bankMap.nbu[id] || {}).name,
                pdf: (bankMap.pdf[id] || {}).name,
                fund: (bankMap.fund[id] || {}).name,
                minfin: (bankMap.minfin[id] || {}).name
            },
            active: {
                dbf: (bankMap.dbf[id] || {}).active,
                api: (bankMap.api[id] || {}).active,
                nbu: (bankMap.nbu[id] || {}).active,
                pdf: (bankMap.pdf[id] || {}).active,
                fund: (bankMap.fund[id] || {}).active
            },
            dateOpen: {
                dbf: (bankMap.dbf[id] || {}).start,
                api: (bankMap.api[id] || {}).start,
                nbu: (bankMap.nbu[id] || {}).start
            },
            dateIssue: {
                api: (bankMap.api[id] || {}).problem,
                nbu: (bankMap.nbu[id] || {}).problem,
                pdf: (bankMap.pdf[id] || {}).problem,
                fund: (bankMap.fund[id] || {}).problem,
            },
            site: {
                fund: (bankMap.fund[id] || {}).sites,
                minfin: (bankMap.minfin[id] || {}).sites
            },
            internal: {
                id: {
                    minfin: (bankMap.minfin[id] || {}).id
                },
                link: {
                    nbu: (bankMap.nbu[id] || {}).link,
                    pdf: (bankMap.pdf[id] || {}).link,
                    fund: (bankMap.fund[id] || {}).link,
                    minfin: (bankMap.minfin[id] || {}).link
                }
            }
        };
        assert.equals('Name mismatch - ' + id + ' - ' + JSON.stringify(bank.name), ...definedValues(bank.name));
        assert.equals('Active mismatch - ' + id + ' - ' + JSON.stringify(bank.active), ...definedValues(bank.active));
        assert.equals('DateOpen mismatch - ' + id + ' - ' + JSON.stringify(bank.dateOpen), ...definedValues(bank.dateOpen));
        return bank;
    });

    files.write('../../public/banks.json', JSON.stringify(banks, null, 2));
    files.read('../../data/json/minfin/ratings.json')
        .then(ratings => files.write('../../public/minfin-ratings.json', ratings));
}

function definedValues(object) {
    return Object.values(object).filter(value => !_.isUndefined(value));
}