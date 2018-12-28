const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

// TODO: make async
module.exports = {
    read(file) {
        file = fullPath(file);
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    },

    write(file, obj) {
        file = fullPath(file);
        mkdirp.sync(path.dirname(file));
        fs.writeFileSync(file, JSON.stringify(obj, null, 2), 'utf8');
    }
};

function fullPath(file) {
    return '../../data/json/' + file + '.json';
}