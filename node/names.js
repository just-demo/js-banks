let int = require('./internal');
let assert = require('./assert');
let _ = require('lodash');

module.exports = {
    bankNames: null,

    bankName(name) {
        this.bankNames = this.bankNames || toLookupMap(int.read('names/banks'));
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
        const compareFirst = (a, b) => a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0;
        const dbfNames = int.read('nbu/banks-dbf').map(bank => buildVariants([bank.name, bank.fullName]));
        dbfNames.sort(compareFirst);
        int.write('names/banks-dbf', dbfNames);
        const pdfNames = int.read('nbu/banks-pdf').map(bank => buildVariants(bank.name));
        pdfNames.sort(compareFirst);
        int.write('names/banks-pdf', pdfNames);
        const manualNames = int.read('names/banks-manual');
        int.write('names/banks', combineArrays(dbfNames, pdfNames, manualNames));
    },

    extractBankPureName(bankFullName) {
        const match = bankFullName.match(/.*["«](.+?)["»]/);
        return assert.true('Full name is pure name', match, bankFullName) ? match[1] : bankFullName;
    },

    // TODO: consider creating normalizeBankName that would additionally remove "БАНК" prefix and suffix
    normalize(name) {
        return name.toUpperCase()
            .replace(/\s+/g, ' ')
            .replace(/\s*-\s*/g, '-');
    }
};

function buildVariants(names) {
    const variants = [];
    names.map(name => name.toUpperCase()).forEach(name1 => {
        // TODO: simplify after every place start using names.normalize
        const name2 = name1.replace(/\s*-\s*/g, '-');
        const name3 = name2.replace(/\s+/g, '-');
        const name4 = name3.replace(/-/g, ' ');
        [name1, name2, name3, name4].forEach(name => variants.push(name));
    });
    return _.uniq(variants);
}

function combineArrays(...arrays) {
    const combined = [];
    arrays.forEach(array => array.forEach(values => {
        const existing = combined.find(v => intersected(v, values));
        if (existing) {
            existing.push(...values);
        } else {
            combined.push([...values]);
        }
    }));
    return combined.map(array => _.uniq(array));
}

function intersected(array1, array2) {
    // TODO: optimize
    return !!_.intersection(array1, array2).length;
}

function toLookupMap(values) {
    const map = {};
    values.forEach(sameValues => {
        sameValues.forEach(value => map[value.toUpperCase()] = sameValues[0]);
    });
    return map;
}