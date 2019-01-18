class Audit {
    constructor(name, count) {
        this.name = name;
        this.count = count;
        this.items = {};
        this.branches = [];
    }

    branch(name, count) {
        const branch = new Audit(name, count);
        this.branches.push(branch);
        return branch;
    }

    ready() {
        return Object.values(this.items) >= this.count && _.every(this.branches, branch => branch.ready());
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
        this.print();
    }

    // TODO: introduce .ready() method in conjunction with audit branching to make sure progress starts calculating only after all queries are known and progress is never reduced
    get() {
        let now = new Date().getTime();
        let start = now;
        let end = now;
        Object.values(this.items).forEach(item => {
            start = Math.min(start, item.start);
            if (item.done && item.done < item.total) {
                end = Math.max(end, item.start + (now - item.start) * item.total / item.done);
            }
        });
        const curr = {
            start: start,
            end: end
        };
        // TODO: start here!!!
        this.branches.map(branch => branch.get)
        // return {
        //     total: end - start,
        //     taken: now - start,
        //     left: end - now
        // }
    }

    print() {
        const audit = this.get();
        console.log('Audit (total/taken/left): ', audit.total, audit.taken, audit.left);
    }
}

export default Audit;