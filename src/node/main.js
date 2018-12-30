const _ = require('lodash');
const names = require('./names');
const assert = require('./assert');
const dbf = require('./dbf');
const int = require('./internal');
const mapAsync = require('./map-async');
const urls = require('./urls');
const files = require('./files');
const arrays = require('./arrays');
const Source = require('./data-source/source');
const SourceExample = require('./data-source/source-example');
const SourceNbuAPI = require('./data-source/source-nbu-api');
const SourceNbuDBF = require('./data-source/source-nbu-dbf');
const SourceNbuPDF = require('./data-source/source-nbu-pdf');
const SourceNbuUI = require('./data-source/source-nbu-ui');
const SourceFund = require('./data-source/source-fund');
const SourceMinfin = require('./data-source/source-minfin');

// let t = require('../src/test');
// console.log(t.hello());

// new Source().getBanks().then(console.log);
// new SourceExample().getBanks().then(console.log);

// const sources = _.keyBy([
//     new SourceNbuDBF(),
//     new SourceNbuAPI(),
//     new SourceNbuUI(),
//     new SourceNbuPDF(),
//     new SourceFund(),
//     new SourceMinfin()
// ], 'type');

const startTime = new Date();
const sourceMinfin = new SourceMinfin();
Promise.all([
    getBanks().then(banks => files.write('../../public/banks.json', toJson(banks))),
    getRatings().then(ratings => files.write('../../public/minfin-ratings.json', toJson(ratings)))
]).then(() => console.log('Total time:', new Date() - startTime));

// TODO: do it inside files.write?
function toJson(obj) {
    return JSON.stringify(obj, null, 2);
}

function getBanks() {
    const sources = [
        new SourceNbuDBF(),
        new SourceNbuAPI(),
        new SourceNbuUI(),
        new SourceNbuPDF(),
        new SourceFund(),
        sourceMinfin
    ];
    return Promise.all(sources.map(source => source.getBanks())).then((results) => {
        const bankMap = arrays.toMap(sources, source => source.type, (source, index) => results[index]);
        return combineBanks(bankMap);
    });
}

function getRatings() {
    return sourceMinfin.getRatings();
}

function combineBanks(allBanks) {
    return names.rebuildBankNames(allBanks).then(bankNameMap => {
        const bankMap = _.mapValues(allBanks, typeBanks => {
            const typeBankMap = {};
            typeBanks.forEach(bank => {
                const name = bank.names[0];
                bank.name = bankNameMap[name] || name;
                assert.false('Duplicate bank name', typeBankMap[bank.name], bank.name);
                typeBankMap[bank.name] = bank;
            });
            return typeBankMap;
        });

        _.forOwn(bankMap, (typeBanks, type) => console.log(type + ':', Object.keys(typeBanks).length));
        const ids = _.union(...Object.values(bankMap).map(typeBanks => Object.keys(typeBanks))).sort();
        console.log('Union:', ids.length);

        return ids.map(id => {
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
    });
}

function definedValues(object) {
    return Object.values(object).filter(value => !_.isUndefined(value));
}