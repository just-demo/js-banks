const _ = require('lodash');
const names = require('../names');
const ext = require('../external');
const int = require('../internal');
const dates = require('../dates');
const assert = require('../assert');
const regex = require('../regex');
const mapAsync = require('../map-async');
const Source = require('./source');

class SourceFund extends Source {
    constructor() {
        super('fund');
    }

    getBanks() {
        return Promise.all([readActiveBanks(), readInactiveBanks()]).then(allBanks => {
            const activeBanks = _.keyBy(allBanks[0], 'name');
            const inactiveBanks = _.keyBy(allBanks[1], 'name');
            const banks = _.union(Object.keys(activeBanks), Object.keys(inactiveBanks)).map(name => {
                assert.false('Bank is still active', activeBanks[name] && inactiveBanks[name], name);
                return {
                    ...(inactiveBanks[name] || {}),
                    ...(activeBanks[name] || {})
                };
            }).map(bank => {
                return {
                    names: [bank.name],
                    // start: bank.start, // this start is different from bank opening date
                    problem: bank.problem,
                    sites: bank.sites,
                    link: bank.link,
                    active: bank.active
                }
            });
            banks.sort(names.compareNames);
            return int.write('fund/banks', banks);
        });
    }
}

module.exports = SourceFund;

function readActiveBanks() {
    return ext.read('fund/banks-active', 'http://www.fg.gov.ua/uchasnyky-fondu').then(html => {
        const banks = regex.findManyObjects(html, /<tr.*?>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>([\S\s]*?)<\/td>\s+?<\/tr>/g, {
            name: 2, date: 4, site: 7
        }).map(bank => {
            return {
                name: names.extractBankPureName(bank.name),
                start: dates.format(bank.date),
                sites: extractBankPureSites(bank.site),
                active: true
            };
        });
        banks.forEach(bank => assert.false('Many sites', bank.sites.length > 1, bank.name, bank.sites));
        return banks;
    });
}

function readInactiveBanks() {
    return ext.read('fund/banks-not-paying', 'http://www.fg.gov.ua/not-paying').then(html => {
        const banks = regex.findManyObjects(html, /<h3 class="item-title"><a href="(\/.+?\/.+?\/(\d+?)-.+?)">[\S\s]+?(.+?)<\/a>/g, {
            link: 1,
            id: 2,
            name: 3
        });

        return mapAsync(banks, bank =>
            ext.read('fund/banks/' + bank.id, 'http://www.fg.gov.ua' + bank.link)
                .then(htmlBank => {
                    const problems = regex.findManyValues(htmlBank, /<td[^>]*>Термін [^<]*<\/td>\s*<td[^>]*>[^<]*?(\d{2}\.\d{2}\.\d{4})[^<]*<\/td>/g)
                        .map(date => dates.format(date));
                    return {
                        name: names.extractBankPureName(bank.name),
                        problem: _.min(problems),
                        link: bank.link,
                        active: false
                    };
                })
        );
    });
}

function extractBankPureSites(bankFullSite) {
    bankFullSite = bankFullSite
        .replace(/&nbsp;/g, '')
        .replace(/<strong>([^<]*)<\/strong>/g, '$1')
        .trim();
    if (!assert.true('Site is empty', bankFullSite)) {
        return [];
    }

    const sites = removeDuplicateSites(regex.findManyObjects(bankFullSite, /href="(.+?)"|(http[^"<\s]+)|[^/](www[^"<\s]+)/g, {
        href: 1,
        http: 2,
        www: 3
    }).map(sites => names.siteName(sites.href || sites.http || sites.www)));

    if (!assert.true('No site matches', sites.length, bankFullSite)) {
        return sites.add(bankFullSite);
    }

    assert.false('Many site matches', sites.length > 1, bankFullSite, sites);
    return sites;
}

function removeDuplicateSites(sites) {
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