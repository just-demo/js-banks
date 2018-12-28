let fs = require('fs');
let mkdirp = require('mkdirp');
let path = require('path');
let iconv = require('iconv-lite');

// TODO: log errors
module.exports = {
    write(file, data, encoding) {
        return new Promise(resolve =>
            mkdirp(path.dirname(file), () =>
                fs.writeFile(file, data, encoding, () =>
                    resolve(data)
                )
            )
        );
    },

    writeRaw(file, data) {
        return this.write(file, data, null);
    },

    read(file, encoding) {
        return new Promise(resolve =>
            fs.readFile(file, (err, data) =>
                resolve(encoding === null ? data : iconv.decode(data, encoding || 'utf8'))
            )
        );
    },

    readRaw(file) {
        return this.read(file, null)
    },

    exists(file) {
        return new Promise(resolve =>
            fs.exists(file, exists =>
                resolve(exists)
            )
        );
    }
};