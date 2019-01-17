class Audit {
    constructor() {
        this.items = {};
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
        return {
            total: end - start,
            taken: now - start,
            left: end - now
        }
    }

    print() {
        const audit = this.get();
        console.log('Audit (total/taken/left): ', audit.total, audit.taken, audit.left);
    }
}

export default Audit;