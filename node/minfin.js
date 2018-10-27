let utils = require('./utils');
let path = require('path');
let names = require('./names');

module.exports = {
    dates: [
        '2018-07-01', '2018-05-14', '2018-03-07',
        '2017-12-07', '2017-08-18', '2017-05-21', '2017-01-01',
        '2016-10-01', '2016-07-01', '2016-04-01', '2016-01-01',
        '2015-10-01', '2015-07-01', '2015-04-01', '2015-01-01',
        '2014-10-01', '2014-07-01', '2014-04-01', '2014-01-01',
        '2013-10-01', '2013-07-01', '2013-04-01', '2013-01-01',
    ],

    getBanks: function() {
        const banks = {};
        Object.values(utils.fromJson(utils.readFile(this.jsonBanksFile()))).forEach(bank => {
            bank.name = names.bankName(bank.name);
            if (banks[bank.name]) {
                console.log('Duplicate bank name', bank.name);
            }
            banks[bank.name] = bank.name;
        });
        return banks;
    },

    ////////// html \\\\\\\\\\
    fetchAndSaveAllHtml: function(){
        this.fetchAndSaveBanks();
        this.fetchAndSaveRatings();
        this.extractAndSaveBankNames();
        this.fetchAndSaveBankDetails();
        this.extractAndSaveBankDetails();
        this.extractAndSaveBankRatings();
        this.extractAndSaveBankRatingDetails();
    },

    fetchAndSaveBanks: function() {
        utils.writeFile(this.htmlBanksFile(), utils.readURL('https://minfin.com.ua/ua/banks/all/'));
    },

    fetchAndSaveRatings: function() {
        this.dates.forEach(date => this.fetchAndSaveRating(date));
    },

    fetchAndSaveRating(date) {
        utils.writeFile(this.htmlRatingsFile(date), utils.readURL('https://minfin.com.ua/ua/banks/rating/?date=' + date));
    },

    fetchAndSaveBankDetails: function() {
        const banks = this.extractBankNames();
        Object.values(banks).forEach(bank => {
            console.log(bank.alias);
            const file = this.htmlBankFile(bank.alias);
            if (!utils.fileExists(file)) {
                utils.writeFile(file, utils.readURL("https://minfin.com.ua/ua/company/" + bank.alias + '/'));
            }
        });
    },

    ////////// json \\\\\\\\\\
    extractAndSaveBankNames: function() {
        utils.writeFile(this.jsonBanksFile(), utils.toJson(this.extractBankNames()));
    },

    extractAndSaveBankDetails: function() {
        const banks = this.extractBankNames();
        Object.values(banks).forEach(bank => {
            const html = utils.readFile(this.htmlBankFile(bank.alias));
            const regex = /<div class="item-title">Офіційний сайт<\/div>[\S\s]+?<a.*? href="(.+?)" target="_blank">/g;
            let matches;
            while ((matches = regex.exec(html))) {
                bank.site = matches[1];
            }
        });
        utils.writeFile(this.jsonBankDetailsFile(), utils.toJson(banks));
    },

    extractBankNames: function() {
        const html = utils.readFile(this.htmlBanksFile());
        const banks = {};
        const regex = /class="bank-emblem--desktop"[\S\s]+?\/company\/(.+?)\/[\S\s]+?<a href="\/ua\/company\/(.+?)\/">(.+?)<\/a>/g;
        let matches;
        while ((matches = regex.exec(html))) {
            banks[matches[1]] = {
                alias: matches[2],
                name: matches[3]
            };
        }
        return banks;
    },

    extractAndSaveBankRatings: function() {
        const ratings = {};
        this.dates.forEach(date => {
            const dateRatings = {};
            const html = utils.readFile(this.htmlRatingsFile(date));
            const regex = /data-id="(.+?)"[\S\s]+?data-title="Загальний рейтинг"><span.*?>(.+?)<\/span>/g;
            let matches;
            while ((matches = regex.exec(html))) {
                dateRatings[matches[1]] = matches[2];
            }
            ratings[date] = dateRatings;
        });
        utils.writeFile(this.jsonRatingsFile(), utils.toJson(ratings));
    },

    extractAndSaveBankRatingDetails: function() {
        const ratings = {};
        this.dates.forEach(date => {
            const html = utils.readFile(this.htmlRatingsFile(date));
            const regex = /<script>\s*data\s*=([^;]+);\s*<\/script>/g;
            let matches;
            while ((matches = regex.exec(html))) {
                ratings[date] = JSON.parse(matches[1].replace(/(\d+):/g, '"$1":').replace(/'/g, '"'));
            }
        });
        utils.writeFile(this.jsonRatingDetailsFile(), utils.toJson(ratings));
    },

    ////////// files \\\\\\\\\\
    htmlRatingsFile: function(date) {
        return path.resolve(this.htmlFolder(), 'ratings', date + '.html');
    },

    htmlBanksFile : function(){
        return path.resolve(this.htmlFolder(), 'banks.html');
    },

    htmlBankFile : function(alias){
        return path.resolve(this.htmlFolder(), 'banks', alias + '.html');
    },

    jsonRatingDetailsFile: function (){
        return path.resolve(this.jsonFolder(), 'bank-rating-details.json');
    },

    jsonRatingsFile: function (){
        return path.resolve(this.jsonFolder(), 'bank-ratings.json');
    },

    jsonBanksFile: function (){
        return path.resolve(this.jsonFolder(), 'banks.json');
    },

    jsonBankDetailsFile: function (){
        return path.resolve(this.jsonFolder(), 'bank-details.json');
    },

    htmlFolder: function() {
        return path.resolve(this.dataFolder(), 'html');
    },

    jsonFolder: function() {
        return path.resolve(this.dataFolder(), 'json');
    },

    dataFolder: function() {
        return path.resolve('.', 'minfin');
    }
};