const _ = require('lodash');
const names = require('../names');
const ext = require('../external');
const int = require('../internal');
const dates = require('../dates');
const assert = require('../assert');
const regex = require('../regex');
const PDFParser = require('pdf2json');
const path = require('path');
const mapAsync = require('../map-async');

module.exports = {
    // Банківський нагляд -> Реєстрація та ліцензування -> Банківські ліцензії та види діяльності банків України:
    // https://bank.gov.ua/control/uk/publish/article?art_id=52047
    getBanks() {
        const startTime = new Date();
        // TODO: why does "ІННОВАЦІЙНО-ПРОМИСЛОВИЙ БАНК" fall into different buckets?
        // TODO: is art_id the same? consider fetching the link from UI page
        return ext.read('nbu/not-banks', 'https://bank.gov.ua/control/uk/publish/article?art_id=52047').then(html => {
            const bankFiles = {};
            regex.findManyObjects(html, /<a\s+href="files\/Licences_bank\/(.+?)".*?>([\s\S]+?)<\/a>/g, {
                file: 1, name: 2
            }).forEach(bank => {
                bankFiles[bank.file] = bankFiles[bank.file] || [];
                bankFiles[bank.file].push(names.normalize(names.removeTags(bank.name)));
            });
            const files = Object.keys(bankFiles);
            return mapAsync(files, file => {
                const url = 'https://bank.gov.ua/files/Licences_bank/' + file;
                const textFile = 'nbu/not-banks/text/' + path.parse(file).name + '.txt';
                // TODO: to optimize performance consider parsing first page only
                // TODO: remove this temporary optimization and inline process function when there only one usage left
                return ext.calc(textFile, () => null)
                    .then(text => text || ext.download('nbu/not-banks/pdf/' + file, url).then(pdf => ext.calc(textFile, () => parsePdf(pdf))))
                    .then(text => {
                        const bank = regex.findObject(text, /^(.+?)Назва банку(.*?Дата відкликання(\d{2}\.\d{2}\.\d{4}))?/g, {
                            name: 1, problem: 3
                        });
                        const bankNames = [names.extractBankPureName(bank.name), ...bankFiles[file]].map(names.normalize);
                        return {
                            names: _.uniq(bankNames),
                            problem: dates.format(bank.problem) || undefined,
                            link: url,
                            active: !bank.problem
                        };
                    });
            }).then(banks => {
                banks.sort(names.compareNames);
                console.log('PDF time:', new Date() - startTime);
                return int.write('nbu/banks-pdf', banks);
            });
        });
    }
};

function parsePdf(pdf) {
    return new Promise(resolve => {
        const pdfParser = new PDFParser();
        pdfParser.on("pdfParser_dataError", data => {
            console.error(data.parserError);
            resolve(null);
        });
        pdfParser.on("pdfParser_dataReady", data => {
            // Process immediately to save memory
            resolve(extractText(data));
        });
        pdfParser.parseBuffer(pdf);
    });
}

function extractText(object) {
    const text = [];
    _.forOwn(object, (value, key) => {
        if (key === 'T') {
            text.push(decodeURIComponent(value));
        } else if (_.isObject(value)) {
            text.push(...extractText(value));
        }
    });
    return text.join('');
}