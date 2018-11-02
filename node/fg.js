let _ = require('lodash');
let names = require('./names');
let ext = require('./external');
let int = require('./internal');
let dates = require('./dates');
let assert = require('./assert');
let regex = require('./regex');

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
        const banks = regex.findManyObjects(html, /<tr.*?>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>([\S\s]*?)<\/td>\s+?<\/tr>/g, {
            name: 2, date: 4, site: 7
        }).map(bank => {
            return {
                name: names.extractBankPureName(bank.name),
                date: dates.format(bank.date),
                site: this.extractBankPureSites(bank.site)
            };
        });
        banks.forEach(bank => assert.false('Many sites', bank.site.length > 1, bank.name, bank.site));
        int.write('fg/banks-active', banks);
    },

    saveNotPayingBanks() {
        const html = ext.read('fg/banks-not-paying', 'http://www.fg.gov.ua/not-paying');
        const banks = regex.findManyObjects(html, /<h3 class="item-title"><a href="(\/.+?\/.+?\/(\d+?)-.+?)">[\S\s]+?(.+?)<\/a>/g, {
            link: 1, id: 2, name: 3
        }).map(bank => {
            const htmlBank = ext.read('fg/banks/' + bank.id, 'http://www.fg.gov.ua' + bank.link);
            // TODO: extract data from htmlBank
            return {
                id: parseInt(bank.id),
                name: names.extractBankPureName(bank.name),
                link: bank.link
            };
        });
        int.write('fg/banks-not-paying', banks);
    },

    extractBankPureSites(bankFullSite) {
        bankFullSite = bankFullSite
            .replace(/&nbsp;/g, '')
            .replace(/<strong>([^<]*)<\/strong>/g, '$1')
            .trim();
        if (!assert.true('Site is empty', bankFullSite)) {
            return [];
        }

        const sites = this.removeDuplicateSites(regex.findManyObjects(bankFullSite, /href="(.+?)"|(http[^"<\s]+)|[^/](www[^"<\s]+)/g, {
            href: 1, http: 2, www: 3
        }).map(sites => names.siteName(sites.href || sites.http || sites.www)));

        if (!assert.true('No site matches', sites.length, bankFullSite)) {
            return sites.add(bankFullSite);
        }

        assert.false('Many site matches', sites.length > 1, bankFullSite, sites);
        return sites;
    },

    removeDuplicateSites(sites) {
        sites = new Set(sites);
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
        return Array.from(result);
    }
};