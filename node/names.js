let int = require('./internal');
let assert = require('./assert');

module.exports = {
    bankNames: null,

    bankName(name) {
        this.bankNames = this.bankNames || loadBankNames();
        name = name.toUpperCase();
        return this.bankNames[name] || name.replace(/\s*-\s*/g, '-');
    },

    siteName(site) {
        return site.replace(/(?<!:|:\/)\/(?!ukraine$).*/g, '');
    },

    rebuildBankNames() {
        const names = [];
        int.read('nbu/banks').forEach(bank => {
            const sameNames = new Set();
            [bank.name, bank.fullName].map(name => name.toUpperCase()).forEach(name1 => {
                const name2 = name1.replace(/\s*-\s*/g, '-');
                const name3 = name2.replace(/\s+/g, '-');
                const name4 = name3.replace(/-/g, ' ');
                [name1, name2, name3, name4].forEach(name => sameNames.add(name));
            });
            if (sameNames.size > 1) {
                names.push(Array.from(sameNames));
            }
        });
        int.write('names/banks', names);
    },

    extractBankPureName(bankFullName) {
        const match = bankFullName.match(/.*["«](.+?)["»]/);
        return assert.true('Full name is pure name', match, bankFullName) ? match[1] : bankFullName;
    }
};

function loadBankNames() {
    const names = {};
    int.read('names/banks').forEach(sameNames => {
        sameNames.forEach(name => names[name.toUpperCase()] = sameNames[0]);
    });
    return names;
}