module.exports = {
    equals(message, ...args) {
        return this.false(message, new Set(args).size > 1, ...args);
    },

    notEquals(message, ...args) {
        // It's enough to show only one argument if they are equal
        return this.true(message, new Set(args).size > 1, args[0]);
    },

    true(message, value, ...args) {
        return this.false(message, !value, ...args);
    },

    false(message, value, ...args) {
        if (value) {
            console.log(message + ':', args);
        }
        return !value;
    }
};