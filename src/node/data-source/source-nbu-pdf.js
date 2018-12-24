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
        // TODO: why does "ІННОВАЦІЙНО-ПРОМИСЛОВИЙ БАНК" fall into different buckets?
        const html = ext.read('nbu/not-banks', 'https://bank.gov.ua/control/uk/publish/article?art_id=52047'); //TODO: is id the same? consider fetching the link from UI page
        const bankFiles = {};
        regex.findManyObjects(html, /<a\s+href="files\/Licences_bank\/(.+?)".*?>([\s\S]+?)<\/a>/g, {
            file: 1, name: 2
        }).forEach(bank => {
            bankFiles[bank.file] = bankFiles[bank.file] || [];
            // TODO: use names.normalize(...)
            bankFiles[bank.file].push(bank.name.replace(/<[^>]*>/g, '').replace(/\s+/g, ' '));
        });

        const banks = new Collector(Object.keys(bankFiles).length, (banks) => {
            int.write('nbu/banks-pdf', banks);
            console.log(banks.length);
        });

        _.forOwn(bankFiles, (bankNames, file) => {
            const link = 'https://bank.gov.ua/files/Licences_bank/' + file;
            // TODO: remove this dependency
            const textFile = '../../data/binary/nbu/not-banks/text/' + file.split('.')[0] + '.txt';
            function process(text) {
                //Дата відкликання20.07.2011
                const bank = regex.findObject(text,/^(.+?)Назва банку(.*?Дата відкликання(\d{2}\.\d{2}\.\d{4}))?/g, {
                    name: 1, dateIssue: 3
                });
                bankNames = [names.extractBankPureName(bank.name), ...bankNames]
                    .map(name => names.normalize(name));
                banks.next({
                    name: _.uniq(bankNames),
                    dateIssue: dates.format(bank.dateIssue),
                    link: link
                });
            }
            if (utils.fileExists(textFile)) {
                process(utils.readFile(textFile));
                return;
            }
            // TODO: download and process asynchronously
            ext.download('nbu/not-banks/pdf/' + file, link);
            const pdfParser = new PDFParser();
            pdfParser.on("pdfParser_dataError", errData => {
                console.error(errData.parserError);
                banks.next();
            });
            pdfParser.on("pdfParser_dataReady", pdfData => {
                const text = this.extractText(pdfData).join('');
                utils.writeFile(textFile, text);
                process(text);
            });
            pdfParser.loadPDF("../../data/binary/nbu/not-banks/pdf/" + file);
            // TODO: wait until all files are parsed and collect data in the very end
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
        return text;
    }
};

function CountDownLatch(count, onComplete) {
    this.notify = () => --count < 1 && onComplete();
}

function Collector(count, onComplete) {
    const items = [];
    this.next = (item) => {
        !_.isUndefined(item) && items.push(item);
        --count < 1 && onComplete(items);
    }
}