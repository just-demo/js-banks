let fs = require('fs');
let mkdirp = require('mkdirp');
let path = require('path');
let request = require('sync-request');
const asyncRequest = require('request-promise-native');
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

    asyncReadURL(url, encoding) {
        return asyncRequest({
            uri: url,
            headers: {'User-Agent': 'javascript'},
            resolveWithFullResponse: true,
            encoding: 'binary',
            // transform: body => encoding ? iconv.decode(body, encoding) : body
            // TODO: test timing and simplify if encoding is default
            // TODO: try https://github.com/ashtuchkin/iconv-lite
        }).then(response => iconv.decode(response.body, encoding || 'utf8'));
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