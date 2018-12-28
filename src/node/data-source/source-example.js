const Source = require('./source');

class SourceExample extends Source {
    saveBanks() {
        return Promise.resolve([{name: 'Example'}]);
    }
}

module.exports = SourceExample;