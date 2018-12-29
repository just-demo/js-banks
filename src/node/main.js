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

Promise.all([
    nbuDBF.getBanks(),
    nbuAPI.getBanks(),
    nbuUI.getBanks(),
    nbuPDF.getBanks(),
    fund.getBanks(),
    minfin.getBanks(),
    minfin.getRatings()
]).then((results) => {
    const bankMap = {
        dbf: results[0],
        api: results[1],
        nbu: results[2],
        pdf: results[3],
        fund: results[4],
        minfin: results[5]
    };
    names.rebuildBankNames(bankMap).then(() => combineBanks(bankMap));
    console.log('Total time:', new Date() - startTime);
});
// combineBanks();
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

function mapByName(bankNames, banks) {
    const bankMap = {};
    banks.forEach(bank => {
        bank.name = names.lookupName(bankNames, bank.names[0]);
        assert.false('Duplicate bank name', bankMap[bank.name], bank.name);
        bankMap[bank.name] = bank;
    });
    return bankMap;
}

function combineBanks(bankMap) {
    names.rebuildBankNames(bankMap).then(bankNames => {
        bankMap = _.mapValues(bankMap, typeBanks => mapByName(bankNames, typeBanks));
        _.forOwn(bankMap, (typeBanks, type) => console.log(type + ':', Object.keys(typeBanks).length));
        const ids = _.union(...Object.values(bankMap).map(typeBanks => Object.keys(typeBanks))).sort();
        console.log('Union:', ids.length);

        const banks = ids.map(id => {
            const bank = {
                id: id,
                // TODO: collect 'names' field somehow as well, then rename 'id' field to 'name'
                name: {},
                active: {},
                dateOpen: {},
                dateIssue: {},
                site: {},
                internal: {
                    id: {},
                    link: {}
                }
            };
            _.forOwn(bankMap, (typeBanks, type) => {
                const typeBank = typeBanks[id] || {};
                bank.name[type] = typeBank.name;
                bank.active[type] = typeBank.active;
                // TODO: make field names consistent
                bank.dateOpen[type] = typeBank.start;
                bank.dateIssue[type] = typeBank.problem;
                bank.site[type] = typeBank.sites;
                bank.internal.id[type] = typeBank.id;
                bank.internal.link[type] = typeBank.link;
            });
            assert.equals('Name mismatch - ' + id + ' - ' + JSON.stringify(bank.name), ...definedValues(bank.name));
            assert.equals('Active mismatch - ' + id + ' - ' + JSON.stringify(bank.active), ...definedValues(bank.active));
            assert.equals('DateOpen mismatch - ' + id + ' - ' + JSON.stringify(bank.dateOpen), ...definedValues(bank.dateOpen));
            return bank;
        });

        files.write('../../public/banks.json', JSON.stringify(banks, null, 2));
        files.read('../../data/json/minfin/ratings.json')
            .then(ratings => files.write('../../public/minfin-ratings.json', ratings));
    });
}

function definedValues(object) {
    return Object.values(object).filter(value => !_.isUndefined(value));
}