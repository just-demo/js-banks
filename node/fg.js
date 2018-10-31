let utils = require('./utils');
let path = require('path');
let _ = require('lodash');
let names = require('./names');

module.exports = {
    // https://www.bank.gov.ua/control/bankdict/banks
    // https://bank.gov.ua/control/uk/bankdict/search?name=&type=369&region=&mfo=&edrpou=&size=&group=&fromDate=&toDate=
    getActiveBanks() {
        const banks = {};
        utils.fromJson(utils.readFile(this.jsonActiveBanksFile())).forEach(bank => {
            bank.name = names.bankName(bank.name);
            banks[bank.name] = bank;
        });
        return banks;
    },

    getBanks() {
        const banks = {};
        const activeBanks = utils.fromJson(utils.readFile(this.jsonActiveBanksFile()));
        const notPayingBanks = utils.fromJson(utils.readFile(this.jsonNotPayingBanksFile()));
        activeBanks.forEach(bank => bank.active = true);
        notPayingBanks.forEach(bank => bank.active = false);
        _.union(activeBanks, notPayingBanks).forEach(bank => {
            bank.name = names.bankName(bank.name);
            bank.active
            if (banks[bank.name]) {
                console.log('Duplicate bank name', bank.name);
            }
            banks[bank.name] = bank;
        });
        return banks;
    },

    ////////// html \\\\\\\\\\
    fetchAndSaveAllHtml() {
        this.fetchAndSaveActiveBanks();
        this.extractAndSaveActiveBanks();
        this.fetchAndSaveNotPayingBanks();
        this.extractAndSaveNotPayingBanks();
        this.fetchAndSaveBankDetails();
    },

    fetchAndSaveActiveBanks() {
        utils.writeFile(this.htmlActiveBanksFile(), utils.readURL('http://www.fg.gov.ua/uchasnyky-fondu'));
    },

    fetchAndSaveNotPayingBanks() {
        utils.writeFile(this.htmlNotPayingBanksFile(), utils.readURL('http://www.fg.gov.ua/not-paying'));
    },

    fetchAndSaveBankDetails() {
        this.extractNotPayingBanks().forEach(bank => {
            console.log(bank.name);
            const file = this.htmlBankFile(bank.name.toUpperCase());
            if (!utils.fileExists(file)) {
                utils.writeFile(file, utils.readURL('http://www.fg.gov.ua' + bank.link));
            }
        })
    },

    ////////// json \\\\\\\\\\
    extractAndSaveActiveBanks() {
        const banks = [];
        const html = utils.readFile(this.htmlActiveBanksFile());
        const regex = /<tr.*?>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>([\S\s]*?)<\/td>\s+?<\/tr>/g;

        let matches;
        while ((matches = regex.exec(html))) {
            banks.push({
                name: this.extractBankPureName(matches[2]),
                date: matches[4].split('.').reverse().join('-'),
                site: this.extractBankPureSites(matches[7]),
            });
        }

        console.log('Many sites=' + banks.filter(bank => bank.site.length > 1).length);
        utils.writeFile(this.jsonActiveBanksFile(), utils.toJson(banks));
    },

    extractBankPureSites(bankFullSite) {
        bankFullSite = bankFullSite
            .replace(/&nbsp;/g, '')
            .replace(/<strong>([^<]*)<\/strong>/g, '$1')
            .trim();
        if (!bankFullSite) {
            return [];
        }

        let sites = new Set();
        let matches;
        const regex = /href="(.+?)"|(http[^"<\s]+)|[^\/](www[^"<\s]+)/g;
        while ((matches = regex.exec(bankFullSite))) {
            let site = matches[1] || matches[2] || matches[3];
            site = site.replace(/(?<!:|:\/)\/(?!ukraine$).*/g, '');
            sites.add(site);
        }

        sites = this.removeDuplicateSites(sites);

        if (!sites.size) {
            console.log('No matches', bankFullSite);
            sites.add(bankFullSite);
        }

        if (sites.size > 1) {
            console.log(bankFullSite);
            console.log(sites);
        }

        return Array.from(sites);
    },

    removeDuplicateSites(sites) {
        const result = new Set(sites);
        sites.forEach(site => {
            const isDuplicate = ['https', 'http']
                .map(schema => schema + '://')
                .filter(schemaPrefix => !site.startsWith(schemaPrefix))
                .map(schemaPrefix => schemaPrefix + site)
                .filter(siteWithSchema => sites.has(siteWithSchema))
                .length;
            if (isDuplicate) {
                result.delete(site);
            }
        });
        return result;
    },

    extractBankPureName(bankFullName) {
        const match = bankFullName.match(/.*["«](.+?)["»]/);
        if (!match) {
            console.log(bankFullName);
            return bankFullName;
        }
        return match[1];
    },

    extractAndSaveNotPayingBanks() {
        utils.writeFile(this.jsonNotPayingBanksFile(), utils.toJson(this.extractNotPayingBanks()));
    },

    extractNotPayingBanks() {
        const banks = [];
        const html = utils.readFile(this.htmlNotPayingBanksFile());
        const regex = /<h3 class="item-title"><a href="(\/.+?\/.+?\/.+?)">[\S\s]+?(.+?)<\/a>/g;
        let matches;
        while ((matches = regex.exec(html))) {
            banks.push({
                name: this.extractBankPureName(matches[2]),
                link: matches[1]
            });
        }
        return banks;
    },

    ////////// files \\\\\\\\\\
    htmlActiveBanksFile() {
        return path.resolve(this.htmlFolder(), 'banks-active.html');
    },

    htmlNotPayingBanksFile() {
        return path.resolve(this.htmlFolder(), 'banks-not-paying.html');
    },

    htmlBankFile(name) {
        return path.resolve(this.htmlFolder(), 'banks', name + '.html');
    },

    jsonActiveBanksFile() {
        return path.resolve(this.jsonFolder(), 'banks-active.json');
    },

    jsonNotPayingBanksFile() {
        return path.resolve(this.jsonFolder(), 'banks-not-paying.json');
    },

    htmlFolder() {
        return path.resolve(this.dataFolder(), 'html');
    },

    jsonFolder() {
        return path.resolve(this.dataFolder(), 'json');
    },

    dataFolder() {
        return path.resolve('.', 'fg');
    }
};