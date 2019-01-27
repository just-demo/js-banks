import _ from 'lodash';
import path from 'path';
import files from './files';
import urls from './urls';

export default {
    // debug just for troubleshooting
    write(file, obj) {
        file = filePath(file + '.json');
        return perform('WRITE', file, () => files.writeJson(file, obj).then(() => obj))
    },

    read(file, url, encoding) {
        file = filePath(file);
        return files.exists(file).then(exists =>
            exists ?
                perform('READ', file, () => files.read(file)) :
                perform('GET', url, () => urls.read(url, encoding))
                    .then(data => files.write(file, data))
        );
    },

    download(file, url) {
        file = filePath(file);
        return files.exists(file).then(exists =>
            exists ?
                perform('READ', file, () => files.readRaw(file)) :
                perform('GET', url, () => urls.download(url))
                    .then(data => files.writeRaw(file, data))
        );
    },

    calc(cache, operation) {
        const file = filePath(cache);
        return files.exists(file).then(exists =>
            exists ?
                perform('READ', file, () => files.read(file)) :
                perform('CALC', cache, operation)
                    .then(data => data && files.write(file, data))
        );
    },

    delete(file) {
        file = filePath(file);
        return files.exists(file).then(exists => exists && perform('DELETE', file, () => files.delete(file)));
    },

    clear() {
        const dir = cacheDir();
        return files.exists(dir).then(exists => exists && files.rename(dir, dir + new Date().getTime()));
    }
};

function filePath(file) {
    if (!path.extname(file)) {
        file += '.html';
    }
    const subFolder = _.trimStart(path.extname(file), '.');
    return cacheDir() + '/' + subFolder + '/' + file;
}

function cacheDir() {
    return '../../data';
}

function perform(type, source, operation) {
    const startTime = new Date();
    return Promise.resolve(operation()).then(data => {
        console.log(type, source, (new Date() - startTime) + 'ms');
        return data;
    });
}