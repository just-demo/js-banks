const isNode = require('detect-node');

module.exports = {
    testNode() {
        return 'Is node: ' + isNode;
    }
};