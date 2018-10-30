module.exports = {
    equals(message, ...args) {
        if (new Set(args).size > 1) {
            console.log(message + ':', args);
        }
    },

    false(message, value, ...args) {
        if (value) {
            console.log(message + ':', args);
        }
    }
};