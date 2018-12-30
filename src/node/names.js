const _ = require('lodash');
const int = require('./internal');
const assert = require('./assert');
const regex = require('./regex');
const arrays = require('./arrays');

module.exports = {

    siteName(site) {
        return site.replace(/(?<!:|:\/)\/(?!ukraine$).*/g, '');
    },

    rebuildBankNames(bankMap) {
        return int.read('names/banks-manual').then(manualNames => {
            let nameGroups = _.flatten(Object.values(bankMap)).map(bank => bank.names);
            nameGroups.push(...manualNames);
            nameGroups = nameGroups.map(names => _.sortBy(names, 'length'));
            // Do not sort final groups because we should make sure PDF groups go last (there is implicit dependency on bankMap order),
            // otherwise merged/renamed banks from PDF source will override relevant names from other sources
            nameGroups = nameGroups.map(names => buildVariants(names));
            return int.write('names/banks', arrays.combineIntersected(nameGroups).sort(arrays.compare))
                .then(bankNames => {
                    const lookupMap = {};
                    bankNames.forEach(sameNames => sameNames.forEach(value => lookupMap[value] = sameNames[0]));
                    return lookupMap;
                })
        });
    },

    extractBankPureName(bankFullName) {
        let name = bankFullName;
        name = regex.findSingleValue(name, /.*«(.+?)»/) || name;
        name = regex.findSingleValue(name, /.*"(.+?)"/) || name;
        name = regex.findSingleValue(name, /.*\s'(.+?)'/) || name;
        assert.notEquals('Full name is pure name', name, bankFullName);
        return this.normalize(name);
    },

    normalize(name) {
        return name.toUpperCase()
            .replace(/`/g, '\'')
            .replace(/\s+/g, ' ')
            .replace(/\s*-\s*/g, '-')
            .replace(/^БАНК /, '')
            .replace(/ БАНК$/, '');
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
        const name2 = name1.replace(/\s+/g, '-');
        const name3 = name2.replace(/-/g, ' ');
        variants.push(name1, name2, name3);
    });
    return _.uniq(variants);
}