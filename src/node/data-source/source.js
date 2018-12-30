class Source {
    constructor(type) {
        this.type = type;
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
    getBanks() {
        return Promise.resolve([]);
    }
}

module.exports = Source;