const files = require('./files');
const urls = require('./urls');

// TODO: rename the module to cacheable
// TODO: make it an interface and pass no-cache instance in browser mode
module.exports = {
    read(file, url, encoding) {
        file = '../../data/html/' + file + '.html';
        files.exists(file).then(exists =>
            exists ?
                read('READ', file, files.read) :
                read('GET', url, url => urls.read(url, encoding))
                    .then(data => files.write(file, data))
        );
    },

    download(file, url) {
        file = '../../data/binary/' + file;
        files.exists(file).then(exists =>
            exists ?
                read('READ', file, files.readRaw) :
                read('GET', url, url => urls.download(url))
                    .then(data => files.writeRaw(file, data))
        );
    },

    calc(cache, operation) {
        const file = '../../data/calc/' + cache;
        files.exists(file).then(exists =>
            exists ?
                read('READ', file, files.read) :
                read('CALC', cache, operation)
                // TODO: test empty data
                    .then(data => data && files.write(file, data))
        );
    }
};

function read(operation, source, reader) {
    const startTime = new Date();
    Promise.resolve(reader(source)).then(data => {
        console.log(operation, source, (new Date() - startTime) + 'ms');
        return data;
    });
}