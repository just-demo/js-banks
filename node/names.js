let int = require('./internal');
let assert = require('./assert');
let _ = require('lodash');

module.exports = {
    bankNames: null,

    bankName(name) {
        this.bankNames = this.bankNames || loadBankNames();
        name = name.toUpperCase();
        return this.bankNames[name] ||
            this.bankNames[name + ' БАНК'] ||
            this.bankNames['БАНК ' + name] ||
            this.bankNames[name.replace(/^БАНК /, '')] ||
            this.bankNames[name.replace(/^БАНК /, '') + ' БАНК'] ||
            this.bankNames[name.replace(/ БАНК$/, '')] ||
            this.bankNames['БАНК ' + name.replace(/ БАНК$/, '')] ||
            this.normalize(name);
    },

    siteName(site) {
        return site.replace(/(?<!:|:\/)\/(?!ukraine$).*/g, '');
    },

    rebuildBankNames() {
        const names = [];
        int.read('nbu/banks-dbf').forEach(bank => {
            const sameNames = new Set();
            [bank.name, bank.fullName].map(name => name.toUpperCase()).forEach(name1 => {
                // TODO: simplify after every place start using names.normalize
                const name2 = name1.replace(/\s*-\s*/g, '-');
                const name3 = name2.replace(/\s+/g, '-');
                const name4 = name3.replace(/-/g, ' ');
                [name1, name2, name3, name4].forEach(name => sameNames.add(name));
            });
            names.push(Array.from(sameNames));
        });
        names.sort((a, b) => a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0);
        int.write('names/banks-dbf', names);
    },

    extractBankPureName(bankFullName) {
        const match = bankFullName.match(/.*["«](.+?)["»]/);
        return assert.true('Full name is pure name', match, bankFullName) ? match[1] : bankFullName;
    },

    normalize(name) {
        return name.toUpperCase()
            .replace(/\s+/g, ' ')
            .replace(/\s*-\s*/g, '-');
    }
};

function loadBankNames() {
    const names = toLookupMap(int.read('names/banks-dbf'));
    const namesManual = toLookupMap(int.read('names/banks-manual'));
    _.forOwn(namesManual, (valueManual, keyManual) => {
        _.forOwn(names, (value, key) => {
            if (value === keyManual) {
                names[key] = valueManual;
            }
        });
        names[keyManual] = valueManual;
    });
    return names;
}

function toLookupMap(values) {
    const map = {};
    values.forEach(sameValues => {
        sameValues.forEach(value => map[value.toUpperCase()] = sameValues[0]);
    });
    return map;
}