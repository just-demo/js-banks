let Parser = require('node-dbf').default;
let iconv = require('iconv-lite');
let utils = require('./utils');
let _ = require('lodash');
let path = require('path');
let names = require('./names');
let dates = require('./dates');

module.exports = {
    getBanks: function () {
        const banks = {};
        utils.fromJson(utils.readFile(this.jsonBanksFile())).forEach(bank => {
            bank.name = names.bankName(bank.shortName);
            if (banks[bank.name]) {
                console.log('Duplicate bank name', bank.name);
            }
            banks[bank.name] = bank;
        });
        return banks;
    },

    extractAndSaveBanks() {
        const dbf = utils.fromJson(utils.readFile('../public/dbf.json'));
        const header = dbf[0];
        console.log('Count before:', dbf.length - 1);
        const banks = dbf.slice(1).map(record => {
            const map = {};
            header.forEach((field, index) => map[field] = record[index]);
            return map;
        }).filter(record => {
            const isMainNum = record['GLB'] === record['PRKB'];
            const isMainName = !!record['NLF'];
            if (isMainNum !== isMainName) {
                console.log('Different main indicator:', isMainNum, isMainName);
                console.log(record['FULLNAME']);
            }
            return isMainNum;
        }).filter(record => {
            const isBankType = !!record['VID'];
            const isBankReg = !!record['DATAR'];
            const isBankGroup = !!record['GR1'];
            if (isBankReg !== isBankType || isBankType !== isBankGroup) {
                // TODO: Приватне акцўонерне товариство "Укра∙нська фўнансова група"?
                console.log('Different type indicator:', isBankType, isBankReg, isBankGroup);
                console.log(record['FULLNAME']);
            }
            return isBankType;
        }).map(record => {
            const bank = {
                id: record['SID'],
                shortName: names.extractBankPureName(this.fixChars(record['SHORTNAME'])),
                fullName: names.extractBankPureName(this.fixChars(record['FULLNAME'])),
                dateRegister: dates.formatTimestamp(record['DATAR']),
                dateOpen: dates.formatTimestamp(record['D_OPEN']),
                active: record['REESTR'].toUpperCase() !== 'Л'
            };
            if (bank.dateRegister !== bank.dateOpen) {
                console.log('Different date:', bank.dateRegister, bank.dateOpen)
            }
            return bank;
        });

        console.log('Count after:', banks.length);

        utils.writeFile(this.jsonBanksFile(), utils.toJson(banks));
    },

    fetchAndExtractDbf() {
        let parser = new Parser('RCUKRU.DBF', {encoding: 'binary'});

        const banks = [];
        parser.on('record', (record) => {
            banks.push({
                shortName: this.decode(record['SHORTNAME']),
                fullName: this.decode(record['FULLNAME'])
            });
        });

        parser.on('end', () => {
            // TODO: shortName is prepended with extra data and fullName is empty, that is why using java parser instead for now...
            console.log(banks);
        });

        parser.parse();
    },

    decodeDbfValue(value) {
        return this.fixChars(iconv.decode(iconv.encode(value, 'binary'), 'cp866'));
    },

    fixChars(value) {
        return _.isString(value) ? value
            .replace(/Ї/g, 'Є')
            .replace(/°/g, 'Ї')
            .replace(/∙/g, 'ї')
            .replace(/Ў/g, 'І')
            .replace(/ў/g, 'і') : value;
    },

    jsonBanksFile() {
        return path.resolve('.', 'dbf', 'json', 'banks.json');
    }
};