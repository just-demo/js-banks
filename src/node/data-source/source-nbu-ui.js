const utils = require('../utils');
const _ = require('lodash');
const names = require('../names');
const ext = require('../external');
const int = require('../internal');
const dates = require('../dates');
const assert = require('../assert');
const regex = require('../regex');

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
        const htmls = [];
        const html = ext.read('nbu/banks/pages/' + htmls.length, 'https://bank.gov.ua/control/bankdict/banks');
        htmls.push(html);
        regex.findManyValues(html, /<li>\s+?<a href="(.+?)">/g).forEach(link => {
            htmls.push(ext.read('nbu/banks/pages/' + htmls.length, 'https://bank.gov.ua/' + link));
        });

        const banks = _.flatten(htmls.map(html => {
            return regex.findManyObjects(html, /<tr>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<\/tr>/g, {
                link: 1, dateOpen: 4
            }).map(bank => {
                const linkInfo = regex.findObject(bank.link.trim(), /<a href=".*?(\d+)">\s*(.+?)\s*<\/a>/, {
                    id: 1,
                    name: 2
                });
                const id = linkInfo.id;
                const link = '/control/uk/bankdict/bank?id=' + id;
                const name = this.extractBankPureNameSPC(linkInfo.name);
                const bankHtml = ext.read('nbu/banks/' + id, 'https://bank.gov.ua' + link);
                const fullName = this.extractBankPureNameSPC(bankHtml.match(/<td.*?>Назва<\/td>\s*?<td.*?>(.+?)<\/td>/)[1]);
                const shortName = this.extractBankPureNameSPC(bankHtml.match(/<td.*?>Коротка назва<\/td>\s*?<td.*?>(.+?)<\/td>/)[1]);
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
        }));

        const linkInactive = '/control/uk/publish/article?art_id=75535'; //TODO: is id the same? consider fetching the link from UI page if possible
        const htmlInactive = ext.read('nbu/banks-inactive', 'https://bank.gov.ua' + linkInactive);
        const banksInactive = regex.findManyObjects(htmlInactive, new RegExp('<tr[^>]*>\\s*?' + '(<td[^>]*>\\s*?(<p[^>]*>\\s*?<span[^>]*>([\\S\\s]*?)<o:p>.*?<\\/o:p><\\/span><\\/p>)?\\s*?<\\/td>\\s*?)'.repeat(4) + '[\\S\\s]*?<\\/tr>', 'g'), {
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
                link: linkInactive,
                active: false
            };
        });

        banks.push(...banksInactive);
        int.write('nbu/banks', banks);
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