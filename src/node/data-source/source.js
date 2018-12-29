const names = require('../names');
const assert = require('../assert');

class Source {
    // TODO: might not be needed anymore since moved outside source
    getBanks() {
        return this.saveBanks().then(banks => {
            const bankMap = {};
            banks.forEach(bank => {
                bank.name = names.bankName(bank.name);
                assert.false('Duplicate bank name', banks[bank.name], bank.name);
                bankMap[bank.name] = bank;
            });
            return bankMap;
        });
    }

    /**
     * {
     *     id: number
     *     names: string[]
     *     sites: string[]
     *     active: boolean
     *     link: string //TODO: links?
     *     start: date
     *     problem: date
     * }
     */
    saveBanks() {
        return Promise.resolve([]);
    }
}

module.exports = Source;