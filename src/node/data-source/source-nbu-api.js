const _ = require('lodash');
const names = require('../names');
const convert = require('xml-js');
const ext = require('../external');
const int = require('../internal');
const dates = require('../dates');
const assert = require('../assert');

module.exports = {
    // Публічна інформація у формі відкритих даних -> API сторінки -> Структурні підрозділи банків України:
    // https://bank.gov.ua/control/uk/publish/article?art_id=38441973#get_data_branch
    getBanks() {
        const banks = {};
        int.read('nbu/banks-api').forEach(bank => {
            const name = names.bankName(bank.name);
            assert.false('Duplicate bank name', banks[name], name);
            banks[name] = bank;
        });
        return banks;
    },

    saveBanks() {
        return new Promise(resolve => {
            const xml = ext.read('nbu/banks-api', 'https://bank.gov.ua/NBU_BankInfo/get_data_branch?typ=0', 'cp1251');
            const json = convert.xml2js(xml, {compact: true});
            const banks = json['BANKBRANCH']['ROW']
                .map(row => _.forOwn(row, (value, key) => row[key] = value['_text'] || value['_cdata']))
                .map(record => {
                    return {
                        id: parseInt(record['NKB']),
                        name: names.extractBankPureName(record['SHORTNAME']),
                        dateOpen: dates.format(record['D_OPEN']),
                        dateIssue: dates.format(record['D_STAN']),
                        // 'Нормальний', 'Режим ліквідації', 'Реорганізація', 'Неплатоспроможний'
                        active: ['Нормальний'.toUpperCase(), 'Реорганізація'.toUpperCase()].includes(record['N_STAN'].toUpperCase())
                    };
                });
            banks.sort(names.compareName);
            int.write('nbu/banks-api', banks);
            resolve(banks);
        });
    }
};
