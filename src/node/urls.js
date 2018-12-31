import request from 'request';
import iconv from 'iconv-lite';

export default {
    read(url, encoding) {
        return new Promise((resolve, reject) => {
            const options = {
                url: url,
                // TODO: find a way to disable cors, this one does not work in browser
                // mode: 'no-cors',
                headers: {'User-Agent': 'javascript'}
            };

            if (encoding || encoding === null) {
                options.encoding = null;
            }

            request(options, (error, response, body) => {
                error ? reject(error) : resolve(encoding ? iconv.decode(body, encoding) : body);
            });
        });
    },

    download(url) {
        return this.read(url, null);
    }
};