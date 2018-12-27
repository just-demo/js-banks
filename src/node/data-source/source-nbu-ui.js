const utils = require('../utils');
const _ = require('lodash');
const names = require('../names');
const ext = require('../external');
const int = require('../internal');
const dates = require('../dates');
const assert = require('../assert');
const regex = require('../regex');
const AsyncMapperPool = require('../async-mapper-pool');

module.exports = {
    // Банківський нагляд -> Реєстрація та ліцензування -> Довідник банків -> Повний перелік банківських установ:
    // https://bank.gov.ua/control/bankdict/banks
    // Банківський нагляд -> Реорганізація, припинення та ліквідація:
    // https://bank.gov.ua/control/uk/publish/article?art_id=75535
    getBanks() {
        const banks = {};
        int.read('nbu/banks').forEach(bank => {
            bank.name = names.bankName(bank.name);
            assert.false('Duplicate bank name', banks[bank.name], bank.name);
            banks[bank.name] = bank;
        });
        return banks;
    },

    saveBanks() {
        return Promise.all([this.readActiveBanks(), this.readInactiveBanks()]).then(allBanks => {
            const banks = _.flatten(allBanks);
            banks.sort(names.compareName);
            int.write('nbu/banks', banks);
            return banks;
        });
    },

    readActiveBanks() {
        return new Promise(resolve => {
            const htmls = [];
            const html = ext.read('nbu/banks/pages/' + htmls.length, 'https://bank.gov.ua/control/bankdict/banks');
            htmls.push(html);
            regex.findManyValues(html, /<li>\s+?<a href="(.+?)">/g).forEach(link => {
                htmls.push(ext.read('nbu/banks/pages/' + htmls.length, 'https://bank.gov.ua/' + link));
            });

            const banks = _.flatten(htmls.map(html => regex.findManyObjects(html, /<tr>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<\/tr>/g, {
                link: 1, dateOpen: 4
            })));
            const self = this; // TODO: avoid it somehow
            const pool = new AsyncMapperPool(banks, bank => {
                const linkInfo = regex.findObject(bank.link.trim(), /<a href=".*?(\d+)">\s*(.+?)\s*<\/a>/, {
                    id: 1,
                    name: 2
                });
                const id = linkInfo.id;
                const link = '/control/uk/bankdict/bank?id=' + id;
                const name = self.extractBankPureNameSPC(linkInfo.name);
                const bankHtml = ext.read('nbu/banks/' + id, 'https://bank.gov.ua' + link);
                const fullName = self.extractBankPureNameSPC(bankHtml.match(/<td.*?>Назва<\/td>\s*?<td.*?>(.+?)<\/td>/)[1]);
                const shortName = self.extractBankPureNameSPC(bankHtml.match(/<td.*?>Коротка назва<\/td>\s*?<td.*?>(.+?)<\/td>/)[1]);
                assert.equals('Short name mismatch', name, shortName);
                return {
                    id: id,
                    name: name,
                    fullName: fullName,
                    dateOpen: dates.format(bank.dateOpen),
                    link: link,
                    active: true
                };
            });
            pool.start().then(banks => resolve(banks));
        });
    },

    readInactiveBanks() {
        return new Promise(resolve => {
            const link = '/control/uk/publish/article?art_id=75535'; //TODO: is id the same? consider fetching the link from UI page if possible
            const html = ext.read('nbu/banks-inactive', 'https://bank.gov.ua' + link);
            const banks = regex.findManyObjects(html, new RegExp('<tr[^>]*>\\s*?' + '(<td[^>]*>\\s*?(<p[^>]*>\\s*?<span[^>]*>([\\S\\s]*?)<o:p>.*?<\\/o:p><\\/span><\\/p>)?\\s*?<\\/td>\\s*?)'.repeat(4) + '[\\S\\s]*?<\\/tr>', 'g'), {
                name: 3, date1: 6, date2: 9, date3: 12
            }).map(bank => {
                const trim = (value) => (value || '')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&quot;/g, '"')
                    .replace(/<[^<]*>/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                const dateIssue = _.min([bank.date1, bank.date2, bank.date3]
                    .map(date => trim(date))
                    .map(date => dates.format(date))
                    .filter(date => date));
                return {
                    name: names.extractBankPureName(trim(bank.name)),
                    dateIssue: dateIssue,
                    link: link,
                    active: false
                };
            });
            resolve(banks);
        });
    },

    extractBankPureNameSPC(name) {
        const decoded = name.replace(/&#034;/g, '"');
        assert.notEquals('No xml encoded quotes', decoded, name);
        return names.extractBankPureName(decoded)
    },

    // TODO: fetch based on ids from DBF file
    fetchAndSaveBanksById(id) {
        const html = utils.readURL('https://bank.gov.ua/control/uk/bankdict/bank?id=' + id);
        const type = regex.findSingleValue(html, /<td.*?>Тип<\/td>\s*?<td.*?>(.+?)<\/td>/);
        if (type === 'Банк') {
            // TODO: cache and parse html same as in this.saveBanks
        }
    }
};