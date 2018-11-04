let nbu = require('./source-nbu');
let fund = require('./source-fund');
let minfin = require('./source-minfin');
let _ = require('lodash');
let utils = require('./utils');
let names = require('./names');
let assert = require('./assert');

// nbu.saveAll();
// fund.saveAll();
// minfin.saveAll();
// names.rebuildBankNames();

compareGovBanks();

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

function compareGovBanks() {
    const dbfBanks = nbu.getBanksDBF();
    const apiBanks = nbu.getBanksAPI();
    const nbuBanks = nbu.getBanksUI();
    const fundBanks = fund.getBanks();
    const minfinBanks = minfin.getBanks();

    const dbfBankIds = Object.keys(dbfBanks);
    const apiBankIds = Object.keys(apiBanks);
    const nbuBankIds = Object.keys(nbuBanks);
    const fundBankIds = Object.keys(fundBanks);
    const minfinBankIds = Object.keys(minfinBanks);
    console.log('DBF:', dbfBankIds.length);
    console.log('API:', apiBankIds.length);
    console.log('NBU UI:', nbuBankIds.length);
    console.log('Fund:', fundBankIds.length);
    console.log('Minfin:', minfinBankIds.length);
    console.log('Intersection:', _.intersection(dbfBankIds, apiBankIds, nbuBankIds, fundBankIds, minfinBankIds).length);
    console.log('Union:', _.union(dbfBankIds, apiBankIds, nbuBankIds, fundBankIds, minfinBankIds).length);

    const banks = _.union(dbfBankIds, apiBankIds, nbuBankIds, fundBankIds, minfinBankIds).sort().map(id => {
        const bank = {
            id: id,
            name: {
                dbf: (dbfBanks[id] || {}).name,
                api: (apiBanks[id] || {}).name,
                nbu: (nbuBanks[id] || {}).name,
                fund: (fundBanks[id] || {}).name,
                minfin: (minfinBanks[id] || {}).name
            },
            active: {
                dbf: (dbfBanks[id] || {}).active,
                api: (apiBanks[id] || {}).active,
                fund: (fundBanks[id] || {}).active
            },
            dateOpen: {
                dbf: (dbfBanks[id] || {}).dateOpen,
                api: (apiBanks[id] || {}).dateOpen,
                nbu: (nbuBanks[id] || {}).date
            },
            site: {
                fund: (fundBanks[id] || {}).site,
                minfin: [(minfinBanks[id] || {}).site].filter(site => site)
            }
        };
        assert.equals('Name mismatch - ' + id + ' - ' + JSON.stringify(bank.name), ...definedValues(bank.name));
        assert.equals('Active mismatch - ' + id + ' - ' + JSON.stringify(bank.active), ...definedValues(bank.active));
        assert.equals('DateOpen mismatch - ' + id + ' - ' + JSON.stringify(bank.dateOpen), ...definedValues(bank.dateOpen));
        return bank;
    });

    utils.writeFile('../public/banks.gov.json', utils.toJson(banks));
}

function definedValues(object) {
    return Object.values(object).filter(value => !_.isUndefined(value));
}

function compareBanks() {
    const nbBanks = nbu.getBanks();
    const fundBanks = fund.getBanks();
    const mfBanks = minfin.getBanks();
    const nbBankIds = Object.keys(nbBanks);
    const fundBankIds = Object.keys(fundBanks);
    const mfBanksIds = Object.keys(mfBanks);
    console.log(nbBankIds.length);
    console.log(fundBankIds.length);
    console.log(mfBanksIds.length);
    console.log(_.intersection(nbBankIds, fundBankIds, mfBanksIds).length);
    console.log(_.union(nbBankIds, fundBankIds, mfBanksIds).length);

    const banks = _.union(nbBankIds, fundBankIds, mfBanksIds).sort().map(id => {
        return {
            id: id,
            nb: (nbBanks[id] || {}).name,
            fd: (fundBanks[id] || {}).name,
            mf: mfBanks[id],
            site: (fundBanks[id] || {}).site
        };
    });

    utils.writeFile('../public/banks.json', utils.toJson(banks));
}