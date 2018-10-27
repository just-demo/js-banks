let utils = require('./utils');
let path = require('path');
let _ = require('lodash');

module.exports = {
    bankNames: null,
    bankName: function(name) {
        this.bankNames = this.bankNames || this.loadBankNames();
        name = name.toUpperCase();
        return this.bankNames[name] || name;
    },

    loadBankNames: function() {
        const names = {};
        utils.fromJson(utils.readFile(this.jsonBanksFile())).forEach(synonyms => {
            const baseName = synonyms[0];
            synonyms.forEach(name => {
                names[name.toUpperCase()] = baseName;
            });
        });
        return names;
    },

    ////////// files \\\\\\\\\\
    jsonBanksFile: function () {
        return path.resolve(this.dataFolder(), 'banks.json');
    },

    dataFolder: function () {
        return path.resolve('.', 'names');
    }
};