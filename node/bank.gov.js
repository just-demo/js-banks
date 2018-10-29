let utils = require('./utils');
let path = require('path');
let _ = require('lodash');
let names = require('./names');
let convert = require('xml-js');
let iconv = require('iconv-lite');

module.exports = {
    // https://bank.gov.ua/control/portalmap -> Банківський нагляд -> Реорганізація, припинення та ліквідація
    // https://bank.gov.ua/control/uk/publish/article?art_id=75535&cat_id=17823466
    // https://www.bank.gov.ua/control/bankdict/banks
    // https://bank.gov.ua/control/uk/bankdict/search?name=&type=369&region=&mfo=&edrpou=&size=&group=&fromDate=&toDate=
    // https://bank.gov.ua/control/uk/publish/article?art_id=38441973&cat_id=38459171#get_data_branch
    // https://bank.gov.ua/NBU_BankInfo/get_data_branch?typ=0&json
    getBanks: function () {
        const banks = {};
        utils.fromJson(utils.readFile(this.jsonBanksFile())).forEach(bank => {
            bank.name = names.bankName(bank.name);
            if (banks[bank.name]) {
                console.log('Duplicate bank name', bank.name);
            }
            banks[bank.name] = bank;
        });
        return banks;
    },

    getBanksApi: function () {
        const banks = {};
        utils.fromJson(utils.readFile(this.jsonBanksApiFile())).forEach(record => {
            const name = names.bankName(this.extractBankPureName(record['SHORTNAME']));
            if (banks[name]) {
                console.log('Duplicate bank name', name);
            }
            banks[name] = {
                id: parseInt(record['NKB']),
                shortName: name,
                dateOpen: record['D_OPEN'].split('.').reverse().join('-'),
                // 'Нормальний', 'Режим ліквідації', 'Реорганізація', 'Неплатоспроможний'
                active: ['Нормальний'.toUpperCase(), 'Реорганізація'.toUpperCase()].includes(record['N_STAN'].toUpperCase())
            };
        });
        return banks;
    },

    ////////// xml and json \\\\\\\\\\
    fetchAndSaveApiData() {
        const xml = utils.readURL('https://bank.gov.ua/NBU_BankInfo/get_data_branch?typ=0', 'cp1251');
        const json = convert.xml2js(xml, {compact: true})['BANKBRANCH']['ROW']
            .map(row => _.forOwn(row, (value, key) => row[key] = value['_text'] || value['_cdata']));
        utils.writeFile('./bg/xml/banks.api.xml', xml);
        utils.writeFile(this.jsonBanksApiFile(), utils.toJson(json));
    },

    ////////// html \\\\\\\\\\
    fetchAndSaveAllHtml: function () {
        // this.fetchAndSaveBanks();
        // this.extractAndSaveBanks();
        // this.fetchAndSaveBankDetails();
        // this.extractAndSaveBankDetails();
        this.fetchAndSaveBanksByIds();
    },

    fetchAndSaveBanks: function () {
        let page = 0;
        const html = utils.readURL('https://bank.gov.ua/control/bankdict/banks');
        utils.writeFile(this.htmlBanksFile(page), html);
        const regex = /<li>\s+?<a href="(.+?)">/g;
        let matches;
        while ((matches = regex.exec(html))) {
            const link = 'https://bank.gov.ua/' + matches[1];
            console.log(link);
            utils.writeFile(this.htmlBanksFile(++page), utils.readURL(link));
        }
    },

    fetchAndSaveBankDetails: function () {
        utils.fromJson(utils.readFile(this.jsonBanksFile())).forEach(bank => {
            console.log(bank.name);
            utils.writeFile(
                this.htmlBankByNameFile(bank.name.toUpperCase()),
                utils.readURL('https://bank.gov.ua/control/uk/bankdict/bank?id=' + bank.id)
            );
        });
    },

    fetchAndSaveBanksByIds: function () {
        for (let id = 10300; id < 100000; id++) {
            if (!(id % 100)) {
                console.log('id:', id);
            }
            const html = utils.readURL('https://bank.gov.ua/control/uk/bankdict/bank?id=' + id);
            const type = html.match(/<td.*?>Тип<\/td>\s*?<td.*?>(.+?)<\/td>/);
            if (type && type[1] === 'Банк') {
                // const longName = html.match(/<td.*?>Назва<\/td>\s*?<td.*?>(.+?)<\/td>/);
                // const shortName = html.match(/<td.*?>Коротка назва<\/td>\s*?<td.*?>(.+?)<\/td>/);
                utils.writeFile(this.htmlBankByIdFile((Math.floor(id / 1000) + 1) * 1000, id), html);
            }
        }
    },

    ////////// json \\\\\\\\\\
    extractAndSaveBanks: function () {
        const banks = [];
        for (let page = 0; utils.fileExists(this.htmlBanksFile(page)); page++) {
            banks.push(...this.extractBanks(page));
        }

        console.log(banks.length);
        utils.writeFile(this.jsonBanksFile(), utils.toJson(banks));
    },

    extractAndSaveBankDetails: function () {
        const synonyms = [];
        utils.fromJson(utils.readFile(this.jsonBanksFile())).forEach(bank => {
            const html = utils.readFile(this.htmlBankByNameFile(bank.name.toUpperCase()));
            const fullName = this.extractBankPureNameSPC(html.match(/<td.*?>Назва<\/td>\s*?<td.*?>(.+?)<\/td>/)[1]);
            const names = new Set();
            [bank.name.toUpperCase(), fullName.toUpperCase()].forEach(name1 => {
                const name2 = name1.replace(/\s*-\s*/g, '-');
                const name3 = name2.replace(/\s+/g, '-');
                const name4 = name3.replace(/-/g, ' ');
                [name1, name2, name3, name4].forEach(name => names.add(name));
            });
            if (names.size > 1) {
                synonyms.push(Array.from(names));
            }
        });
        utils.writeFile(this.jsonBankNamesFile(), utils.toJson(synonyms));
    },

    extractBanks: function (page) {
        const banks = [];
        const html = utils.readFile(this.htmlBanksFile(page));
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
                date: matches[4].split('.').reverse().map(part => part.trim()).join('-')
            });
        }

        return banks;
    },

    extractBankPureNameSPC(name) {
        const match = name.match(/[\S\s]*&#034;(.+?)&#034;[\S\s]*/);
        if (!match) {
            console.log('No quotes:', name);
            return name;
        }
        return match[1];
    },

    extractBankPureName(bankFullName) {
        const match = bankFullName.match(/.*["](.+?)["]/);
        if (!match) {
            console.log('Full name is pure name:', bankFullName);
            return bankFullName;
        }
        return match[1];
    },


    ////////// files \\\\\\\\\\
    htmlBanksFile: function (page) {
        return path.resolve(this.htmlFolder(), 'banks', page + '.html');
    },

    htmlBankByNameFile: function (bankName) {
        return path.resolve(this.htmlFolder(), 'banks', 'details', bankName.toUpperCase() + '.html');
    },

    htmlBankByIdFile: function (subFolder, bankId) {
        return path.resolve(this.htmlFolder(), 'banks', 'ids', '' + subFolder, bankId + '.html');
    },

    jsonBanksFile: function () {
        return path.resolve(this.jsonFolder(), 'banks.json');
    },

    jsonBanksApiFile: function () {
        return path.resolve(this.jsonFolder(), 'banks.api.json');
    },

    jsonBankNamesFile: function () {
        return path.resolve('.', 'names', 'banks.json');
    },

    htmlFolder: function () {
        return path.resolve(this.dataFolder(), 'html');
    },

    jsonFolder: function () {
        return path.resolve(this.dataFolder(), 'json');
    },

    dataFolder: function () {
        return path.resolve('.', 'bg');
    }
};