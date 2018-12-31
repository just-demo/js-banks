import fs from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';
import iconv from 'iconv-lite';

// TODO: log errors
export default {
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

    writeJson(file, obj) {
        return this.write(file, JSON.stringify(obj, null, 2));
    },

    read(file, encoding) {
        return new Promise(resolve =>
            fs.readFile(file, (err, data) =>
                resolve(encoding === null ? data : iconv.decode(data, encoding || 'utf8'))
            )
        );
    },

    readRaw(file) {
        return this.read(file, null);
    },

    exists(file) {
        return new Promise(resolve =>
            fs.exists(file, exists =>
                resolve(exists)
            )
        );
    }
};