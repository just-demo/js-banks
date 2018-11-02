let utils = require('./utils');
let names = require('./names');
let ext = require('./external');
let int = require('./internal');
let assert = require('./assert');
let regex = require('./regex');

module.exports = {
    getBanks() {
        const banks = {};
        int.read('mf/banks').forEach(bank => {
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
        const banksHtml = ext.read('mf/banks', 'https://minfin.com.ua/ua/banks/all/');
        const banks = regex.fetchManyObject(banksHtml, /class="bank-emblem--desktop"[\S\s]+?\/company\/(.+?)\/[\S\s]+?<a href="\/ua\/company\/(.+?)\/">(.+?)<\/a>/g, {
            id: 1, alias: 2, name: 3
        }).map(bank => {
            const bankHtml = ext.read('mf/banks/' + bank.id, 'https://minfin.com.ua/ua/company/' + bank.alias + '/');
            const site = regex.fetchSingleValue(bankHtml, /<div class="item-title">Офіційний сайт<\/div>[\S\s]+?<a.*? href="(.+?)" target="_blank">/g);
            assert.true('No site', site, bank.name);
            return {
                id: parseInt(bank.id),
                name: bank.name,
                site: site
            }
        });
        int.write('mf/banks', banks);
    },

    saveRatings() {
        const html = ext.read('mf/dates', 'https://minfin.com.ua/ua/banks/rating/');
        const dates = regex.fetchManyValue(html, /<option value="(.+?)".*?>.*?<\/option>/g);
        const ratings = {};
        const ratingDetails = {};
        dates.forEach(date => {
            const dateHtml = ext.read('mf/ratings/' + date, 'https://minfin.com.ua/ua/banks/rating/?date=' + date);
            ratings[date] = regex.fetchManyKeyValue(dateHtml, /data-id="(.+?)"[\S\s]+?data-title="Загальний рейтинг"><span.*?>(.+?)<\/span>/g);
            ratingDetails[date] = this.fromJson(regex.fetchSingleValue(dateHtml, /<script>\s*data\s*=([^;]+);\s*<\/script>/g));
        });
        int.write('mf/ratings', ratings);
        int.write('mf/rating-details', ratingDetails);
    },

    fromJson(json) {
        return utils.fromJson(json.replace(/(\d+):/g, '"$1":').replace(/'/g, '"'));
    }
};