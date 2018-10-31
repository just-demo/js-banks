let minfin = require('./minfin');
let fg = require('./fg');
let bankGov = require('./bank.gov');
let _ = require('lodash');
let utils = require('./utils');
let dbf = require('./dbf');
let ext = require('./external');
let assert = require('./assert');
let fs = require('fs');
let mkdirp = require('mkdirp');
let path = require('path');
let unzip = require('unzip');
let names = require('./names');

// minfin.fetchAndSaveAllHtml();
// fg.fetchAndSaveAllHtml();
// bankGov.fetchAndSaveAllHtml();
// dbf.extractAndSaveBanks();

// compareBanks();
// compareGovBanks();
// console.log(bankGov.getBanks());

// bankGov.saveAll();
names.rebuildBankNames();
// utils.writeFile('binary/rcukru123.arj', utils.downloadURL('https://bank.gov.ua/files/RcuKru.arj', 'binary'));

// let cont = utils.readFile('binary/rcukru.arj', 'binary');
// utils.writeFile('binary/rcukru.arj', cont, 'binary');

// fs.createReadStream('binary/rcukru.arj').pipe(unzip.Extract({ path: 'binary/out' }));
// fs.createReadStream('binary/test.zip').pipe(unzip.Extract({ path: 'binary/out' }));

// fs.createReadStream('path/to/archive.zip').pipe(unzip.Extract({ path: 'output/path' }));

// request(uri).pipe(fs.createWriteStream('./binary/rcukru.arj'))

//compareGovBanks();

// var AdmZip = require('adm-zip');
//
// var zip = new AdmZip("./binary/rcukru.arj");
// var zipEntries = zip.getEntries(); // an array of ZipEntry records
//
// zipEntries.forEach(function(zipEntry) {
//     console.log(zipEntry.toString()); // outputs zip entries information
// });
//
// var zlib = require('zlib');
//
// zlib.gunzip(utils.readFile('binary/rcukru.arj', 'binary'), function(err, result) {
//     if(err) return console.error(err);
//
//     console.log(result);
// });

function compareGovApiBanks() {
    const dbfBanks = dbf.getBanks();
    const apiBanks = bankGov.getBanksAPI();
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