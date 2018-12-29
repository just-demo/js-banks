const Source = require('./source');

class SourceExample extends Source {
    getBanks() {
        return Promise.resolve([{name: 'Example'}]);
    }
}

module.exports = SourceExample;