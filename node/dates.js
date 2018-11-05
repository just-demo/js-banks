let moment = require('moment');

module.exports = {
    format(date) {
        return date ? date.split('.').reverse().map(part => part.trim()).join('-') : null;
    },

    formatTimestamp(timestamp) {
        return moment(timestamp).format('YYYY-MM-DD');
    }
};