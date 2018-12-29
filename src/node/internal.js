const files = require('./files');

module.exports = {
    read(file) {
        return files.read(fullPath(file)).then(json => JSON.parse(json));
    },

    write(file, obj) {
        return files.write(fullPath(file), JSON.stringify(obj, null, 2)).then(() => obj)
    }
};

function fullPath(file) {
    return '../../data/json/' + file + '.json';
}