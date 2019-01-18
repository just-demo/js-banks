import _ from 'lodash';

class Audit {
    constructor(name, count) {
        this.name = name;
        this.count = count || 0;
        this.items = {};
        this.branches = [];
    }

    branch(name, count) {
        const branch = new Audit(name, count);
        this.branches.push(branch);
        return branch;
    }

    ready() {
        return Object.values(this.items).filter(item => item.done).length >= this.count &&
            _.every(this.branches, branch => branch.ready());
    }

    start(key, count) {
        count = count || 1;
        this.items[key] = {
            start: new Date().getTime(),
            total: count,
            done: 0
        };
    }

    end(key) {
        this.items[key].done++;
    }

    progress() {
        const ranges = this.branches.map(branch => branch.progress());
        const now = new Date().getTime();
        let start = _.min(ranges.map(range => range.start)) || now;
        let end = _.max(ranges.map(range => range.end)) || now;
        Object.values(this.items).forEach(item => {
            start = Math.min(start, item.start);
            if (item.done && item.done < item.total) {
                end = Math.max(end, item.start + (now - item.start) * item.total / item.done);
            }
        });

        return {
            start: start,
            end: end
        };
    }
}

export default Audit;