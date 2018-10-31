let moment = require('moment');

module.exports = {
    format(date) {
        return date.split('.').reverse().map(part => part.trim()).join('-');
    },

    formatTimestamp(timestamp) {
        return moment(timestamp).format('YYYY-MM-DD');
    }
};