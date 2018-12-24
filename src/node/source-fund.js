let _ = require('lodash');
let names = require('./names');
let ext = require('./external');
let int = require('./internal');
let dates = require('./dates');
let assert = require('./assert');
let regex = require('./regex');

module.exports = {
    getBanks() {
        const banks = {};
        int.read('fund/banks').forEach(bank => {
            bank.name = names.bankName(bank.name);
            banks[bank.name] = bank;
        });
        return banks;
    },

    saveAll() {
        this.saveBanks();
    },

    saveBanks() {
        const htmlActive = ext.read('fund/banks-active', 'http://www.fg.gov.ua/uchasnyky-fondu');
        const banks = regex.findManyObjects(htmlActive, /<tr.*?>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>([\S\s]*?)<\/td>\s+?<\/tr>/g, {
            name: 2, date: 4, site: 7
        }).map(bank => {
            return {
                name: names.extractBankPureName(bank.name),
                start: dates.format(bank.date),
                site: this.extractBankPureSites(bank.site),
                active: true
            };
        });
        banks.forEach(bank => assert.false('Many sites', bank.site.length > 1, bank.name, bank.site));

        const bankByName = _.keyBy(banks, 'name');
        const htmlInactive = ext.read('fund/banks-not-paying', 'http://www.fg.gov.ua/not-paying');
        regex.findManyObjects(htmlInactive, /<h3 class="item-title"><a href="(\/.+?\/.+?\/(\d+?)-.+?)">[\S\s]+?(.+?)<\/a>/g, {
            link: 1, id: 2, name: 3
        }).map(bank => {
            const htmlBank = ext.read('fund/banks/' + bank.id, 'http://www.fg.gov.ua' + bank.link);
            const dateIssue = _.min(regex.findManyValues(htmlBank, /<td[^>]*>Термін [^<]*<\/td>\s*<td[^>]*>[^<]*?(\d{2}\.\d{2}\.\d{4})[^<]*<\/td>/g).map(date => dates.format(date)));
            return {
                name: names.extractBankPureName(bank.name),
                issue: dateIssue,
                link: bank.link,
                active: false
            };
        }).forEach(bank => {
            const existing = bankByName[bank.name];
            if (assert.false('Bank is still active', existing, bank.name)) {
                banks.push(bank);
            } else {
                existing.issue = bank.issue;
                existing.link = bank.link;
            }
        });

        int.write('fund/banks', banks);
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