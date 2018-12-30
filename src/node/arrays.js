const _ = require('lodash');

module.exports = {
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

    combineIntersected(...arrays) {
        const combined = [];
        arrays.forEach(array => array.forEach(values => {
            const existing = combined.find(v => intersected(v, values));
            if (existing) {
                existing.push(...values);
            } else {
                combined.push([...values]);
            }
        }));
        return combined.map(array => _.uniq(array));
    }
};

function compare(a, b) {
    return a > b ? 1 : a < b ? -1 : 0;
}

function intersected(array1, array2) {
    // TODO: optimize
    return !!_.intersection(array1, array2).length;
}
