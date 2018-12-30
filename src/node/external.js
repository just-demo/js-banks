const files = require('./files');
const urls = require('./urls');

// TODO: rename the module to cacheable
// TODO: make it an interface and pass no-cache instance in browser mode
module.exports = {
    read(file, url, encoding) {
        file = '../../data/html/' + file + '.html';
        return files.exists(file).then(exists =>
            exists ?
                perform('READ', file, () => files.read(file)) :
                perform('GET', url, () => urls.read(url, encoding))
                    .then(data => files.write(file, data))
        );
    },

    download(file, url) {
        file = '../../data/binary/' + file;
        return files.exists(file).then(exists =>
            exists ?
                perform('READ', file, () => files.readRaw(file)) :
                perform('GET', url, () => urls.download(url))
                    .then(data => files.writeRaw(file, data))
        );
    },

    calc(cache, operation) {
        const file = '../../data/calc/' + cache;
        return files.exists(file).then(exists =>
            exists ?
                perform('READ', file, () => files.read(file)) :
                perform('CALC', cache, operation)
                    .then(data => data && files.write(file, data))
        );
    }
};

function perform(type, source, operation) {
    const startTime = new Date();
    return Promise.resolve(operation()).then(data => {
        console.log(type, source, (new Date() - startTime) + 'ms');
        return data;
    });
}