const regex = require('./regex');

module.exports = {
    parse(text) {
        return regex.findManyObjects(text, /^GET (.*) (\d+)ms$/gm, {
            url: 1,
            time: 2
        }).map(request => ({
            url: request.url,
            time: parseInt(request.time)
        }));
    }
};