import moment from 'moment';

export default {
    format(date) {
        return date ? date.split('.').reverse().map(part => part.trim()).join('-') : null;
    },

    formatTimestamp(timestamp) {
        return moment(timestamp).format('YYYY-MM-DD');
    }
};