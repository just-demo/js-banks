import regex from './regex';

export default {
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