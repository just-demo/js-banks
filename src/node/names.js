const _ = require('lodash');
const int = require('./internal');
const assert = require('./assert');
const regex = require('./regex');
const arrays = require('./arrays');

module.exports = {
    // TODO: simplify
    lookupName(bankNames, name) {
        name = name.toUpperCase();
        return bankNames[name] ||
            bankNames[name + ' БАНК'] ||
            bankNames['БАНК ' + name] ||
            bankNames[name.replace(/^БАНК /, '')] ||
            bankNames[name.replace(/^БАНК /, '') + ' БАНК'] ||
            bankNames[name.replace(/ БАНК$/, '')] ||
            bankNames['БАНК ' + name.replace(/ БАНК$/, '')] ||
            this.normalize(name);
    },

    siteName(site) {
        return site.replace(/(?<!:|:\/)\/(?!ukraine$).*/g, '');
    },

    rebuildBankNames(bankMap) {
        // TODO: add more sources!!!
        const dbfNames = bankMap.dbf.map(bank => buildVariants(bank.names));
        const pdfNames = bankMap.pdf.map(bank => buildVariants(bank.names));
        dbfNames.sort(arrays.compare);
        pdfNames.sort(arrays.compare);
        int.write('names/banks-dbf', dbfNames); // it's debug, no need to wait
        int.write('names/banks-pdf', pdfNames); // it's debug, no need to wait
        return int.read('names/banks-manual').then(manualNames =>
            int.write('names/banks', arrays.combineIntersected(
                dbfNames,
                pdfNames,
                manualNames
            )).then(bankNames => toLookupMap(bankNames))
        );
    },

    extractBankPureName(bankFullName) {
        let name = bankFullName;
        name = regex.findSingleValue(name, /.*«(.+?)»/) || name;
        name = regex.findSingleValue(name, /.*"(.+?)"/) || name;
        name = regex.findSingleValue(name, /.*\s'(.+?)'/) || name;
        assert.notEquals('Full name is pure name', name, bankFullName);
        return this.normalize(name);
    },

    // TODO: consider creating normalizeBankName that would additionally remove "БАНК" prefix and suffix
    normalize(name) {
        return name.toUpperCase()
            .replace(/`/g, '\'')
            .replace(/\s+/g, ' ')
            .replace(/\s*-\s*/g, '-');
    },

    removeTags(name) {
        return name.replace(/<[^>]*>/g, '');
    },

    // TODO: move to a better place?
    // Just for predictable sorting taking into account asynchrony being introduced
    compareNames(a, b) {
        return arrays.compare(a.names, b.names);
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

function toLookupMap(values) {
    const map = {};
    values.forEach(sameValues => {
        sameValues.forEach(value => map[value.toUpperCase()] = sameValues[0]);
    });
    return map;
}