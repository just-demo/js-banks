let utils = require('./utils');
let path = require('path');
let _ = require('lodash');

module.exports = {
    // https://bank.gov.ua/control/portalmap -> Банківський нагляд -> Реорганізація, припинення та ліквідація
    // https://bank.gov.ua/control/uk/publish/article?art_id=75535&cat_id=17823466
    // https://www.bank.gov.ua/control/bankdict/banks
    // https://bank.gov.ua/control/uk/bankdict/search?name=&type=369&region=&mfo=&edrpou=&size=&group=&fromDate=&toDate=
    getBanks: function() {
        const banks = {};
        Object.values(utils.fromJson(utils.readFile(this.jsonBanksFile()))).forEach(bank => {
            const id = this.buildBankId(bank.name);
            if (banks[id]) {
                console.log(id + ': ' + bank.name + ' != ' + banks[id].name);
            }
            banks[id] = bank;
        });
        return banks;
    },

    ////////// html \\\\\\\\\\
    fetchAndSaveAllHtml: function () {
        // this.fetchAndSaveBanks();
        // this.extractAndSaveBanks();
    },

    fetchAndSaveBanks: function () {
        let page = 0;
        let html = utils.readURL('https://bank.gov.ua/control/bankdict/banks');
        utils.writeFile(this.htmlBanksFile(page), html);
        const regex = /<li>\s+?<a href="(.+?)">/g;
        let matches;
        while ((matches = regex.exec(html))) {
            const link = 'https://bank.gov.ua/' + matches[1];
            console.log(link);
            utils.writeFile(this.htmlBanksFile(++page), utils.readURL(link));
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

    extractBanks: function (page) {
        const banks = [];
        const html = utils.readFile(this.htmlBanksFile(page));
        const regex = /<tr>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<\/tr>/g;

        let matches;
        while ((matches = regex.exec(html))) {
            banks.push({
                name: this.extractBankPureName(matches[1]),
                date: matches[4].split('.').reverse().map(part => part.trim()).join('-')
            });
        }

        return banks;
    },

    extractBankPureName(bankFullName) {
        let name = bankFullName.trim();
        let match = name.match(/<a.*?>\s*(.+?)\s*<\/a>/);
        if (!match) {
            console.log(name);
            return name;
        }
        name = match[1];
        match = name.match(/[\S\s]*&#034;(.+?)&#034;[\S\s]*/);
        if (!match) {
            console.log(name);
            return name;
        }
        return match[1];
    },

    buildBankId(name) {
        return name.toLowerCase();
    },

    ////////// files \\\\\\\\\\
    htmlBanksFile: function (page) {
        return path.resolve(this.htmlFolder(), 'banks', page + '.html');
    },

    jsonBanksFile: function () {
        return path.resolve(this.jsonFolder(), 'banks.json');
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