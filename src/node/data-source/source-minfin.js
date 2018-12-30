const _ = require('lodash');
const names = require('../names');
const ext = require('../external');
const int = require('../internal');
const assert = require('../assert');
const regex = require('../regex');
const mapAsync = require('../map-async');
const arrays = require('../arrays');
const Source = require('./source');

class SourceMinfin extends Source {
    constructor() {
        super('minfin');
    }

    getBanks() {
        return ext.read('minfin/banks', 'https://minfin.com.ua/ua/banks/all/').then(banksHtml => {
            const banks = regex.findManyObjects(banksHtml, /class="bank-emblem--desktop"[\S\s]+?\/company\/(.+?)\/[\S\s]+?<a href="\/ua\/company\/(.+?)\/">(.+?)<\/a>/g, {
                id: 1, alias: 2, name: 3
            });
            return mapAsync(banks, bank =>
                ext.read('minfin/banks/' + bank.id, 'https://minfin.com.ua/ua/company/' + bank.alias + '/')
                    .then(bankHtml => {
                        const site = regex.findSingleValue(bankHtml, /<div class="item-title">Офіційний сайт<\/div>[\S\s]+?<a.*? href="(.+?)" target="_blank">/g);
                        assert.true('No site', site, bank.name);
                        return {
                            id: parseInt(bank.id),
                            names: [names.normalize(bank.name)],
                            link: 'https://minfin.com.ua/ua/company/' + bank.alias,
                            sites: arrays.of(site)
                        };
                    })
            );
        }).then(banks => {
            banks.sort(names.compareNames);
            return int.write('minfin/banks', banks);
        })
    }

    getRatings() {
        return ext.read('minfin/dates', 'https://minfin.com.ua/ua/banks/rating/').then(html => {
            const dates = regex.findManyValues(html, /<option value="(.+?)".*?>.*?<\/option>/g);
            return mapAsync(dates, date =>
                ext.read('minfin/ratings/' + date, 'https://minfin.com.ua/ua/banks/rating/?date=' + date)
                    .then(dateHtml => {
                        const dateRatings = regex.findManyKeyValue(dateHtml, /data-id="(.+?)"[\S\s]+?data-title="Загальний рейтинг"><span.*?>(.+?)<\/span>/g);
                        return {
                            date: date,
                            ratings: dateRatings
                        }
                    })
            ).then(allDateRatings => {
                const ratings = {};
                _.sortBy(allDateRatings, 'date').forEach(dateRatings => ratings[dateRatings.date] = dateRatings.ratings);
                return int.write('minfin/ratings', ratings);
            });
        });
    }
}

module.exports = SourceMinfin;