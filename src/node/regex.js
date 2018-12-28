module.exports = {
    findSingleValue(string, regex, mapping) {
        mapping = mapping || 1;
        const match = regex.exec(string);
        return match ? match[mapping] : null;
    },

    findObject(string, regex, mapping) {
        const match = regex.exec(string);
        return match ? buildObject(match, mapping) : null;
    },

    findManyValues(string, regex, mapping) {
        mapping = mapping || 1;
        return findMatches(string, regex).map(match => match[mapping]);
    },

    findManyObjects(string, regex, mapping) {
        return findMatches(string, regex).map(match => buildObject(match, mapping));
    },

    findManyKeyValue(string, regex, keyMapping, valueMapping) {
        keyMapping = keyMapping || 1;
        valueMapping = valueMapping || 2;
        const items = {};
        findMatches(string, regex).forEach(match => items[match[keyMapping]] = match[valueMapping]);
        return items;
    }
};

function findMatches(string, regex) {
    const matches = [];
    let match;
    while ((match = regex.exec(string))) {
        matches.push(match);
    }
    return matches;
}

function buildObject(match, mapping) {
    const item = {};
    Object.keys(mapping).forEach(key => item[key] = match[mapping[key]]);
    return item
}