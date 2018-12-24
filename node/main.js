let nbu = require('./source-nbu');
let fund = require('./source-fund');
let minfin = require('./source-minfin');
let _ = require('lodash');
let utils = require('./utils');
let names = require('./names');
let assert = require('./assert');
let dbf = require('./dbf');

// nbu.test();
// let t = require('../src/test');
// console.log(t.hello());

// nbu.saveBanksPDF();
// fund.saveAll();
// minfin.saveAll();
// names.rebuildBankNames();

// combineBanks();
dbf.parse('./binary/nbu/RCUKRU.DBF');

function compareGovApiBanks() {
    const dbfBanks = nbu.getBanksDBF();
    const apiBanks = nbu.getBanksAPI();
    const dbfBankIds = Object.keys(dbfBanks);
    const apiBankIds = Object.keys(apiBanks);
    console.log('DBF:', dbfBankIds.length);
    console.log('API:', apiBankIds.length);
    console.log('Intersection:', _.intersection(dbfBankIds, apiBankIds).length);
    console.log('Union:', _.union(dbfBankIds, apiBankIds).length);
    _.union(dbfBankIds, apiBankIds).forEach(id => {
        // TODO: ФІНАНСОВА ІНІЦІАТИВА, ВІЕС БАНК, ЦЕНТР ???
        assert.equals('Active mismatch - ' + id, dbfBanks[id] && dbfBanks[id].active, apiBanks[id] && apiBanks[id].active);
        // TODO: compare with nbu.getBanks()...name
        assert.equals('DateOpen mismatch - ' + id, dbfBanks[id] && dbfBanks[id].dateOpen, apiBanks[id] && apiBanks[id].dateOpen);
    });
}

function combineBanks() {
    const dbfBanks = nbu.getBanksDBF();
    const apiBanks = nbu.getBanksAPI();
    const nbuBanks = nbu.getBanksUI();
    const pdfBanks = nbu.getBanksPDF();
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
                dbf: (dbfBanks[id] || {}).dateOpen,
                api: (apiBanks[id] || {}).dateOpen,
                nbu: (nbuBanks[id] || {}).dateOpen
            },
            dateIssue: {
                // TODO: fix undefined before this
                api: (apiBanks[id] || {}).dateIssue || undefined,
                nbu: (nbuBanks[id] || {}).dateIssue,
                pdf: (pdfBanks[id] || {}).dateIssue || undefined,
                fund: (fundBanks[id] || {}).issue,
            },
            site: {
                fund: (fundBanks[id] || {}).site,
                minfin: [(minfinBanks[id] || {}).site].filter(site => site)
            },
            internal: {
                id: {
                    minfin: (minfinBanks[id] || {}).id
                },
                link: {
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

    utils.writeFile('../public/banks.json', utils.toJson(banks));
    utils.writeFile('../public/minfin-ratings.json', utils.readFile('./json/minfin/ratings.json'));
}

function definedValues(object) {
    return Object.values(object).filter(value => !_.isUndefined(value));
}