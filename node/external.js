let utils = require('./utils');

module.exports = {
    read(file, url, encoding) {
        file = './html/' + file + '.html';
        if (utils.fileExists(file)) {
            console.log('READ', file);
            return utils.readFile(file);
        }
        console.log('GET', url);
        const html = utils.readURL(url, encoding);
        utils.writeFile(file, html);
        return html;
    },

    download(file, url) {
        file = './binary/' + file;
        if (utils.fileExists(file)) {
            console.log('READ', file);
            return utils.readFile(file, 'binary');
        }
        console.log('GET', url);
        const content = utils.downloadURL(url);
        utils.writeFile(file, content, 'binary');
        return content;
    }
};