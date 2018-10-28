let minfin = require('./minfin');
let fg = require('./fg');
let bankGov = require('./bank.gov');
let _ = require('lodash');
let utils = require('./utils');
let dbf = require('./dbf');

// minfin.fetchAndSaveAllHtml();
// fg.fetchAndSaveAllHtml();
// bankGov.fetchAndSaveAllHtml();
// dbf.extractAndSaveBanks();

// compareBanks();
compareGovBanks();
// console.log(bankGov.getBanks());

function compareBanks() {
    const bgBanks = bankGov.getBanks();
    const fgBanks = fg.getBanks();
    const mfBanks = minfin.getBanks();
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
    const dbfBanks = dbf.getBanks();
    const bgBanks = bankGov.getBanks();
    const fgBanks = fg.getActiveBanks();
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
        return {
            id: id,
            active: (dbfBanks[id] || {}).active,
            dbf: (dbfBanks[id] || {}).name,
            bg: (bgBanks[id] || {}).name,
            fg: (fgBanks[id] || {}).name
        };
    });

    utils.writeFile('../public/banks.gov.json', utils.toJson(banks));
}