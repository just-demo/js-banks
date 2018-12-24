let fs = require('fs');

module.exports = {
    unpack(arjContent) {
        // TODO: extract single file from .arj package, could not find any javascript based solution for that
        return fs.readFileSync('../../data/binary/nbu/RCUKRU.DBF');
    }
};