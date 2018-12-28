let fs = require('fs');
let mkdirp = require('mkdirp');
let path = require('path');
let request = require('sync-request');
let iconv = require('iconv-lite');

module.exports = {

    writeFile(file, data, encoding) {
        mkdirp.sync(path.dirname(file));
        fs.writeFileSync(file, data, encoding || 'utf8');
    },

    readFile(file, encoding) {
        return encoding ? iconv.decode(fs.readFileSync(file), encoding) : fs.readFileSync(file, 'utf8');
    },

    fileExists(file) {
        return fs.existsSync(file);
    },

    readURL(url, encoding) {
        const response = request('GET', url, {headers: {'User-Agent': 'javascript'}});
        return encoding ? iconv.decode(response.getBody(), encoding) : response.getBody('utf8');
    },

    downloadURL(url) {
        // TODO: reuse readURL? try new Buffer(binaryString, 'binary') if performance is acceptable or, even better encoding: null, which shuld produce Buffer according to official documentation
        return request('GET', url, {headers: {'User-Agent': 'javascript'}}).getBody();
    },

    toJson(object) {
        return JSON.stringify(object, null, 2);
    },

    fromJson(json) {
        return JSON.parse(json);
    }
};