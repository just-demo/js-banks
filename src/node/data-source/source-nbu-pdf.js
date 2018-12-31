const _ = require('lodash');
const names = require('../names');
const cache = require('../cache');
const dates = require('../dates');
const regex = require('../regex');
const pdfs = require('../pdfs');
const path = require('path');
const mapAsync = require('../map-async');
const Source = require('./source');

class SourceNbuPDF extends Source {
    // Банківський нагляд -> Реєстрація та ліцензування -> Банківські ліцензії та види діяльності банків України:
    // https://bank.gov.ua/control/uk/publish/article?art_id=52047
    getBanks() {
        const startTime = new Date();
        // TODO: why does "ІННОВАЦІЙНО-ПРОМИСЛОВИЙ БАНК" fall into different buckets?
        // TODO: is art_id the same? consider fetching the link from UI page
        return cache.read('nbu/not-banks', 'https://bank.gov.ua/control/uk/publish/article?art_id=52047').then(html => {
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
                // TODO: remove this temporary optimization and inline process function when there only one usage left
                return cache.calc(textFile, () => null)
                    .then(text => text || cache.download('nbu/not-banks/pdf/' + file, url).then(pdf => cache.calc(textFile, () => pdfs.parse(pdf))))
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
                return cache.write('nbu/banks-pdf', banks);
            });
        });
    }
}

module.exports = SourceNbuPDF;

