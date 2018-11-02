let utils = require('./utils');
let _ = require('lodash');
let names = require('./names');
let convert = require('xml-js');
let ext = require('./external');
let int = require('./internal');
let dates = require('./dates');
let assert = require('./assert');
let arj = require('./arj');
let dbf = require('./dbf');
let regex = require('./regex');

module.exports = {
    // https://bank.gov.ua/control/portalmap -> Банківський нагляд -> Реорганізація, припинення та ліквідація
    // https://bank.gov.ua/control/uk/publish/article?art_id=75535&cat_id=17823466
    // https://www.bank.gov.ua/control/bankdict/banks
    // https://bank.gov.ua/control/uk/bankdict/search?name=&type=369&region=&mfo=&edrpou=&size=&group=&fromDate=&toDate=
    // https://bank.gov.ua/control/uk/publish/article?art_id=38441973&cat_id=38459171#get_data_branch
    // https://bank.gov.ua/NBU_BankInfo/get_data_branch?typ=0&json
    // TODO: merge with getBanksAPI amd getBanksDBF ???
    getBanks() {
        const banks = {};
        int.read('nbu/banks').forEach(bank => {
            bank.name = names.bankName(bank.name);
            assert.false('Duplicate bank name', banks[bank.name], bank.name);
            banks[bank.name] = bank;
        });
        return banks;
    },

    getBanksAPI() {
        const banks = {};
        int.read('nbu/banks-api').forEach(record => {
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

    getBanksDBF() {
        const banks = {};
        int.read('nbu/banks-dbf').forEach(bank => {
            bank.name = names.bankName(bank.name);
            assert.false('Duplicate bank name', banks[bank.name], bank.name);
            banks[bank.name] = bank;
        });
        return banks;
    },

    saveAll() {
        this.saveBanksDBF();
        this.saveBanksAPI();
        this.saveBanks();
        this.saveBankDetails();
    },

    saveBanksDBF() {
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
        int.write('nbu/banks-dbf', banks);
    },

    saveBanksAPI() {
        const xml = ext.read('nbu/banks-api', 'https://bank.gov.ua/NBU_BankInfo/get_data_branch?typ=0', 'cp1251');
        const json = convert.xml2js(xml, {compact: true});
        const banks = json['BANKBRANCH']['ROW'].map(row => _.forOwn(row, (value, key) => row[key] = value['_text'] || value['_cdata']));
        int.write('nbu/banks-api', banks);
    },

    saveBanks() {
        const htmls = [];
        const html = ext.read('nbu/banks/pages/' + htmls.length, 'https://bank.gov.ua/control/bankdict/banks');
        htmls.push(html);
        regex.findManyValues(html, /<li>\s+?<a href="(.+?)">/g).forEach(link => {
            htmls.push(ext.read('nbu/banks/pages/' + htmls.length, 'https://bank.gov.ua/' + link));
        });

        const banks = _.flatten(htmls.map(html => {
            return regex.findManyObjects(html, /<tr>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<\/tr>/g, {
                link: 1, date: 4
            }).map(bank => {
                const linkInfo = regex.findObject(bank.link.trim(), /<a href=".*?(\d+)">\s*(.+?)\s*<\/a>/, {
                    id: 1, name: 2
                });
                return {
                    id: linkInfo.id,
                    name: this.extractBankPureNameSPC(linkInfo.name),
                    date: dates.format(bank.date)
                };
            });
        }));
        int.write('nbu/banks', banks);
    },

    saveBankDetails() {
        const banks = int.read('nbu/banks');
        banks.forEach(bank => {
            const html = ext.read('nbu/banks/' + bank.id, 'https://bank.gov.ua/control/uk/bankdict/bank?id=' + bank.id);
            const fullName = this.extractBankPureNameSPC(html.match(/<td.*?>Назва<\/td>\s*?<td.*?>(.+?)<\/td>/)[1]);
            const shortName = this.extractBankPureNameSPC(html.match(/<td.*?>Коротка назва<\/td>\s*?<td.*?>(.+?)<\/td>/)[1]);
            assert.equals('Short name mismatch', bank.name, shortName);
            bank.fullName = fullName;
        });
        int.write('nbu/banks', banks);
    },

    extractBankPureNameSPC(name) {
        const decoded = name.replace(/&#034;/g, '"');
        assert.notEquals('No xml encoded quotes', decoded, name);
        return names.extractBankPureName(decoded)
    },

    // TODO: fetch based on ids from DBF file
    fetchAndSaveBanksByIds() {
        for (let id = 10300; id < 100000; id++) {
            if (!(id % 100)) {
                console.log('id:', id);
            }
            const html = utils.readURL('https://bank.gov.ua/control/uk/bankdict/bank?id=' + id);
            const type = html.match(/<td.*?>Тип<\/td>\s*?<td.*?>(.+?)<\/td>/);
            if (type && type[1] === 'Банк') {
                const subFolder = (Math.floor(id / 1000) + 1) * 1000;
                utils.writeFile('./html/nbu/banks/ids/' + subFolder + '/' + id + '.html', html);
            }
        }
    }
};