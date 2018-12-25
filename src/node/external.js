let utils = require('./utils');
let fs = require('fs');

module.exports = {
    read(file, url, encoding) {
        file = '../../data/html/' + file + '.html';
        if (utils.fileExists(file)) {
            return read('READ', file, utils.readFile);
        }
        const html = read('GET', url, url => utils.readURL(url, encoding));
        utils.writeFile(file, html);
        return html;
    },

    download(file, url) {
        file = '../../data/binary/' + file;
        if (utils.fileExists(file)) {
            return read('READ', file, file => fs.readFileSync(file));
        }

        const content = read('GET', url, utils.downloadURL);
        utils.writeFile(file, content, 'binary');
        return content;
    },

    // TODO: rename the module to cacheable
    calc(cache, operation) {
        const file = '../../data/calc/' + cache;
        if (utils.fileExists(file)) {
            return read('READ', file, utils.readFile);
        }
        const result = read('CALC', cache, operation);
        result && utils.writeFile(file, result);
        return result;
    },
};

function read(operation, source, reader) {
    const startTime = new Date();
    const result = reader(source);
    console.log(operation, source, (new Date() - startTime) + 'ms');
    return result;
}