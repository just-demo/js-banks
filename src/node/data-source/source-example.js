const Source = require('./source');

class SourceExample extends Source {
    constructor() {
        super('example');
    }

    getBanks() {
        return Promise.resolve([{name: 'Example'}]);
    }
}

module.exports = SourceExample;