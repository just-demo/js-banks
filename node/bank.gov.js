let utils = require('./utils');
let path = require('path');
let _ = require('lodash');
let names = require('./names');

module.exports = {
    // https://bank.gov.ua/control/portalmap -> Банківський нагляд -> Реорганізація, припинення та ліквідація
    // https://bank.gov.ua/control/uk/publish/article?art_id=75535&cat_id=17823466
    // https://www.bank.gov.ua/control/bankdict/banks
    // https://bank.gov.ua/control/uk/bankdict/search?name=&type=369&region=&mfo=&edrpou=&size=&group=&fromDate=&toDate=
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

    ////////// html \\\\\\\\\\
    fetchAndSaveAllHtml: function () {
        // this.fetchAndSaveBanks();
        // this.extractAndSaveBanks();
        // this.fetchAndSaveBankDetails();
        this.extractAndSaveBankDetails();
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
                this.htmlBankDetailsFile(bank.name.toUpperCase()),
                utils.readURL('https://bank.gov.ua/control/uk/bankdict/bank?id=' + bank.id)
            );
        });
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
            const html = utils.readFile(this.htmlBankDetailsFile(bank.name.toUpperCase()));
            const fullName = this.extractBankPureName(html.match(/<td.*?>Назва<\/td>\s*?<td.*?>(.+?)<\/td>/)[1]);
            const names = new Set();
            names.add(bank.name.toUpperCase());
            names.add(fullName.toUpperCase());
            Array.from(names).forEach(name => {
                names.add(name.replace(/\s*-\s*/g, '-'));
                names.add(name.replace(/\s+/g, '-'));
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
            const name = this.extractBankPureName(linkMatch[2]);
            banks.push({
                id: id,
                name: name,
                date: matches[4].split('.').reverse().map(part => part.trim()).join('-')
            });
        }

        return banks;
    },

    extractBankPureName(name) {
        const match = name.match(/[\S\s]*&#034;(.+?)&#034;[\S\s]*/);
        if (!match) {
            console.log('No quotes:', name);
            return name;
        }
        return match[1];
    },

    ////////// files \\\\\\\\\\
    htmlBanksFile: function (page) {
        return path.resolve(this.htmlFolder(), 'banks', page + '.html');
    },

    htmlBankDetailsFile: function (bankName) {
        return path.resolve(this.htmlFolder(), 'banks', 'details', bankName.toUpperCase() + '.html');
    },

    jsonBanksFile: function () {
        return path.resolve(this.jsonFolder(), 'banks.json');
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