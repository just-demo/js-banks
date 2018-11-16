const utils = require('./utils');
const _ = require('lodash');
const names = require('./names');
const convert = require('xml-js');
const ext = require('./external');
const int = require('./internal');
const dates = require('./dates');
const assert = require('./assert');
const arj = require('./arj');
const dbf = require('./dbf');
const regex = require('./regex');
const PDFParser = require('pdf2json');

module.exports = {
    // Банківський нагляд -> Реєстрація та ліцензування -> Банківські ліцензії та види діяльності банків України (missing banks can be found here):
    // https://bank.gov.ua/control/uk/publish/article?art_id=52047&cat_id=11214280

    // https://bank.gov.ua/control/portalmap -> Банківський нагляд -> Реорганізація, припинення та ліквідація
    // https://bank.gov.ua/control/uk/publish/article?art_id=75535&cat_id=17823466
    // https://www.bank.gov.ua/control/bankdict/banks
    // https://bank.gov.ua/control/uk/bankdict/search?name=&type=369&region=&mfo=&edrpou=&size=&group=&fromDate=&toDate=
    // https://bank.gov.ua/control/uk/publish/article?art_id=38441973&cat_id=38459171#get_data_branch
    // https://bank.gov.ua/NBU_BankInfo/get_data_branch?typ=0&json
    // TODO: merge with getBanksAPI amd getBanksDBF ???
    getBanksUI() {
        const banks = {};
        int.read('nbu/banks').forEach(bank => {
            bank.name = names.bankName(bank.name);
            assert.false('Duplicate bank name', banks[bank.name], bank.name);
            banks[bank.name] = bank;
        });
        return banks;
    },

    getBanksAPI() {
        const banks = {};
        int.read('nbu/banks-api').forEach(record => {
            const name = names.bankName(names.extractBankPureName(record['SHORTNAME']));
            assert.false('Duplicate bank name', banks[name], name);
            banks[name] = {
                id: parseInt(record['NKB']),
                name: name,
                dateOpen: dates.format(record['D_OPEN']),
                dateIssue: dates.format(record['D_STAN']),
                // 'Нормальний', 'Режим ліквідації', 'Реорганізація', 'Неплатоспроможний'
                active: ['Нормальний'.toUpperCase(), 'Реорганізація'.toUpperCase()].includes(record['N_STAN'].toUpperCase())
            };
        });
        return banks;
    },

    getBanksDBF() {
        const banks = {};
        int.read('nbu/banks-dbf').forEach(bank => {
            bank.name = names.bankName(bank.name);
            assert.false('Duplicate bank name', banks[bank.name], bank.name);
            banks[bank.name] = bank;
        });
        return banks;
    },

    // TODO: fetch not-paying banks from https://bank.gov.ua/control/uk/publish/article?art_id=75535&cat_id=17823466, e.g. "Фінексбанк"
    saveAll() {
        this.saveBanksDBF();
        this.saveBanksAPI();
        this.saveBanksUI();
        this.saveNotBanks();
    },

    saveBanksDBF() {
        const arjContent = ext.download('nbu/rcukru.arj', 'https://bank.gov.ua/files/RcuKru.arj');
        const dbfContent = arj.unpack(arjContent);
        const records = dbf.parse(dbfContent);
        const header = records[0];
        const banks = records.slice(1).map(record => {
            const map = {};
            header.forEach((field, index) => map[field] = record[index]);
            return map;
        }).filter(record => {
            const isMainNum = record['GLB'] === record['PRKB'];
            const isMainName = !!record['NLF'];
            assert.equals('Different main indicator - ' + record['FULLNAME'], isMainNum, isMainName);
            return isMainNum;
        }).filter(record => {
            const isBankType = !!record['VID'];
            const isBankReg = !!record['DATAR'];
            const isBankGroup = !!record['GR1'];
            // TODO: Приватне акцўонерне товариство "Укра∙нська фўнансова група"?
            assert.equals('Different main indicator - ' + record['FULLNAME'], isBankType, isBankReg, isBankGroup);
            return isBankType;
        }).map(record => {
            assert.equals('Different date - ' + record['FULLNAME'], record['DATAR'], record['D_OPEN']);
            return {
                id: record['SID'],
                name: names.extractBankPureName(record['SHORTNAME']),
                fullName: names.extractBankPureName(record['FULLNAME']),
                dateRegister: dates.formatTimestamp(record['DATAR']),
                dateOpen: dates.formatTimestamp(record['D_OPEN']),
                active: record['REESTR'].toUpperCase() !== 'Л'
            };
        });
        int.write('nbu/banks-dbf', banks);
    },

    saveBanksAPI() {
        const xml = ext.read('nbu/banks-api', 'https://bank.gov.ua/NBU_BankInfo/get_data_branch?typ=0', 'cp1251');
        const json = convert.xml2js(xml, {compact: true});
        const banks = json['BANKBRANCH']['ROW'].map(row => _.forOwn(row, (value, key) => row[key] = value['_text'] || value['_cdata']));
        int.write('nbu/banks-api', banks);
    },

    saveBanksUI() {
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
                const name = this.extractBankPureNameSPC(linkInfo.name);
                const bankHtml = ext.read('nbu/banks/' + id, 'https://bank.gov.ua/control/uk/bankdict/bank?id=' + id);
                const fullName = this.extractBankPureNameSPC(bankHtml.match(/<td.*?>Назва<\/td>\s*?<td.*?>(.+?)<\/td>/)[1]);
                const shortName = this.extractBankPureNameSPC(bankHtml.match(/<td.*?>Коротка назва<\/td>\s*?<td.*?>(.+?)<\/td>/)[1]);
                assert.equals('Short name mismatch', name, shortName);
                return {
                    id: id,
                    name: name,
                    fullName: fullName,
                    dateOpen: dates.format(bank.dateOpen),
                    active: true
                };
            });
        }));

        const htmlInactive = ext.read('nbu/banks-inactive', 'https://bank.gov.ua/control/uk/publish/article?art_id=75535&cat_id=17823466');
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
                active: false
            };
        });

        banks.push(...banksInactive);
        int.write('nbu/banks', banks);
    },

    saveBanksPDF() {
        const html = ext.read('nbu/not-banks', 'https://bank.gov.ua/control/uk/publish/article?art_id=52047');
        const bankFiles = {};
        regex.findManyObjects(html, /<a\s+href="files\/Licences_bank\/(.+?)".*?>([\s\S]+?)<\/a>/g, {
            file: 1, name: 2
        }).forEach(bank => {
            bankFiles[bank.file] = bankFiles[bank.file] || [];
            bankFiles[bank.file].push(bank.name.replace(/<[^>]*>/g, '').replace(/\s+/g, ' '));
        });

        const banks = new Collector(Object.keys(bankFiles).length, (banks) => {
            int.write('nbu/banks-pdf', banks);
            console.log(banks.filter(bank => !bank.issueDate).length);
            console.log(banks.length);
        });

        _.forOwn(bankFiles, (bankNames, file) => {
            const textFile = './binary/nbu/not-banks/text/' + file.split('.')[0] + '.txt';
            function process(text) {
                //Дата відкликання20.07.2011
                const bank = regex.findObject(text,/^(.+?)Назва банку(.*?Дата відкликання(\d{2}\.\d{2}\.\d{4}))?/g, {
                    name: 1, issueDate: 3
                });
                banks.next({
                    names: _.uniq([names.extractBankPureName(bank.name), ...bankNames].map(name => name.toUpperCase())),
                    issueDate: dates.format(bank.issueDate)
                });
            }
            if (utils.fileExists(textFile)) {
                process(utils.readFile(textFile));
                return;
            }
            // TODO: download and process asynchronously
            ext.download('nbu/not-banks/pdf/' + file, 'https://bank.gov.ua/files/Licences_bank/' + file);
            const pdfParser = new PDFParser();
            pdfParser.on("pdfParser_dataError", errData => {
                console.error(errData.parserError);
                banks.next();
            });
            pdfParser.on("pdfParser_dataReady", pdfData => {
                const text = this.extractText(pdfData).join('');
                utils.writeFile('./binary/nbu/not-banks/text/' + file.split('.')[0] + '.txt', text);
                process(text);
            });
            pdfParser.loadPDF("./binary/nbu/not-banks/pdf/" + file);
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
    },

    extractBankPureNameSPC(name) {
        const decoded = name.replace(/&#034;/g, '"');
        assert.notEquals('No xml encoded quotes', decoded, name);
        return names.extractBankPureName(decoded)
    },

    // TODO: fetch based on ids from DBF file
    fetchAndSaveBanksByIds() {
        for (let id = 10300; id < 100000; id++) {
            if (!(id % 100)) {
                console.log('id:', id);
            }
            const html = utils.readURL('https://bank.gov.ua/control/uk/bankdict/bank?id=' + id);
            const type = html.match(/<td.*?>Тип<\/td>\s*?<td.*?>(.+?)<\/td>/);
            if (type && type[1] === 'Банк') {
                const subFolder = (Math.floor(id / 1000) + 1) * 1000;
                utils.writeFile('./html/nbu/banks/ids/' + subFolder + '/' + id + '.html', html);
            }
        }
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