const _ = require('lodash');
const names = require('../names');
const convert = require('xml-js');
const cache = require('../cache');
const dates = require('../dates');
const Source = require('./source');

class SourceNbuAPI extends Source {
    // Публічна інформація у формі відкритих даних -> API сторінки -> Структурні підрозділи банків України:
    // https://bank.gov.ua/control/uk/publish/article?art_id=38441973#get_data_branch
    getBanks() {
        return cache.read('nbu/banks-api', 'https://bank.gov.ua/NBU_BankInfo/get_data_branch?typ=0', 'cp1251').then(xml => {
            const json = convert.xml2js(xml, {compact: true});
            const banks = json['BANKBRANCH']['ROW']
                .map(row => _.forOwn(row, (value, key) => row[key] = value['_text'] || value['_cdata']))
                .map(record => ({
                    // id: parseInt(record['NKB']), // not used
                    // TODO: is there full name? if so - add it as well
                    names: [names.extractBankPureName(record['SHORTNAME'])],
                    start: dates.format(record['D_OPEN']),
                    problem: dates.format(record['D_STAN']) || undefined,
                    // 'Нормальний', 'Режим ліквідації', 'Реорганізація', 'Неплатоспроможний'
                    active: ['Нормальний'.toUpperCase(), 'Реорганізація'.toUpperCase()].includes(record['N_STAN'].toUpperCase())
                }));
            banks.sort(names.compareNames);
            return cache.write('nbu/banks-api', banks);
        });
    }
}

module.exports = SourceNbuAPI;