const _ = require('lodash');
const PDFParser = require('pdf2json');
const hummus = require('hummus');
// const extractText2 = require('./lib/text-extraction');

module.exports = {
    parse(buffer) {
        return new Promise(resolve => {
            const pdfParser = new PDFParser();
            pdfParser.on("pdfParser_dataError", data => {
                console.error(data.parserError);
                resolve(null);
            });
            pdfParser.on("pdfParser_dataReady", data => {
                // Process immediately to save memory
                resolve(extractText(data));
            });
            pdfParser.parseBuffer(buffer);
        });
    },

    parse2(buffer) {
        const stream = new hummus.PDFRStreamForBuffer(buffer);
        const reader = hummus.createReader(stream);
        const result = reader.parsePage(0);
        console.log(result);
        return Promise.resolve(result);
    },

    parse10(buffer) {
        const stream = new hummus.PDFRStreamForBuffer(buffer);
        const reader = hummus.createReader(stream);
        const result = reader.parsePage(0);
        console.log(result);
        return Promise.resolve(result);
    }
};

function extractText(object) {
    const text = [];
    _.forOwn(object, (value, key) => {
        if (key === 'T') {
            text.push(decodeURIComponent(value));
        } else if (_.isObject(value)) {
            text.push(...extractText(value));
        }
    });
    return text.join('');
}