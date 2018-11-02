let bg = require('./source-nbu');
let fg = require('./source-fund');
let mf = require('./source-minfin');
let _ = require('lodash');
let utils = require('./utils');
let names = require('./names');

bg.saveAll();
fg.saveAll();
mf.saveAll();
names.rebuildBankNames();

function compareGovApiBanks() {
    const dbfBanks = bg.getBanksDBF();
    const apiBanks = bg.getBanksAPI();
    const dbfBankIds = Object.keys(dbfBanks);
    const apiBankIds = Object.keys(apiBanks);
    console.log(dbfBankIds.length);
    console.log(apiBankIds.length);
    console.log(_.intersection(dbfBankIds, apiBankIds).length);
    console.log(_.union(dbfBankIds, apiBankIds).length);
    _.union(dbfBankIds, apiBankIds).forEach(id => {
        // TODO: need id?
        // if (dbfBanks[id].id !== apiBanks[id].id) {
        //     console.log('Id mismatch: ', id, dbfBanks[id].id, apiBanks[id].id);
        // }
        if (dbfBanks[id].active !== apiBanks[id].active) {
            // TODO: ФІНАНСОВА ІНІЦІАТИВА ???
            console.log('Active mismatch: ', id, dbfBanks[id].active, apiBanks[id].active);
        }
        if (dbfBanks[id].dateOpen !== apiBanks[id].dateOpen) {
            // TODO: compare with bg.getBanks()...name
            console.log('DateOpen mismatch: ', id, dbfBanks[id].dateOpen, apiBanks[id].dateOpen);
        }
    });
}

function compareBanks() {
    const bgBanks = bg.getBanks();
    const fgBanks = fg.getBanks();
    const mfBanks = mf.getBanks();
    const bgBankIds = Object.keys(bgBanks);
    const fgBankIds = Object.keys(fgBanks);
    const mfBanksIds = Object.keys(mfBanks);
    console.log(bgBankIds.length);
    console.log(fgBankIds.length);
    console.log(mfBanksIds.length);
    console.log(_.intersection(bgBankIds, fgBankIds, mfBanksIds).length);
    console.log(_.union(bgBankIds, fgBankIds, mfBanksIds).length);

    const banks = _.union(bgBankIds, fgBankIds, mfBanksIds).sort().map(id => {
        return {
            id: id,
            bg: (bgBanks[id] || {}).name,
            fg: (fgBanks[id] || {}).name,
            mf: mfBanks[id],
            site: (fgBanks[id] || {}).site
        };
    });

    utils.writeFile('../public/banks.json', utils.toJson(banks));
}

function compareGovBanks() {
    const dbfBanks = bg.getBanksDBF();
    const bgBanks = bg.getBanks();
    const fgBanks = fg.getBanks();
    //     _.pickBy(fg.getBanks(), function(bank, id) {
    //     return !bank.link;
    // });

    const dbfBankIds = Object.keys(dbfBanks);
    const bgBankIds = Object.keys(bgBanks);
    const fgBankIds = Object.keys(fgBanks);
    console.log(dbfBankIds.length);
    console.log(bgBankIds.length);
    console.log(fgBankIds.length);
    console.log(_.intersection(dbfBankIds, bgBankIds, fgBankIds).length);
    console.log(_.union(dbfBankIds, bgBankIds, fgBankIds).length);

    const banks = _.union(dbfBankIds, bgBankIds, fgBankIds).sort().map(id => {
        const bank = {
            id: id,
            active: (dbfBanks[id] || {}).active,
            fgActive: (fgBanks[id] || {}).active,
            dbf: (dbfBanks[id] || {}).name,
            bg: (bgBanks[id] || {}).name,
            fg: (fgBanks[id] || {}).name
        };
        if (typeof(bank.active) === typeof(bank.fgActive) && bank.active !== bank.fgActive) {
            console.log('Active mismatch:', id, bank.active, bank.fgActive);
        }

        return bank;
    });

    utils.writeFile('../public/banks.gov.json', utils.toJson(banks));
}