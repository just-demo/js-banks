const _ = require('lodash');
const names = require('../names');
const ext = require('../external');
const int = require('../internal');
const dates = require('../dates');
const assert = require('../assert');
const regex = require('../regex');
const mapAsync = require('../map-async');

module.exports = {
    // Банківський нагляд -> Реєстрація та ліцензування -> Довідник банків -> Повний перелік банківських установ:
    // https://bank.gov.ua/control/bankdict/banks
    // Банківський нагляд -> Реорганізація, припинення та ліквідація:
    // https://bank.gov.ua/control/uk/publish/article?art_id=75535
    getBanks() {
        const banks = {};
        int.read('nbu/banks').forEach(bank => {
            bank.name = names.bankName(bank.names[0]);
            assert.false('Duplicate bank name', banks[bank.name], bank.name);
            banks[bank.name] = bank;
        });
        return banks;
    },

    saveBanks() {
        return Promise.all([this.readActiveBanks(), this.readInactiveBanks()]).then(allBanks => {
            const banks = _.flatten(allBanks);
            banks.sort(names.compareNames);
            int.write('nbu/banks', banks);
            return banks;
        });
    },

    readActiveBanks() {
        return ext.read('nbu/banks/pages/' + 0, 'https://bank.gov.ua/control/bankdict/banks').then(firstHtml => {
            const otherLinks = regex.findManyValues(firstHtml, /<li>\s+?<a href="(.+?)">/g);
            const otherHtmlPromises = otherLinks.map((link, index) => ext.read('nbu/banks/pages/' + (index + 1), 'https://bank.gov.ua/' + link));
            return Promise.all([firstHtml, ...otherHtmlPromises]).then(htmls => {
                const banks = _.flatten(htmls.map(html => regex.findManyObjects(html, /<tr>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<\/tr>/g, {
                    link: 1,
                    startDate: 4
                })));
                return mapAsync(banks, bank => {
                    const linkInfo = regex.findObject(bank.link.trim(), /<a href=".*?(\d+)">\s*(.+?)\s*<\/a>/, {
                        id: 1,
                        name: 2
                    });
                    const id = parseInt(linkInfo.id);
                    const link = '/control/uk/bankdict/bank?id=' + id;
                    const name = this.extractBankPureNameSPC(linkInfo.name);
                    return ext.read('nbu/banks/' + id, 'https://bank.gov.ua' + link).then(html => {
                        const fullName = this.extractBankPureNameSPC(html.match(/<td.*?>Назва<\/td>\s*?<td.*?>(.+?)<\/td>/)[1]);
                        const shortName = this.extractBankPureNameSPC(html.match(/<td.*?>Коротка назва<\/td>\s*?<td.*?>(.+?)<\/td>/)[1]);
                        assert.equals('Short name mismatch', name, shortName);
                        return {
                            id: id,
                            names: _.uniq([name, shortName, fullName]),
                            start: dates.format(bank.startDate),
                            link: link,
                            active: true
                        };
                    });
                });
            });
        });
    },

    readInactiveBanks() {
        //TODO: is art_id always the same? consider fetching the link from UI page if possible
        const link = '/control/uk/publish/article?art_id=75535';
        return ext.read('nbu/banks-inactive', 'https://bank.gov.ua' + link).then(html => {
            return regex.findManyObjects(html, new RegExp('<tr[^>]*>\\s*?' + '(<td[^>]*>\\s*?(<p[^>]*>\\s*?<span[^>]*>([\\S\\s]*?)<o:p>.*?<\\/o:p><\\/span><\\/p>)?\\s*?<\\/td>\\s*?)'.repeat(4) + '[\\S\\s]*?<\\/tr>', 'g'), {
                name: 3, date1: 6, date2: 9, date3: 12
            }).map(bank => {
                const problem = _.min([bank.date1, bank.date2, bank.date3]
                    .map(date => trimHtml(date))
                    .map(date => dates.format(date))
                    .filter(date => date));
                return {
                    names: [names.extractBankPureName(trimHtml(bank.name))],
                    problem: problem,
                    link: link,
                    active: false
                };
            });
        });
    },

    extractBankPureNameSPC(name) {
        const decoded = name.replace(/&#034;/g, '"');
        assert.notEquals('No xml encoded quotes', decoded, name);
        return names.extractBankPureName(decoded)
    }
};

function trimHtml(html) {
    return (html || '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/<[^<]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}