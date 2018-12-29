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
    nbuAPI.saveBanks(),
    nbuDBF.saveBanks(),
    nbuPDF.saveBanks(),
    nbuUI.saveBanks(),
    fund.saveBanks(),
    minfin.saveBanks(),
    minfin.saveRatings()
]).then(() => {
    names.rebuildBankNames();
    combineBanks();
    console.log('Total time:', new Date() - startTime);
});
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
    const apiBanks = nbuAPI.getBanks();
    const dbfBanks = nbuDBF.getBanks();
    const pdfBanks = nbuPDF.getBanks();
    const nbuBanks = nbuUI.getBanks();
    const fundBanks = fund.getBanks();
    const minfinBanks = minfin.getBanks();

    const dbfBankIds = Object.keys(dbfBanks);
    const apiBankIds = Object.keys(apiBanks);
    const nbuBankIds = Object.keys(nbuBanks);
    const pdfBankIds = Object.keys(pdfBanks);
    const fundBankIds = Object.keys(fundBanks);
    const minfinBankIds = Object.keys(minfinBanks);
    console.log('DBF:', dbfBankIds.length);
    console.log('API:', apiBankIds.length);
    console.log('NBU UI:', nbuBankIds.length);
    console.log('NBU PDF:', pdfBankIds.length);
    console.log('Fund:', fundBankIds.length);
    console.log('Minfin:', minfinBankIds.length);
    console.log('Intersection:', _.intersection(dbfBankIds, apiBankIds, nbuBankIds, pdfBankIds, fundBankIds, minfinBankIds).length);
    console.log('Union:', _.union(dbfBankIds, apiBankIds, nbuBankIds, pdfBankIds, fundBankIds, minfinBankIds).length);

    const banks = _.union(dbfBankIds, apiBankIds, nbuBankIds, pdfBankIds, fundBankIds, minfinBankIds).sort().map(id => {
        const bank = {
            id: id,
            name: {
                // TODO: collect names somehow as well
                dbf: (dbfBanks[id] || {}).name,
                api: (apiBanks[id] || {}).name,
                nbu: (nbuBanks[id] || {}).name,
                pdf: (pdfBanks[id] || {}).name,
                fund: (fundBanks[id] || {}).name,
                minfin: (minfinBanks[id] || {}).name
            },
            active: {
                dbf: (dbfBanks[id] || {}).active,
                api: (apiBanks[id] || {}).active,
                nbu: (nbuBanks[id] || {}).active,
                pdf: (pdfBanks[id] || {}).active,
                fund: (fundBanks[id] || {}).active
            },
            dateOpen: {
                dbf: (dbfBanks[id] || {}).start,
                api: (apiBanks[id] || {}).start,
                nbu: (nbuBanks[id] || {}).start
            },
            dateIssue: {
                // TODO: fix undefined before this
                api: (apiBanks[id] || {}).problem || undefined,
                nbu: (nbuBanks[id] || {}).problem,
                pdf: (pdfBanks[id] || {}).problem || undefined,
                fund: (fundBanks[id] || {}).problem,
            },
            site: {
                // TODO: do need empty array be default?
                fund: (fundBanks[id] || {}).sites,
                minfin: (minfinBanks[id] || {}).sites
            },
            internal: {
                id: {
                    minfin: (minfinBanks[id] || {}).id
                },
                link: {
                    nbu: (nbuBanks[id] || {}).link,
                    pdf: (pdfBanks[id] || {}).link,
                    fund: (fundBanks[id] || {}).link,
                    minfin: (minfinBanks[id] || {}).link
                }
            }
        };
        assert.equals('Name mismatch - ' + id + ' - ' + JSON.stringify(bank.name), ...definedValues(bank.name));
        assert.equals('Active mismatch - ' + id + ' - ' + JSON.stringify(bank.active), ...definedValues(bank.active));
        assert.equals('DateOpen mismatch - ' + id + ' - ' + JSON.stringify(bank.dateOpen), ...definedValues(bank.dateOpen));
        if (bank.dateOpen.dbf && Object.values(bank.dateOpen).filter(d => d).length < 2) {
            console.log('AAA - ' + id + ' - ' + JSON.stringify(bank.dateOpen))
        }
        return bank;
    });

    files.write('../../public/banks.json', JSON.stringify(banks, null, 2));
    files.read('../../data/json/minfin/ratings.json')
        .then(ratings => files.write('../../public/minfin-ratings.json', ratings));
}

function definedValues(object) {
    return Object.values(object).filter(value => !_.isUndefined(value));
}