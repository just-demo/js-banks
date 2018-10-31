let utils = require('./utils');
let _ = require('lodash');
let names = require('./names');
let convert = require('xml-js');
let ext = require('./external');
let int = require('./internal');
let dates = require('./dates');
let assert = require('./assert');

module.exports = {
    // https://bank.gov.ua/control/portalmap -> Банківський нагляд -> Реорганізація, припинення та ліквідація
    // https://bank.gov.ua/control/uk/publish/article?art_id=75535&cat_id=17823466
    // https://www.bank.gov.ua/control/bankdict/banks
    // https://bank.gov.ua/control/uk/bankdict/search?name=&type=369&region=&mfo=&edrpou=&size=&group=&fromDate=&toDate=
    // https://bank.gov.ua/control/uk/publish/article?art_id=38441973&cat_id=38459171#get_data_branch
    // https://bank.gov.ua/NBU_BankInfo/get_data_branch?typ=0&json
    getBanks: function () {
        const banks = {};
        int.read('bg/banks').forEach(bank => {
            bank.name = names.bankName(bank.name);
            assert.false('Duplicate bank name', banks[bank.name], bank.name);
            banks[bank.name] = bank;
        });
        return banks;
    },

    // TODO: merge with getBanks
    getBanksAPI: function () {
        const banks = {};
        int.read('bg/api/banks').forEach(record => {
            const name = names.bankName(names.extractBankPureName(record['SHORTNAME']));
            assert.false('Duplicate bank name', banks[name], name);
            banks[name] = {
                id: parseInt(record['NKB']),
                name: name,
                dateOpen: dates.format(record['D_OPEN']),
                // 'Нормальний', 'Режим ліквідації', 'Реорганізація', 'Неплатоспроможний'
                active: ['Нормальний'.toUpperCase(), 'Реорганізація'.toUpperCase()].includes(record['N_STAN'].toUpperCase())
            };
        });
        return banks;
    },

    saveAll: function () {
        this.saveBanksAPI();
        this.saveBanks();
        this.saveBankDetails();
    },

    saveBanksAPI() {
        const xml = ext.read('bg/api/banks', 'https://bank.gov.ua/NBU_BankInfo/get_data_branch?typ=0', 'cp1251');
        const json = convert.xml2js(xml, {compact: true});
        const banks = json['BANKBRANCH']['ROW'].map(row => _.forOwn(row, (value, key) => row[key] = value['_text'] || value['_cdata']));
        int.write('bg/api/banks', banks);
    },

    saveBanks: function () {
        const htmls = [];
        let page = 0;
        const html = ext.read('bg/banks/pages/' + page, 'https://bank.gov.ua/control/bankdict/banks');
        htmls.push(html);
        const regex = /<li>\s+?<a href="(.+?)">/g;
        let matches;
        while ((matches = regex.exec(html))) {
            htmls.push(ext.read('bg/banks/pages/' + (++page), 'https://bank.gov.ua/' + matches[1]));
        }
        const banks = _.flatten(htmls.map(html => {
            const banks = [];
            const regex = /<tr>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<\/tr>/g;
            let matches;
            while ((matches = regex.exec(html))) {
                const link = matches[1].trim();
                const linkMatch = link.match(/<a href=".*?(\d+)">\s*(.+?)\s*<\/a>/);
                const id = linkMatch[1];
                const name = this.extractBankPureNameSPC(linkMatch[2]);
                banks.push({
                    id: id,
                    name: name,
                    date: dates.format(matches[4])
                });
            }
            return banks;
        }));
        int.write('bg/banks', banks);
    },

    saveBankDetails: function () {
        const banks = int.read('bg/banks');
        banks.forEach(bank => {
            const html = ext.read('bg/banks/' + bank.id, 'https://bank.gov.ua/control/uk/bankdict/bank?id=' + bank.id);
            const fullName = this.extractBankPureNameSPC(html.match(/<td.*?>Назва<\/td>\s*?<td.*?>(.+?)<\/td>/)[1]);
            const shortName = this.extractBankPureNameSPC(html.match(/<td.*?>Коротка назва<\/td>\s*?<td.*?>(.+?)<\/td>/)[1]);
            assert.equals('Short name mismatch', bank.name, shortName);
            bank.fullName = fullName;
        });
        int.write('bg/banks', banks);
    },

    extractBankPureNameSPC(name) {
        const decoded = name.replace(/&#034;/g, '"');
        assert.notEquals('No xml encoded quotes', decoded, name);
        return names.extractBankPureName(decoded)
    },

    // TODO: fetch based on ids from DBF file
    fetchAndSaveBanksByIds: function () {
        for (let id = 10300; id < 100000; id++) {
            if (!(id % 100)) {
                console.log('id:', id);
            }
            const html = utils.readURL('https://bank.gov.ua/control/uk/bankdict/bank?id=' + id);
            const type = html.match(/<td.*?>Тип<\/td>\s*?<td.*?>(.+?)<\/td>/);
            if (type && type[1] === 'Банк') {
                const subFolder = (Math.floor(id / 1000) + 1) * 1000;
                utils.writeFile('./html/bg/banks/ids/' + subFolder + '/' + id + '.html', html);
            }
        }
    }
};