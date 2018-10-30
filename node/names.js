let int = require('./internal');

module.exports = {
    bankNames: null,

    bankName: function(name) {
        this.bankNames = this.bankNames || this.loadBankNames();
        name = name.toUpperCase();
        return this.bankNames[name] || name.replace(/\s*-\s*/g, '-');
    },

    rebuildBankNames: function() {
        const names = [];
        int.read('bg/banks').forEach(bank => {
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

    loadBankNames: function() {
        const names = {};
        int.read('names/banks').forEach(sameNames => {
            sameNames.forEach(name => names[name.toUpperCase()] = sameNames[0]);
        });
        return names;
    }
};