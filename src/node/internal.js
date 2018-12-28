let utils = require('./utils');

// TODO: make async
module.exports = {
    read(file) {
        return utils.fromJson(utils.readFile(this.path(file)))
    },

    write(file, obj) {
        utils.writeFile(this.path(file), utils.toJson(obj));
    },

    path(file) {
        return '../../data/json/' + file + '.json';
    }
};