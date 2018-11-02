let _ = require('lodash');

module.exports = {
    fetchSingleValue(string, regex, mapping) {
        mapping = mapping || 1;
        const matches = regex.exec(string);
        return matches ? matches[mapping] : null;
    },

    fetchManyValue(string, regex, mapping) {
        mapping = mapping || 1;
        const items = [];
        let matches;
        while ((matches = regex.exec(string))) {
            items.push(matches[mapping]);
        }
        return items;
    },

    fetchManyObject(string, regex, mapping) {
        const items = [];
        let matches;
        while ((matches = regex.exec(string))) {
            const item = {};
            Object.keys(mapping).forEach(key => item[key] = matches[mapping[key]]);
            items.push(item);
        }
        return items;
    },

    fetchManyKeyValue(string, regex, keyMapping, valueMapping) {
        keyMapping = keyMapping || 1;
        valueMapping = valueMapping || 2;
        const items = {};
        let matches;
        while ((matches = regex.exec(string))) {
            items[matches[keyMapping]] = matches[valueMapping];
        }
        return items;
    }
};