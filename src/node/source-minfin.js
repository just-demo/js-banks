let utils = require('./utils');
let names = require('./names');
let ext = require('./external');
let int = require('./internal');
let assert = require('./assert');
let regex = require('./regex');

module.exports = {
    getBanks() {
        const banks = {};
        int.read('minfin/banks').forEach(bank => {
            bank.name = names.bankName(bank.name);
            assert.false('Duplicate bank name', banks[bank.name], bank.name);
            banks[bank.name] = bank;
        });
        return banks;
    },

    saveAll() {
        this.saveBanks();
        this.saveRatings();
    },

    saveBanks() {
        const banksHtml = ext.read('minfin/banks', 'https://minfin.com.ua/ua/banks/all/');
        const banks = regex.findManyObjects(banksHtml, /class="bank-emblem--desktop"[\S\s]+?\/company\/(.+?)\/[\S\s]+?<a href="\/ua\/company\/(.+?)\/">(.+?)<\/a>/g, {
            id: 1, alias: 2, name: 3
        }).map(bank => {
            const bankHtml = ext.read('minfin/banks/' + bank.id, 'https://minfin.com.ua/ua/company/' + bank.alias + '/');
            const site = regex.findSingleValue(bankHtml, /<div class="item-title">Офіційний сайт<\/div>[\S\s]+?<a.*? href="(.+?)" target="_blank">/g);
            assert.true('No site', site, bank.name);
            return {
                id: parseInt(bank.id),
                name: bank.name,
                link: 'https://minfin.com.ua/ua/company/' + bank.alias,
                site: site
            }
        });
        int.write('minfin/banks', banks);
    },

    saveRatings() {
        const html = ext.read('minfin/dates', 'https://minfin.com.ua/ua/banks/rating/');
        const dates = regex.findManyValues(html, /<option value="(.+?)".*?>.*?<\/option>/g);
        const ratings = {};
        const ratingDetails = {};
        dates.forEach(date => {
            const dateHtml = ext.read('minfin/ratings/' + date, 'https://minfin.com.ua/ua/banks/rating/?date=' + date);
            ratings[date] = regex.findManyKeyValue(dateHtml, /data-id="(.+?)"[\S\s]+?data-title="Загальний рейтинг"><span.*?>(.+?)<\/span>/g);
            ratingDetails[date] = this.fromJson(regex.findSingleValue(dateHtml, /<script>\s*data\s*=([^;]+);\s*<\/script>/g));
        });
        int.write('minfin/ratings', ratings);
        int.write('minfin/rating-details', ratingDetails);
    },

    fromJson(json) {
        return utils.fromJson(json.replace(/(\d+):/g, '"$1":').replace(/'/g, '"'));
    }
};