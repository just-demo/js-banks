const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const iconv = require('iconv-lite');

module.exports = {
    // TODO: remove remaining usages of file related function and rename utils to jsons
    writeFile(file, data, encoding) {
        mkdirp.sync(path.dirname(file));
        fs.writeFileSync(file, data, encoding || 'utf8');
    },

    readFile(file, encoding) {
        return encoding ? iconv.decode(fs.readFileSync(file), encoding) : fs.readFileSync(file, 'utf8');
    },

    toJson(object) {
        return JSON.stringify(object, null, 2);
    },

    fromJson(json) {
        return JSON.parse(json);
    }
};