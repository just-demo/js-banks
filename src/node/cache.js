const isNode = require('detect-node');
const files = require('./files');
const urls = require('./urls');

// TODO: make it an interface and pass no-cache instance in browser mode
module.exports = {
    // debug just for troubleshooting
    write(file, obj) {
        if (!isNode) {
            return Promise.resolve(obj);
        }

        file = '../../data/json/' + file + '.json';
        return perform('WRITE', file, () => files.writeJson(file, obj).then(() => obj))
    },

    read(file, url, encoding) {
        if (!isNode) {
            return proxy('read', file, url)
        }

        file = '../../data/html/' + file + '.html';
        return files.exists(file).then(exists =>
            exists ?
                perform('READ', file, () => files.read(file)) :
                perform('GET', url, () => urls.read(url, encoding))
                    .then(data => files.write(file, data))
        );
    },

    download(file, url) {
        if (!isNode) {
            return proxy('download', file, url)
        }

        file = '../../data/binary/' + file;
        return files.exists(file).then(exists =>
            exists ?
                perform('READ', file, () => files.readRaw(file)) :
                perform('GET', url, () => urls.download(url))
                    .then(data => files.writeRaw(file, data))
        );
    },

    calc(cache, operation) {
        if (!isNode) {
            return perform('CALC', cache, operation);
        }

        const file = '../../data/calc/' + cache;
        return files.exists(file).then(exists =>
            exists ?
                perform('READ', file, () => files.read(file)) :
                perform('CALC', cache, operation)
                    .then(data => data && files.write(file, data))
        );
    }
};

function proxy(type, file, url) {
    const proxyUrl = `http://localhost:3333/${type}/${file}?url=${url}`;
    return perform('PROXY', proxyUrl, () => urls[type](proxyUrl));
}

function perform(type, source, operation) {
    const startTime = new Date();
    return Promise.resolve(operation()).then(data => {
        console.log(type, source, (new Date() - startTime) + 'ms');
        return data;
    });
}