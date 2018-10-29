let fs = require('fs');
let mkdirp = require('mkdirp');
let path = require('path');
let request = require('sync-request');
let iconv = require('iconv-lite');

module.exports = {

    writeFile: function(file, data) {
        mkdirp.sync(path.dirname(file));
        fs.writeFileSync(file, data, 'utf8');
    },

    readFile: function(file, encoding) {
        return encoding ? iconv.decode(fs.readFileSync(file), encoding) : fs.readFileSync(file, 'utf8');
    },

    fileExists: function(file) {
        return fs.existsSync(file);
    },

    readURL: function(url, encoding) {
        const response = request('GET', url, {headers: {'User-Agent': 'javascript'}});
        return encoding ? iconv.decode(response.getBody(), encoding) : response.getBody('utf8');
    },

    toJson: function(object) {
        return JSON.stringify(object, null, 2);
    },

    fromJson: function (json) {
        return JSON.parse(json);
    }
};