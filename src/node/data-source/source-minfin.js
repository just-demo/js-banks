import _ from 'lodash';
import names from '../names';
import cache from '../cache';
import assert from '../assert';
import regex from '../regex';
import mapAsync from '../map-async';
import arrays from '../arrays';

class SourceMinfin {
    constructor(audit) {
        this.audit = audit.branch('minfin', 4);
    }

    getBanks() {
        this.audit.start('banks');
        return cache.read('minfin/banks', 'https://minfin.com.ua/ua/banks/all/').then(banksHtml => {
            const banks = regex.findManyObjects(banksHtml, /class="bank-emblem--desktop"[\S\s]+?\/company\/(.+?)\/[\S\s]+?<a href="\/ua\/company\/(.+?)\/">(.+?)<\/a>/g, {
                id: 1, alias: 2, name: 3
            });
            this.audit.end('banks');
            this.audit.start('bank', banks.length);
            return mapAsync(banks, bank =>
                cache.read('minfin/banks/' + bank.id, 'https://minfin.com.ua/ua/company/' + bank.alias + '/')
                    .then(bankHtml => {
                        const site = regex.findSingleValue(bankHtml, /<div class="item-title">Офіційний сайт<\/div>[\S\s]+?<a.*? href="(.+?)" target="_blank">/g);
                        assert.true('No site', site, bank.name);
                        this.audit.end('bank');
                        return {
                            id: fixIdMismatch(parseInt(bank.id)),
                            names: [names.normalize(bank.name)],
                            link: '/ua/company/' + bank.alias,
                            sites: arrays.of(site)
                        };
                    })
            );
        }).then(banks => {
            banks.sort(names.compareNames);
            return cache.write('minfin/banks', banks);
        })
    }

    getRatings() {
        this.audit.start('dates');
        return cache.read('minfin/dates', 'https://minfin.com.ua/ua/banks/rating/').then(html => {
            const dates = regex.findManyValues(html, /<option value="(.+?)".*?>.*?<\/option>/g);
            this.audit.end('dates');
            this.audit.start('rating', dates.length);
            return mapAsync(dates, date =>
                cache.read('minfin/ratings/' + date, 'https://minfin.com.ua/ua/banks/rating/?date=' + date)
                    .then(dateHtml => {
                        const dateRatings = regex.findManyKeyValue(dateHtml, /data-id="(.+?)"[\S\s]+?data-title="Загальний рейтинг"><span.*?>(.+?)<\/span>/g);
                        this.audit.end('rating');
                        return {
                            date: date,
                            ratings: dateRatings
                        }
                    })
            ).then(allDateRatings => {
                const ratings = {};
                _.sortBy(allDateRatings, 'date').forEach(dateRatings => ratings[dateRatings.date] = dateRatings.ratings);
                return cache.write('minfin/ratings', ratings);
            });
        });
    }
}

function fixIdMismatch(id) {
    // Fix id to match the one in ratings
    // TODO: why did they change id for Дельта Банк?
    return id === 174 ? 65 : id;
}

export default SourceMinfin;