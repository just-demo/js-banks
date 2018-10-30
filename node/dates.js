module.exports = {
    format(date) {
        return date.split('.').reverse().map(part => part.trim()).join('-');
    }
};