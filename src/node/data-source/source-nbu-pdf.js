import _ from 'lodash';
import promiseRetry from 'promise-retry';
import names from '../names';
import cache from '../cache';
import dates from '../dates';
import regex from '../regex';
import pdfs from '../pdfs';
import mapAsync from '../map-async';

// TODO: rename not-banks to just pdf everywhere, including cache and audit
class SourceNbuPDF {
    constructor(audit) {
        this.audit = audit.branch('nbu-pdf', 2);
    }

    // Банківський нагляд -> Реєстрація та ліцензування -> Банківські ліцензії та види діяльності банків України:
    // https://bank.gov.ua/control/uk/publish/article?art_id=52047
    getBanks() {
        this.audit.start('pdfs');
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
            this.audit.end('pdfs');
            this.audit.start('pdf', files.length);
            return mapAsync(files, file => {
                const link = '/files/Licences_bank/' + file;
                const textFile = 'nbu/not-banks/text/' + file.split('.')[0] + '.txt';
                // TODO: remove this temporary optimization and inline process function when there only one usage left
                return cache.calc(textFile, () => null)
                    .then(text => text ||
                        promiseRetry( (retry, number) => {
                            const cacheFile = 'nbu/not-banks/pdf/' + file;
                            return Promise.resolve(number > 1 && cache.delete(cacheFile))
                                .then(() => cache.download(cacheFile, 'https://bank.gov.ua' + link))
                                .then(pdf => cache.calc(textFile, () => pdfs.parse(pdf)))
                                .catch(retry);
                        }))
                    .then(text => {
                        const bank = regex.findObject(text, /^(.+?)Назва банку(.*?Дата відкликання(\d{2}\.\d{2}\.\d{4}))?/g, {
                            name: 1, problem: 3
                        });
                        const bankNames = [names.extractBankPureName(bank.name), ...bankFiles[file]].map(names.normalize);
                        return {
                            names: _.uniq(bankNames),
                            problem: dates.format(bank.problem) || undefined,
                            link: link,
                            active: !bank.problem
                        };
                    })
                    .catch(error => console.log('PDF error:', file, error))
                    .finally(() => this.audit.end('pdf'));
            }).then(banks => {
                banks.sort(names.compareNames);
                console.log('PDF time:', new Date() - startTime);
                return cache.write('nbu/banks-pdf', banks);
            });
        });
    }
}

export default SourceNbuPDF;

