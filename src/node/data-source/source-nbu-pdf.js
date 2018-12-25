const utils = require('../utils');
const _ = require('lodash');
const names = require('../names');
const ext = require('../external');
const int = require('../internal');
const dates = require('../dates');
const assert = require('../assert');
const regex = require('../regex');
const PDFParser = require('pdf2json');

module.exports = {
    // Банківський нагляд -> Реєстрація та ліцензування -> Банківські ліцензії та види діяльності банків України:
    // https://bank.gov.ua/control/uk/publish/article?art_id=52047
    getBanks() {
        const banks = {};
        int.read('nbu/banks-pdf').forEach(bank => {
            bank.name.forEach(name => {
                name = names.bankName(name);
                assert.false('Duplicate bank name', banks[name], name);
                banks[name] = {
                    name: name,
                    dateIssue: bank.dateIssue,
                    link: bank.link,
                    active: !bank.dateIssue
                };
            })
        });
        return banks;
    },

    saveBanks() {
        const startTime = new Date();

        // TODO: why does "ІННОВАЦІЙНО-ПРОМИСЛОВИЙ БАНК" fall into different buckets?
        const html = ext.read('nbu/not-banks', 'https://bank.gov.ua/control/uk/publish/article?art_id=52047'); //TODO: is id the same? consider fetching the link from UI page
        const bankFiles = {};
        regex.findManyObjects(html, /<a\s+href="files\/Licences_bank\/(.+?)".*?>([\s\S]+?)<\/a>/g, {
            file: 1, name: 2
        }).forEach(bank => {
            bankFiles[bank.file] = bankFiles[bank.file] || [];
            bankFiles[bank.file].push(names.normalize(names.removeTags(bank.name)));
        });

        // TODO: reuse https://www.npmjs.com/package/es6-promise-pool
        const promises = Object.keys(bankFiles).map(file => new Promise(resolve => {
            const url = 'https://bank.gov.ua/files/Licences_bank/' + file;
            const pdf = ext.download('nbu/not-banks/pdf/' + file, url);
            const pdfParser = new PDFParser();
            pdfParser.on("pdfParser_dataError", data => {
                console.error(data.parserError);
                resolve(null);
            });
            pdfParser.on("pdfParser_dataReady", data => {
                const text = this.extractText(data);
                //Дата відкликання20.07.2011
                const bank = regex.findObject(text,/^(.+?)Назва банку(.*?Дата відкликання(\d{2}\.\d{2}\.\d{4}))?/g, {
                    name: 1, dateIssue: 3
                });
                const bankNames = [names.extractBankPureName(bank.name), ...bankFiles[file]]
                    .map(names.normalize); // TODO: why not just names.normalize?
                resolve({
                    name: _.uniq(bankNames),
                    dateIssue: dates.format(bank.dateIssue),
                    link: url
                });
            });
            pdfParser.parseBuffer(pdf);
        }));

        Promise.all(promises).then(banks => {
            banks = banks.filter(bank => bank);
            int.write('nbu/banks-pdf', banks);
            console.log(banks.length);
            console.log('Time:', new Date() - startTime)
        });
    },

    extractText(object) {
        const text = [];
        _.forOwn(object, (value, key) => {
            if (key === 'T') {
                text.push(decodeURIComponent(value));
            } else if (_.isObject(value)) {
                text.push(...this.extractText(value));
            }
        });
        return text.join('');
    }
};