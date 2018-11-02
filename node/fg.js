let _ = require('lodash');
let names = require('./names');
let ext = require('./external');
let int = require('./internal');
let dates = require('./dates');
let assert = require('./assert');

module.exports = {
    // https://www.bank.gov.ua/control/bankdict/banks
    // https://bank.gov.ua/control/uk/bankdict/search?name=&type=369&region=&mfo=&edrpou=&size=&group=&fromDate=&toDate=
    getBanks() {
        const banks = {};
        const activeBanks = int.read('fg/banks-active');
        const notPayingBanks = int.read('fg/banks-not-paying');
        activeBanks.forEach(bank => bank.active = true);
        notPayingBanks.forEach(bank => bank.active = false);
        _.union(activeBanks, notPayingBanks).forEach(bank => {
            bank.name = names.bankName(bank.name);
            assert.false('Duplicate bank name', banks[bank.name], bank.name);
            banks[bank.name] = bank;
        });
        return banks;
    },

    saveAll() {
        this.saveActiveBanks();
        this.saveNotPayingBanks();
    },

    saveActiveBanks() {
        const html = ext.read('fg/banks-active', 'http://www.fg.gov.ua/uchasnyky-fondu');
        const banks = [];
        const regex = /<tr.*?>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>([\S\s]*?)<\/td>\s+?<\/tr>/g;
        let matches;
        while ((matches = regex.exec(html))) {
            banks.push({
                name: names.extractBankPureName(matches[2]),
                date: dates.format(matches[4]),
                site: this.extractBankPureSites(matches[7]),
            });
        }
        const manySites = banks.filter(bank => bank.site.length > 1);
        assert.false('Many sites', manySites.length, manySites);
        int.write('fg/banks-active', banks);
    },

    saveNotPayingBanks() {
        const html = ext.read('fg/banks-not-paying', 'http://www.fg.gov.ua/not-paying');
        const banks = [];
        const regex = /<h3 class="item-title"><a href="(\/.+?\/.+?\/.+?)">[\S\s]+?(.+?)<\/a>/g;
        let matches;
        while ((matches = regex.exec(html))) {
            const name = names.extractBankPureName(matches[2]);
            const link = matches[1];
            const id = this.extractBankId(link);
            const htmlBank = ext.read('fg/banks/' + id, 'http://www.fg.gov.ua' + link);
            // TODO: extract data from htmlBank
            banks.push({
                id: id,
                name: name,
                link: link
            });
        }
        int.write('fg/banks-not-paying', banks);
    },

    extractBankId(link) {
        return parseInt(link.match(/.*\/(\d+)-.*/)[1]);
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
        const regex = /href="(.+?)"|(http[^"<\s]+)|[^/](www[^"<\s]+)/g;
        while ((matches = regex.exec(bankFullSite))) {
            let site = matches[1] || matches[2] || matches[3];
            site = site.replace(/(?<!:|:\/)\/(?!ukraine$).*/g, '');
            sites.add(site);
        }

        sites = this.removeDuplicateSites(sites);

        // TODO: use assert ???
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
    }
};