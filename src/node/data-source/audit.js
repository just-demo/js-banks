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

    print() {
        let now = new Date().getTime();
        let start = now;
        let end = now;
        Object.values(this.items).forEach(item => {
            start = Math.min(start, item.start);
            if (item.done && item.done < item.total) {
                end = Math.max(end, item.start + (now - item.start) * item.total / item.done);
            }
        });

        console.log('Audit (total/taken/left): ', end - start, now - start, end - now);
    }
}

export default Audit;