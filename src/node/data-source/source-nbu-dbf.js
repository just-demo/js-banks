const names = require('../names');
const ext = require('../external');
const int = require('../internal');
const dates = require('../dates');
const assert = require('../assert');
const arj = require('../arj');
const dbf = require('../dbf');

module.exports = {
    // Банківський нагляд -> Реєстрація та ліцензування -> Довідник банків -> Імпорт:
    // https://bank.gov.ua/control/uk/bankdict/search
    getBanks() {
        const banks = {};
        int.read('nbu/banks-dbf').forEach(bank => {
            bank.name = names.bankName(bank.name);
            assert.false('Duplicate bank name', banks[bank.name], bank.name);
            banks[bank.name] = bank;
        });
        return banks;
    },

    saveBanks() {
        return new Promise(resolve => {
            const arjContent = ext.download('nbu/rcukru.arj', 'https://bank.gov.ua/files/RcuKru.arj');
            const dbfContent = arj.unpack(arjContent);
            const records = dbf.parse(dbfContent);
            const header = records[0];
            const banks = records.slice(1).map(record => {
                const map = {};
                header.forEach((field, index) => map[field] = record[index]);
                return map;
            }).filter(record => {
                const isMainNum = record['GLB'] === record['PRKB'];
                const isMainName = !!record['NLF'];
                assert.equals('Different main indicator - ' + record['FULLNAME'], isMainNum, isMainName);
                return isMainNum;
            }).filter(record => {
                const isBankType = !!record['VID'];
                const isBankReg = !!record['DATAR'];
                const isBankGroup = !!record['GR1'];
                // TODO: Приватне акцўонерне товариство "Укра∙нська фўнансова група"?
                assert.equals('Different main indicator - ' + record['FULLNAME'], isBankType, isBankReg, isBankGroup);
                return isBankType;
            }).map(record => {
                assert.equals('Different date - ' + record['FULLNAME'], record['DATAR'], record['D_OPEN']);
                return {
                    id: record['SID'],
                    name: names.extractBankPureName(record['SHORTNAME']),
                    fullName: names.extractBankPureName(record['FULLNAME']),
                    dateRegister: dates.formatTimestamp(record['DATAR']),
                    dateOpen: dates.formatTimestamp(record['D_OPEN']),
                    active: record['REESTR'].toUpperCase() !== 'Л'
                };
            });
            banks.sort(names.compareName);
            int.write('nbu/banks-dbf', banks);
            resolve(banks);
        });
    }
};