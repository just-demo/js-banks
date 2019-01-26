export default {
    truncate(str, length) {
        return str && str.length > length ? str.substring(0, length - 3) + '...' : str;
    },

    ifExceeds(str, length) {
        return str && str.length > length ? str : null;
    }
}