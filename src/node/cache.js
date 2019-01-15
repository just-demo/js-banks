import isNode from 'detect-node';
import files from './files';
import urls from './urls';

const nodeCache = {
    // debug just for troubleshooting
    write(file, obj) {
        file = '../../data/json/' + file + '.json';
        return perform('WRITE', file, () => files.writeJson(file, obj).then(() => obj))
    },

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

const browserCache = {
    // debug just for troubleshooting
    write(file, obj) {
        return Promise.resolve(obj);
    },

    read(file, url) {
        return proxy('read', file, url);
    },

    download(file, url) {
        return proxy('download', file, url);
    },

    calc(cache, operation) {
        return perform('CALC', cache, operation);
    }
};

export default isNode ? nodeCache : browserCache;

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