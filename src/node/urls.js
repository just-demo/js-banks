const request = require('request');
const iconv = require('iconv-lite');

module.exports = {
    read(url, encoding) {
        return new Promise(resolve => {
            const options = {
                url: url,
                headers: {'User-Agent': 'javascript'}
            };

            if (encoding || encoding === null) {
                options.encoding = null;
            }

            request(options, (error, response, body) => {
                resolve(encoding ? iconv.decode(body, encoding) : body);
            });
        });
    },

    download(url) {
        return this.read(url, null);
    }
};