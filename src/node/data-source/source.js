const _ = require('lodash');
const arrays = require('../arrays');
const assert = require('../assert');
const BankNameLookup = require('../bank-name-lookup');
const SourceNbuAPI = require('./source-nbu-api');
const SourceNbuDBF = require('./source-nbu-dbf');
const SourceNbuPDF = require('./source-nbu-pdf');
const SourceNbuUI = require('./source-nbu-ui');
const SourceFund = require('./source-fund');
const SourceMinfin = require('./source-minfin');

class Source {
    constructor() {
        this.sources = {
            // TODO: remove DBF from UI
            // DBF is not supported in browser and needs manual actions in node
            // dbf: new SourceNbuDBF(),
            api: new SourceNbuAPI(),
            nbu: new SourceNbuUI(),
            pdf: new SourceNbuPDF(),
            fund: new SourceFund(),
            minfin: new SourceMinfin()
        };
    }

    getBanks() {
        return Promise.all(Object.values(this.sources).map(source => source.getBanks())).then(results => {
            const bankMap = arrays.toMap(Object.keys(this.sources), _.identity, (type, index) => results[index]);
            return combineBanks(bankMap);
        });
    }

    getRatings() {
        return this.sources.minfin.getRatings();
    }
}

export default Source;

function combineBanks(allBanks) {
    const bankNameLookup = new BankNameLookup(allBanks);
    const bankMap = _.mapValues(allBanks, typeBanks => {
        const typeBankMap = {};
        typeBanks.forEach(bank => {
            const name = bank.names[0];
            bank.name = bankNameLookup.lookup(name);
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
}

function definedValues(object) {
    return Object.values(object).filter(value => !_.isUndefined(value));
}
