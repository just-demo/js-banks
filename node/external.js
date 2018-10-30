let utils = require('./utils');

module.exports = {
    read(file, url, encoding) {
        file = './html/' + file + '.html';
        if (utils.fileExists(file)) {
            return utils.readFile(file);
        }
        const html = utils.readURL(url, encoding);
        utils.writeFile(file, html);
        return html;
    }
};