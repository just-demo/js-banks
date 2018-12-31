export default {
    of(item) {
        return item ? [item] : [];
    },

    toMap(array, keyMapper, valueMapper) {
        const map = {};
        array.forEach((value, index) => map[keyMapper(value, index)] = valueMapper(value, index));
        return map
    },

    compare(array1, array2) {
        const len = Math.min(array1.length, array2.length);
        for (let i = 0; i < len; i++) {
            const diff = compare(array1[i], array2[i]);
            if (diff) {
                return diff;
            }
        }
        return compare(array1.length, array2.length);
    },

    combineIntersected(arrays) {
        const itemMap = {};
        arrays.forEach(array => array.forEach(value => {
            const item = getItem(value);
            array.filter(val => val !== value)
                .map(val => getItem(val))
                .forEach(it => {
                    item.related.add(it);
                    it.related.add(item);
                });
        }));
        const items = new Set(Object.values(itemMap));

        const combined = [];
        Array.from(items).forEach(item => {
            items.has(item) && combined.push(fetchRelated(item))
        });
        return combined;

        function fetchRelated(item) {
            const related = [item.value];
            items.delete(item);
            item.related.forEach(it => items.has(it) && related.push(...fetchRelated(it)));
            return related;
        }

        function getItem(value) {
            return itemMap[value] = itemMap[value] || {
                value: value,
                related: new Set()
            }
        }
    }
};

function compare(a, b) {
    return a > b ? 1 : a < b ? -1 : 0;
}