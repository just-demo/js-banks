const _ = require('lodash');
const arrays = require('./arrays');
const int = require('./internal');

const DEFAULT_NAMES = [
    ["ПРОМИСЛОВО-ФІНАНСОВИЙ", "ПФБ"],
    ["БАНК РЕНЕСАНС КАПІТАЛ", "РЕНЕСАНС КРЕДИТ"],
    ["СП", "СХІДНО-ПРОМИСЛОВИЙ"],
    ["УФС", "УФС-БАНК"],
    ["ПІРЕУС БАНК МКБ", "ПІРЕУС"],
    ["ДОЙЧЕ БАНК ДБУ", "ДОЙЧЕ"]
];

class BankNameLookup {
    constructor(bankMap) {
        let nameGroups = _.flatten(Object.values(bankMap)).map(bank => bank.names);
        nameGroups.push(...DEFAULT_NAMES);
        nameGroups = nameGroups.map(names => _.sortBy(names, 'length'));
        // Do not sort final groups because we should make sure PDF groups go last (there is implicit dependency on bankMap order),
        // otherwise merged/renamed banks from PDF source will override relevant names from other sources
        // nameGroups = nameGroups.map(names => buildVariants(names));
        nameGroups = arrays.combineIntersected(nameGroups).sort(arrays.compare);
        int.write('names/banks', nameGroups); // it's debug, no need to wait
        this.lookupMap = {};
        nameGroups.forEach(names => names.forEach(name => this.lookupMap[lookupKey(name)] = names[0]));
    }

    lookup(name) {
        return this.lookupMap[lookupKey(name)] || name;
    }
}

module.exports = BankNameLookup;

function lookupKey(name) {
    return name.replace(/-/g, ' ');
}
